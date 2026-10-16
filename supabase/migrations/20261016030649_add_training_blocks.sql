begin;

create table public.training_blocks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'draft',
  created_by uuid not null,
  created_at timestamptz not null default now(),

  constraint training_blocks_name_check
    check (
      char_length(btrim(name)) between 1 and 100
    ),

  constraint training_blocks_description_check
    check (
      char_length(description) <= 2000
    ),

  constraint training_blocks_status_check
    check (
      status in ('draft', 'active', 'archived')
    ),

  constraint training_blocks_created_by_fkey
    foreign key (created_by)
    references public.profiles(id)
    on delete restrict
);

comment on table public.training_blocks is
  'A training block containing three ordered mesocycles.';

comment on table public.programs is
  'Reusable mesocycle templates. The application displays programs as mesocycles.';

alter table public.programs
  add column training_block_id uuid,
  add column mesocycle_position smallint;

alter table public.programs
  add constraint programs_training_block_fkey
    foreign key (training_block_id)
    references public.training_blocks(id)
    on delete set null,

  add constraint programs_mesocycle_position_check
    check (
      mesocycle_position is null
      or mesocycle_position between 1 and 3
    ),

  add constraint programs_block_assignment_check
    check (
      (
        training_block_id is null
        and mesocycle_position is null
      )
      or
      (
        training_block_id is not null
        and mesocycle_position is not null
      )
    ),

  add constraint programs_block_position_unique
    unique (training_block_id, mesocycle_position);

create index programs_training_block_id_idx
  on public.programs (training_block_id);

create index training_blocks_created_by_idx
  on public.training_blocks (created_by);

alter table public.training_blocks enable row level security;

revoke all on table public.training_blocks
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.training_blocks
  to service_role;

commit;
