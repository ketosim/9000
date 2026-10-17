begin;

-- Identify the exact template being populated.
create temporary table target_program
on commit drop
as
select
  id,
  duration_weeks,
  sessions_per_week,
  template_version
from public.programs
where name = 'BJJ Strength Base';

do $$
declare
  v_program_count integer;
  v_existing_exercises integer;
begin
  select count(*)
  into v_program_count
  from target_program;

  if v_program_count <> 1 then
    raise exception
      'Expected exactly one BJJ Strength Base template, but found %.',
      v_program_count;
  end if;

  if exists (
    select 1
    from target_program
    where duration_weeks <> 5
       or sessions_per_week <> 2
       or template_version <> 2
  ) then
    raise exception
      'BJJ Strength Base must be a five-week, two-workout template.';
  end if;

  select count(*)
  into v_existing_exercises
  from public.program_exercises exercise
  join public.program_workouts workout
    on workout.id = exercise.workout_id
  join public.program_weeks week
    on week.id = workout.week_id
  join target_program program
    on program.id = week.program_id;

  if v_existing_exercises > 0 then
    raise exception
      'BJJ Strength Base already contains exercises. No data was changed.';
  end if;
end;
$$;


-- One specification row represents the same exercise across all five weeks.
create temporary table exercise_specifications (
  progression_key uuid primary key,
  workout_position integer not null,
  exercise_position integer not null,
  exercise_name text not null,
  side text not null,
  load_convention text not null,
  coaching_cues text not null,
  reps_min integer not null,
  reps_max integer not null,
  rir integer not null,
  rest_seconds integer not null,

  unique (workout_position, exercise_position)
) on commit drop;

insert into exercise_specifications (
  progression_key,
  workout_position,
  exercise_position,
  exercise_name,
  side,
  load_convention,
  coaching_cues,
  reps_min,
  reps_max,
  rir,
  rest_seconds
)
values
  (
    gen_random_uuid(),
    1,
    1,
    'Trap Bar Deadlift',
    'both',
    'total',
    'Brace before lifting. Push the floor away. Finish tall without leaning back.',
    4,
    6,
    3,
    180
  ),
  (
    gen_random_uuid(),
    1,
    2,
    'Dumbbell Bulgarian Split Squat',
    'each_side',
    'per_dumbbell',
    'Keep the front foot planted. Lower under control. Drive through the whole foot.',
    6,
    8,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    3,
    'Chest-Supported Dumbbell Row',
    'both',
    'per_dumbbell',
    'Keep the chest supported. Pull the elbows toward the hips. Pause without shrugging.',
    6,
    10,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    4,
    'Half-Kneeling Landmine Press',
    'each_side',
    'added_plates',
    'Keep the ribs down. Press forward and upward. Reach smoothly at the top.',
    6,
    10,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    5,
    'Cable Pallof Press',
    'each_side',
    'machine_display',
    'Stand tall. Exhale as the arms extend. Resist rotation throughout the repetition.',
    10,
    15,
    2,
    75
  ),
  (
    gen_random_uuid(),
    2,
    1,
    'Front Squat',
    'both',
    'total',
    'Keep the elbows high. Brace before descending. Drive straight up through the whole foot.',
    4,
    6,
    3,
    180
  ),
  (
    gen_random_uuid(),
    2,
    2,
    'Romanian Deadlift',
    'both',
    'total',
    'Soften the knees. Push the hips back. Keep the bar close to the legs.',
    6,
    8,
    2,
    150
  ),
  (
    gen_random_uuid(),
    2,
    3,
    'Neutral-Grip Pull-Up',
    'both',
    'bodyweight',
    'Begin from a controlled hang. Drive the elbows down. Avoid swinging or kicking.',
    5,
    8,
    2,
    150
  ),
  (
    gen_random_uuid(),
    2,
    4,
    'Dumbbell Bench Press',
    'both',
    'per_dumbbell',
    'Set the shoulders against the bench. Keep the forearms vertical. Press without bouncing.',
    6,
    10,
    2,
    120
  ),
  (
    gen_random_uuid(),
    2,
    5,
    'Cable Chop',
    'each_side',
    'machine_display',
    'Keep the hips controlled. Rotate through the upper torso. Return slowly.',
    8,
    12,
    2,
    75
  );


