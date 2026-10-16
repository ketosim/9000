begin;

alter table public.training_blocks
  add column mesocycle_count smallint not null default 3;

alter table public.training_blocks
  add constraint training_blocks_mesocycle_count_check
    check (
      mesocycle_count between 1 and 6
    );

alter table public.programs
  drop constraint programs_mesocycle_position_check;

alter table public.programs
  add constraint programs_mesocycle_position_check
    check (
      mesocycle_position is null
      or mesocycle_position between 1 and 6
    );

create or replace function public.validate_program_training_block()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_mesocycle_count smallint;
  v_created_by uuid;
begin
  if new.training_block_id is null then
    return new;
  end if;

  select
    training_blocks.mesocycle_count,
    training_blocks.created_by
  into
    v_mesocycle_count,
    v_created_by
  from public.training_blocks
  where training_blocks.id = new.training_block_id;

  if not found then
    raise exception 'BLOCK_UNAVAILABLE';
  end if;

  if new.created_by <> v_created_by then
    raise exception 'BLOCK_OWNER_MISMATCH';
  end if;

  if new.mesocycle_position > v_mesocycle_count then
    raise exception 'BLOCK_POSITION_LIMIT';
  end if;

  return new;
end;
$function$;

create trigger programs_validate_training_block
before insert or update of
  training_block_id,
  mesocycle_position,
  created_by
on public.programs
for each row
execute function public.validate_program_training_block();

create or replace function public.protect_training_block_reduction()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.mesocycle_count < old.mesocycle_count
    and exists (
      select 1
      from public.programs
      where programs.training_block_id = new.id
        and programs.mesocycle_position > new.mesocycle_count
    )
  then
    raise exception 'BLOCK_POSITIONS_IN_USE';
  end if;

  return new;
end;
$function$;

create trigger training_blocks_protect_reduction
before update of mesocycle_count
on public.training_blocks
for each row
execute function public.protect_training_block_reduction();

comment on table public.training_blocks is
  'An ordered training block containing one to six mesocycles.';

comment on column public.training_blocks.mesocycle_count is
  'Number of ordered mesocycle positions in the block. Defaults to three.';

comment on column public.programs.mesocycle_position is
  'Ordered position of this mesocycle within its training block.';

commit;
