begin;

-- The previous training-block model attached reusable templates directly to
-- blocks. It was never used by the client portal. Stop if unexpected data is
-- present instead of silently deleting it.
do $migration$
begin
  if exists (
    select 1
    from public.training_blocks
  ) then
    raise exception
      'Existing training blocks must be reviewed before changing the client hierarchy.';
  end if;

  if exists (
    select 1
    from public.programs
    where training_block_id is not null
       or mesocycle_position is not null
  ) then
    raise exception
      'Existing template block assignments must be reviewed before changing the client hierarchy.';
  end if;
end;
$migration$;

-- Remove the old relationship between reusable templates and training blocks.
drop trigger if exists programs_validate_training_block
  on public.programs;

drop trigger if exists training_blocks_protect_reduction
  on public.training_blocks;

drop function if exists public.validate_program_training_block();
drop function if exists public.protect_training_block_reduction();

alter table public.programs
  drop column training_block_id,
  drop column mesocycle_position;

alter table public.training_blocks
  drop column mesocycle_count;

-- Training blocks now belong to individual clients.
alter table public.training_blocks
  add column client_id uuid not null,
  add column position integer not null,
  add column starts_on date,
  add column updated_at timestamptz not null default now();

alter table public.training_blocks
  add constraint training_blocks_client_id_fkey
    foreign key (client_id)
    references public.profiles(id)
    on delete restrict,

  add constraint training_blocks_position_check
    check (position > 0),

  add constraint training_blocks_client_position_unique
    unique (client_id, position);

create index training_blocks_client_id_idx
  on public.training_blocks (client_id);

comment on table public.training_blocks is
  'Client-owned training blocks. A client may have multiple ordered blocks.';

comment on column public.training_blocks.created_by is
  'Coach who created and manages the training block.';

comment on column public.training_blocks.client_id is
  'Client receiving this training block.';

comment on column public.training_blocks.position is
  'Display and execution order of the block for this client.';

-- A block contains ordered mesocycles. New blocks will receive three
-- mesocycles by default through the creation action added in the next step.
create table public.client_mesocycles (
  id uuid primary key default gen_random_uuid(),
  training_block_id uuid not null,
  name text not null,
  position integer not null,
  duration_weeks integer,
  status text not null default 'draft',
  starts_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_mesocycles_training_block_fkey
    foreign key (training_block_id)
    references public.training_blocks(id)
    on delete cascade,

  constraint client_mesocycles_name_check
    check (
      char_length(btrim(name)) between 1 and 100
    ),

  constraint client_mesocycles_position_check
    check (
      position between 1 and 6
    ),

  constraint client_mesocycles_duration_weeks_check
    check (
      duration_weeks is null
      or duration_weeks between 1 and 12
    ),

  constraint client_mesocycles_status_check
    check (
      status in ('draft', 'active', 'archived')
    ),

  constraint client_mesocycles_block_position_unique
    unique (training_block_id, position)
);

create index client_mesocycles_training_block_id_idx
  on public.client_mesocycles (training_block_id);

comment on table public.client_mesocycles is
  'Ordered client mesocycles within a training block.';

comment on column public.client_mesocycles.duration_weeks is
  'Established by the first assigned template. Every later assignment must match.';

-- A mesocycle can use several reusable training templates concurrently.
-- These columns preserve the template metadata as it existed when assigned.
create table public.assigned_training_templates (
  id uuid primary key default gen_random_uuid(),
  mesocycle_id uuid not null,
  source_program_id uuid,
  position integer not null,

  template_name text not null,
  goal text not null default '',
  description text not null default '',
  duration_weeks integer not null,
  sessions_per_week integer not null,
  source_template_version integer not null,
  source_template_revision bigint not null,

  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assigned_templates_mesocycle_fkey
    foreign key (mesocycle_id)
    references public.client_mesocycles(id)
    on delete cascade,

  constraint assigned_templates_source_program_fkey
    foreign key (source_program_id)
    references public.programs(id)
    on delete set null,

  constraint assigned_templates_position_check
    check (
      position between 1 and 20
    ),

  constraint assigned_templates_name_check
    check (
      char_length(btrim(template_name)) between 1 and 100
    ),

  constraint assigned_templates_duration_check
    check (
      duration_weeks between 1 and 12
    ),

  constraint assigned_templates_sessions_check
    check (
      sessions_per_week between 1 and 7
    ),

  constraint assigned_templates_mesocycle_position_unique
    unique (mesocycle_id, position)
);

create index assigned_templates_mesocycle_id_idx
  on public.assigned_training_templates (mesocycle_id);

create index assigned_templates_source_program_id_idx
  on public.assigned_training_templates (source_program_id);

comment on table public.assigned_training_templates is
  'Template assignments belonging to a client mesocycle. Template metadata is snapshotted at assignment time.';

-- Copy authoritative template metadata and enforce matching durations.
create function public.prepare_training_template_assignment()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_mesocycle_duration integer;
  v_block_coach_id uuid;
  v_template public.programs%rowtype;
begin
  select
    client_mesocycles.duration_weeks,
    training_blocks.created_by
  into
    v_mesocycle_duration,
    v_block_coach_id
  from public.client_mesocycles
  join public.training_blocks
    on training_blocks.id = client_mesocycles.training_block_id
  where client_mesocycles.id = new.mesocycle_id
  for update of client_mesocycles;

  if not found then
    raise exception 'MESOCYCLE_UNAVAILABLE';
  end if;

  if new.source_program_id is null then
    raise exception 'TEMPLATE_UNAVAILABLE';
  end if;

  select *
  into v_template
  from public.programs
  where programs.id = new.source_program_id
    and programs.created_by = v_block_coach_id;

  if not found then
    raise exception 'TEMPLATE_UNAVAILABLE';
  end if;

  if v_mesocycle_duration is null then
    update public.client_mesocycles
    set
      duration_weeks = v_template.duration_weeks,
      updated_at = now()
    where id = new.mesocycle_id;
  elsif v_mesocycle_duration <> v_template.duration_weeks then
    raise exception 'MESOCYCLE_DURATION_MISMATCH';
  end if;

  new.template_name := v_template.name;
  new.goal := v_template.goal;
  new.description := v_template.description;
  new.duration_weeks := v_template.duration_weeks;
  new.sessions_per_week := v_template.sessions_per_week;
  new.source_template_version := v_template.template_version;
  new.source_template_revision := v_template.template_revision;

  return new;
end;
$function$;

create trigger assigned_templates_prepare
before insert
on public.assigned_training_templates
for each row
execute function public.prepare_training_template_assignment();

-- Do not allow the mesocycle duration to change while assignments use it.
create function public.protect_client_mesocycle_duration()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.duration_weeks is distinct from old.duration_weeks
    and exists (
      select 1
      from public.assigned_training_templates
      where assigned_training_templates.mesocycle_id = old.id
        and assigned_training_templates.duration_weeks
          is distinct from new.duration_weeks
    )
  then
    raise exception 'MESOCYCLE_DURATION_IN_USE';
  end if;

  return new;
end;
$function$;

create trigger client_mesocycles_protect_duration
before update of duration_weeks
on public.client_mesocycles
for each row
execute function public.protect_client_mesocycle_duration();

-- These tables are accessed through verified coach server actions.
alter table public.client_mesocycles enable row level security;
alter table public.assigned_training_templates enable row level security;

revoke all on table public.client_mesocycles
  from public, anon, authenticated;

revoke all on table public.assigned_training_templates
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.client_mesocycles
  to service_role;

grant select, insert, update, delete
  on table public.assigned_training_templates
  to service_role;

commit;