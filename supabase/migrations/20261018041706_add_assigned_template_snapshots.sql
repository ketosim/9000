begin;

-- Prevent the same reusable template from being assigned twice to the same
-- mesocycle. Coaches can duplicate a template in the library when they need
-- two independently named versions.
alter table public.assigned_training_templates
  add constraint assigned_templates_source_unique
    unique (mesocycle_id, source_program_id);

-- Snapshot of each week from an assigned reusable template.
create table public.assigned_template_weeks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null,
  source_week_id uuid,
  week_number integer not null,
  focus text not null default '',
  coaching_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assigned_weeks_assignment_fkey
    foreign key (assignment_id)
    references public.assigned_training_templates(id)
    on delete cascade,

  constraint assigned_weeks_source_fkey
    foreign key (source_week_id)
    references public.program_weeks(id)
    on delete set null,

  constraint assigned_weeks_number_check
    check (week_number between 1 and 12),

  constraint assigned_weeks_focus_check
    check (char_length(focus) <= 200),

  constraint assigned_weeks_notes_check
    check (char_length(coaching_notes) <= 2000),

  constraint assigned_weeks_number_unique
    unique (assignment_id, week_number)
);

create index assigned_weeks_assignment_id_idx
  on public.assigned_template_weeks (assignment_id);

-- Snapshot of each workout within an assigned week.
create table public.assigned_template_workouts (
  id uuid primary key default gen_random_uuid(),
  assigned_week_id uuid not null,
  source_workout_id uuid,
  workout_key uuid not null,
  position integer not null,
  warmup_notes text not null default '',
  estimated_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assigned_workouts_week_fkey
    foreign key (assigned_week_id)
    references public.assigned_template_weeks(id)
    on delete cascade,

  constraint assigned_workouts_source_fkey
    foreign key (source_workout_id)
    references public.program_workouts(id)
    on delete set null,

  constraint assigned_workouts_position_check
    check (position between 1 and 7),

  constraint assigned_workouts_warmup_notes_check
    check (char_length(warmup_notes) <= 2000),

  constraint assigned_workouts_estimated_minutes_check
    check (
      estimated_minutes is null
      or estimated_minutes between 1 and 300
    ),

  constraint assigned_workouts_position_unique
    unique (assigned_week_id, position)
);

create index assigned_workouts_week_id_idx
  on public.assigned_template_workouts (assigned_week_id);

create index assigned_workouts_key_idx
  on public.assigned_template_workouts (workout_key);

-- Snapshot of each prescribed exercise.
--
-- is_deload belongs to this exercise in this assigned week. This allows a
-- different exercise to be marked for deload in every week.
create table public.assigned_template_exercises (
  id uuid primary key default gen_random_uuid(),
  assigned_workout_id uuid not null,
  source_exercise_id uuid,
  exercise_key uuid not null,

  name text not null,
  position integer not null,
  variation text not null default '',
  target_muscles text not null default '',
  machine_settings text not null default '',
  attachment text not null default '',
  setup_instructions text not null default '',
  side text not null default 'both',
  load_convention text not null default 'total',
  load_unit text not null default 'kg',
  coaching_cues text not null default '',
  exercise_group text not null default '',
  coach_notes text not null default '',

  is_deload boolean not null default false,
  personalisation_notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assigned_exercises_workout_fkey
    foreign key (assigned_workout_id)
    references public.assigned_template_workouts(id)
    on delete cascade,

  constraint assigned_exercises_source_fkey
    foreign key (source_exercise_id)
    references public.program_exercises(id)
    on delete set null,

  constraint assigned_exercises_name_check
    check (
      char_length(btrim(name)) between 1 and 100
    ),

  constraint assigned_exercises_position_check
    check (position between 1 and 50),

  constraint assigned_exercises_side_check
    check (
      side in ('both', 'alternating', 'each_side')
    ),

  constraint assigned_exercises_load_convention_check
    check (
      load_convention in (
        'total',
        'per_dumbbell',
        'added_plates',
        'machine_display',
        'assistance',
        'bodyweight'
      )
    ),

  constraint assigned_exercises_load_unit_check
    check (load_unit = 'kg'),

  constraint assigned_exercises_personalisation_notes_check
    check (char_length(personalisation_notes) <= 2000),

  constraint assigned_exercises_position_unique
    unique (assigned_workout_id, position)
);