-- Copy the exercise structure into every corresponding weekly workout.
insert into public.program_exercises (
  workout_id,
  name,
  position,
  side,
  load_convention,
  load_unit,
  coaching_cues,
  progression_key
)
select
  workout.id,
  specification.exercise_name,
  specification.exercise_position,
  specification.side,
  specification.load_convention,
  'kg',
  specification.coaching_cues,
  specification.progression_key
from target_program program
join public.program_weeks week
  on week.program_id = program.id
join public.program_workouts workout
  on workout.week_id = week.id
join exercise_specifications specification
  on specification.workout_position = workout.position;


-- Give every exercise three working sets.
-- Target load remains NULL because loads are personalised after assignment.
insert into public.program_sets (
  exercise_id,
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
select
  exercise.id,
  set_number,
  'working',
  specification.reps_min,
  specification.reps_max,
  null,
  specification.rir,
  specification.rest_seconds,
  null,
  ''
from target_program program
join public.program_weeks week
  on week.program_id = program.id
join public.program_workouts workout
  on workout.week_id = week.id
join public.program_exercises exercise
  on exercise.workout_id = workout.id
join exercise_specifications specification
  on specification.workout_position = workout.position
 and specification.exercise_position = exercise.position
 and specification.progression_key = exercise.progression_key
cross join generate_series(1, 3) as set_number;


-- Record that the template content has changed.
update public.programs
set template_revision = template_revision + 1
where id = (
  select id
  from target_program
);


-- Verify the complete result before committing.
do $$
declare
  v_week_count integer;
  v_workout_count integer;
  v_exercise_count integer;
  v_set_count integer;
  v_progression_key_count integer;
  v_loaded_set_count integer;
begin
  select count(*)
  into v_week_count
  from public.program_weeks week
  join target_program program
    on program.id = week.program_id;

  select count(*)
  into v_workout_count
  from public.program_workouts workout
  join public.program_weeks week
    on week.id = workout.week_id
  join target_program program
    on program.id = week.program_id;

  select
    count(*),
    count(distinct exercise.progression_key)
  into
    v_exercise_count,
    v_progression_key_count
  from public.program_exercises exercise
  join public.program_workouts workout
    on workout.id = exercise.workout_id
  join public.program_weeks week
    on week.id = workout.week_id
  join target_program program
    on program.id = week.program_id;

  select
    count(*),
    count(*) filter (where prescribed_set.target_load is not null)
  into
    v_set_count,
    v_loaded_set_count
  from public.program_sets prescribed_set
  join public.program_exercises exercise
    on exercise.id = prescribed_set.exercise_id
  join public.program_workouts workout
    on workout.id = exercise.workout_id
  join public.program_weeks week
    on week.id = workout.week_id
  join target_program program
    on program.id = week.program_id;

  if v_week_count <> 5 then
    raise exception
      'Expected 5 weeks, found %.',
      v_week_count;
  end if;

  if v_workout_count <> 10 then
    raise exception
      'Expected 10 workouts, found %.',
      v_workout_count;
  end if;

  if v_exercise_count <> 50 then
    raise exception
      'Expected 50 exercises, found %.',
      v_exercise_count;
  end if;

  if v_progression_key_count <> 10 then
    raise exception
      'Expected 10 exercise progression keys, found %.',
      v_progression_key_count;
  end if;

  if v_set_count <> 150 then
    raise exception
      'Expected 150 prescribed sets, found %.',
      v_set_count;
  end if;

  if v_loaded_set_count <> 0 then
    raise exception
      'Template target loads must remain empty.';
  end if;
end;
$$;

commit;