create index assigned_exercises_workout_id_idx
  on public.assigned_template_exercises (assigned_workout_id);

create index assigned_exercises_key_idx
  on public.assigned_template_exercises (exercise_key);

create index assigned_exercises_deload_idx
  on public.assigned_template_exercises (is_deload)
  where is_deload = true;

-- Snapshot of each prescribed set.
create table public.assigned_template_sets (
  id uuid primary key default gen_random_uuid(),
  assigned_exercise_id uuid not null,
  source_set_id uuid,

  set_number integer not null,
  set_type text not null default 'working',
  reps_min integer not null,
  reps_max integer not null,
  target_load numeric(8,2),
  rir integer,
  rest_seconds integer,
  side_override text,
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assigned_sets_exercise_fkey
    foreign key (assigned_exercise_id)
    references public.assigned_template_exercises(id)
    on delete cascade,

  constraint assigned_sets_source_fkey
    foreign key (source_set_id)
    references public.program_sets(id)
    on delete set null,

  constraint assigned_sets_number_check
    check (set_number between 1 and 50),

  constraint assigned_sets_type_check
    check (
      set_type in ('warmup', 'working', 'top', 'backoff', 'drop')
    ),

  constraint assigned_sets_reps_min_check
    check (reps_min between 1 and 1000),

  constraint assigned_sets_reps_max_check
    check (reps_max between 1 and 1000),

  constraint assigned_sets_reps_range_check
    check (reps_max >= reps_min),

  constraint assigned_sets_target_load_check
    check (
      target_load is null
      or target_load >= 0
    ),

  constraint assigned_sets_rir_check
    check (
      rir is null
      or rir between 0 and 10
    ),

  constraint assigned_sets_rest_seconds_check
    check (
      rest_seconds is null
      or rest_seconds between 0 and 3600
    ),

  constraint assigned_sets_side_override_check
    check (
      side_override is null
      or side_override in ('both', 'alternating', 'each_side')
    ),

  constraint assigned_sets_notes_check
    check (char_length(notes) <= 2000),

  constraint assigned_sets_number_unique
    unique (assigned_exercise_id, set_number)
);

create index assigned_sets_exercise_id_idx
  on public.assigned_template_sets (assigned_exercise_id);

-- Transactionally assign a reusable template and copy its complete structure.
create function public.assign_training_template(
  p_coach_id uuid,
  p_mesocycle_id uuid,
  p_program_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_block_coach_id uuid;
  v_assignment_position integer;
  v_assignment_id uuid;
  v_assigned_week_id uuid;
  v_assigned_workout_id uuid;
  v_assigned_exercise_id uuid;

  v_program public.programs%rowtype;
  v_week record;
  v_workout record;
  v_exercise record;
  v_set record;
begin
  select training_blocks.created_by
  into v_block_coach_id
  from public.client_mesocycles
  join public.training_blocks
    on training_blocks.id = client_mesocycles.training_block_id
  where client_mesocycles.id = p_mesocycle_id
  for update of client_mesocycles;

  if not found or v_block_coach_id <> p_coach_id then
    raise exception 'MESOCYCLE_UNAVAILABLE';
  end if;

  select *
  into v_program
  from public.programs
  where programs.id = p_program_id
    and programs.created_by = p_coach_id;

  if not found then
    raise exception 'TEMPLATE_UNAVAILABLE';
  end if;

  if v_program.status <> 'active' then
    raise exception 'TEMPLATE_NOT_ACTIVE';
  end if;

  if exists (
    select 1
    from public.assigned_training_templates
    where mesocycle_id = p_mesocycle_id
      and source_program_id = p_program_id
  ) then
    raise exception 'TEMPLATE_ALREADY_ASSIGNED';
  end if;

  select coalesce(max(position), 0) + 1
  into v_assignment_position
  from public.assigned_training_templates
  where mesocycle_id = p_mesocycle_id;

  if v_assignment_position > 20 then
    raise exception 'ASSIGNMENT_LIMIT';
  end if;

  insert into public.assigned_training_templates (
    mesocycle_id,
    source_program_id,
    position,
    template_name,
    goal,
    description,
    duration_weeks,
    sessions_per_week,
    source_template_version,
    source_template_revision
  )
  values (
    p_mesocycle_id,
    p_program_id,
    v_assignment_position,
    v_program.name,
    v_program.goal,
    v_program.description,
    v_program.duration_weeks,
    v_program.sessions_per_week,
    v_program.template_version,
    v_program.template_revision
  )
  returning id into v_assignment_id;

  for v_week in
    select *
    from public.program_weeks
    where program_id = p_program_id
    order by week_number
  loop
    insert into public.assigned_template_weeks (
      assignment_id,
      source_week_id,
      week_number,
      focus,
      coaching_notes
    )
    values (
      v_assignment_id,
      v_week.id,
      v_week.week_number,
      v_week.focus,
      v_week.coaching_notes
    )
    returning id into v_assigned_week_id;

    for v_workout in
      select *
      from public.program_workouts
      where week_id = v_week.id
      order by position
    loop
      insert into public.assigned_template_workouts (
        assigned_week_id,
        source_workout_id,
        workout_key,
        position,
        warmup_notes,
        estimated_minutes
      )
      values (
        v_assigned_week_id,
        v_workout.id,
        v_workout.progression_key,
        v_workout.position,
        v_workout.warmup_notes,
        v_workout.estimated_minutes
      )
      returning id into v_assigned_workout_id;

      for v_exercise in
        select *
        from public.program_exercises
        where workout_id = v_workout.id
        order by position
      loop
        insert into public.assigned_template_exercises (
          assigned_workout_id,
          source_exercise_id,
          exercise_key,
          name,
          position,
          variation,
          target_muscles,
          machine_settings,
          attachment,
          setup_instructions,
          side,
          load_convention,
          load_unit,
          coaching_cues,
          exercise_group,
          coach_notes
        )
        values (
          v_assigned_workout_id,
          v_exercise.id,
          v_exercise.progression_key,
          v_exercise.name,
          v_exercise.position,
          v_exercise.variation,
          v_exercise.target_muscles,
          v_exercise.machine_settings,
          v_exercise.attachment,
          v_exercise.setup_instructions,
          v_exercise.side,
          v_exercise.load_convention,
          'kg',
          v_exercise.coaching_cues,
          v_exercise.exercise_group,
          v_exercise.coach_notes
        )
        returning id into v_assigned_exercise_id;

        for v_set in
          select *
          from public.program_sets
          where exercise_id = v_exercise.id
          order by set_number
        loop
          insert into public.assigned_template_sets (
            assigned_exercise_id,
            source_set_id,
            set_number,
            set_type,
            reps_min,
            reps_max,
            target_load,
            rir,
            rest_seconds,
            side_override,
            notes
          )
          values (
            v_assigned_exercise_id,
            v_set.id,
            v_set.set_number,
            v_set.set_type,
            v_set.reps_min,
            v_set.reps_max,
            v_set.target_load,
            v_set.rir,
            v_set.rest_seconds,
            v_set.side_override,
            v_set.notes
          );
        end loop;
      end loop;
    end loop;
  end loop;

  return v_assignment_id;
end;
$function$;

comment on function public.assign_training_template(uuid, uuid, uuid) is
  'Assigns an active reusable template to a client mesocycle and snapshots its complete prescription.';

-- Snapshot data is managed through verified server actions using service_role.
alter table public.assigned_template_weeks enable row level security;
alter table public.assigned_template_workouts enable row level security;
alter table public.assigned_template_exercises enable row level security;
alter table public.assigned_template_sets enable row level security;

revoke all on table public.assigned_template_weeks
  from public, anon, authenticated;

revoke all on table public.assigned_template_workouts
  from public, anon, authenticated;

revoke all on table public.assigned_template_exercises
  from public, anon, authenticated;

revoke all on table public.assigned_template_sets
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.assigned_template_weeks
  to service_role;

grant select, insert, update, delete
  on table public.assigned_template_workouts
  to service_role;

grant select, insert, update, delete
  on table public.assigned_template_exercises
  to service_role;

grant select, insert, update, delete
  on table public.assigned_template_sets
  to service_role;

revoke all on function public.assign_training_template(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute
  on function public.assign_training_template(uuid, uuid, uuid)
  to service_role;

commit;