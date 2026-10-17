begin;

create temporary table target_program
on commit drop
as
select
  id,
  duration_weeks,
  sessions_per_week,
  template_version
from public.programs
where name = 'Summer Shred High Frequency';

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
      'Expected exactly one Summer Shred High Frequency template, but found %.',
      v_program_count;
  end if;

  if exists (
    select 1
    from target_program
    where duration_weeks <> 5
       or sessions_per_week <> 4
       or template_version <> 2
  ) then
    raise exception
      'Summer Shred High Frequency must be a five-week, four-workout template.';
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
      'Summer Shred High Frequency already contains exercises. No data was changed.';
  end if;
end;
$$;


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
  -- Workout 1: Upper A
  (
    gen_random_uuid(), 1, 1,
    'Incline Dumbbell Bench Press',
    'both', 'per_dumbbell',
    'Set the shoulders against the bench. Lower under control and press without bouncing.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 1, 2,
    'Lat Pulldown',
    'both', 'machine_display',
    'Keep the ribs controlled. Drive the elbows down and return to a full stretch.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 1, 3,
    'Machine Chest Press',
    'both', 'machine_display',
    'Keep the shoulders against the pad. Press smoothly and control the return.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 1, 4,
    'Chest-Supported Machine Row',
    'both', 'machine_display',
    'Keep the chest supported. Pull the elbows toward the hips without shrugging.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 1, 5,
    'Cable Lateral Raise',
    'each_side', 'machine_display',
    'Lead with the elbow. Avoid shrugging and lower slowly under cable tension.',
    12, 20, 2, 60
  ),
  (
    gen_random_uuid(), 1, 6,
    'Rope Triceps Pressdown',
    'both', 'machine_display',
    'Keep the upper arms still. Extend fully and return under control.',
    10, 15, 2, 75
  ),

  -- Workout 2: Lower A
  (
    gen_random_uuid(), 2, 1,
    'Hack Squat',
    'both', 'machine_display',
    'Keep the whole foot planted. Lower under control and drive through the platform.',
    6, 10, 2, 150
  ),
  (
    gen_random_uuid(), 2, 2,
    'Dumbbell Romanian Deadlift',
    'both', 'per_dumbbell',
    'Soften the knees. Push the hips back and keep the dumbbells close.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 2, 3,
    'Leg Extension',
    'both', 'machine_display',
    'Keep the hips against the pad. Extend smoothly and lower under control.',
    10, 15, 2, 90
  ),
  (
    gen_random_uuid(), 2, 4,
    'Seated Leg Curl',
    'both', 'machine_display',
    'Keep the hips secured. Curl through the full available range and control the return.',
    10, 15, 2, 90
  ),
  (
    gen_random_uuid(), 2, 5,
    'Standing Calf Raise',
    'both', 'machine_display',
    'Lower into a comfortable stretch. Rise onto the toes and pause briefly.',
    10, 15, 2, 75
  ),
  (
    gen_random_uuid(), 2, 6,
    'Cable Crunch',
    'both', 'machine_display',
    'Keep the hips stable. Bring the ribs toward the pelvis and return slowly.',
    10, 15, 2, 60
  ),

  -- Workout 3: Upper B
  (
    gen_random_uuid(), 3, 1,
    'Seated Dumbbell Shoulder Press',
    'both', 'per_dumbbell',
    'Keep the ribs stacked. Press smoothly and lower to a comfortable shoulder stretch.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 3, 2,
    'Assisted Pull-Up',
    'both', 'assistance',
    'Begin from a controlled stretch. Drive the elbows down and avoid swinging.',
    6, 10, 2, 120
  ),
  (
    gen_random_uuid(), 3, 3,
    'Cable Chest Fly',
    'both', 'machine_display',
    'Keep a soft elbow bend. Bring the hands together and control the stretched position.',
    10, 15, 2, 75
  ),
  (
    gen_random_uuid(), 3, 4,
    'Single-Arm Cable Row',
    'each_side', 'machine_display',
    'Keep the torso stable. Pull the elbow toward the hip and return to a full reach.',
    8, 12, 2, 90
  ),
  (
    gen_random_uuid(), 3, 5,
    'Reverse Pec Deck',
    'both', 'machine_display',
    'Keep the chest supported. Open the arms without shrugging and return slowly.',
    12, 20, 2, 60
  ),
  (
    gen_random_uuid(), 3, 6,
    'Cable Curl',
    'both', 'machine_display',
    'Keep the upper arms still. Curl without leaning back and lower fully.',
    10, 15, 2, 75
  ),

  -- Workout 4: Lower B
  (
    gen_random_uuid(), 4, 1,
    'Leg Press',
    'both', 'machine_display',
    'Keep the hips against the pad. Lower to a controlled depth and drive through the whole foot.',
    8, 12, 2, 150
  ),
  (
    gen_random_uuid(), 4, 2,
    'Barbell Hip Thrust',
    'both', 'total',
    'Keep the ribs down. Drive through the feet and finish with full hip extension.',
    6, 10, 2, 150
  ),
  (
    gen_random_uuid(), 4, 3,
    'Dumbbell Walking Lunge',
    'each_side', 'per_dumbbell',
    'Take controlled steps. Keep the front foot planted and drive through the front leg.',
    8, 12, 2, 120
  ),
  (
    gen_random_uuid(), 4, 4,
    'Lying Leg Curl',
    'both', 'machine_display',
    'Keep the hips against the pad. Curl smoothly and control the return.',
    10, 15, 2, 90
  ),
  (
    gen_random_uuid(), 4, 5,
    'Seated Calf Raise',
    'both', 'machine_display',
    'Lower into a full stretch. Rise onto the toes and pause briefly at the top.',
    10, 15, 2, 75
  ),
  (
    gen_random_uuid(), 4, 6,
    'Hanging Knee Raise',
    'both', 'bodyweight',
    'Keep the torso controlled. Curl the pelvis upward and lower without swinging.',
    8, 15, 2, 60
  );


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


update public.programs
set template_revision = template_revision + 1
where id = (
  select id
  from target_program
);


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
    count(*) filter (
      where prescribed_set.target_load is not null
    )
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

  if v_workout_count <> 20 then
    raise exception
      'Expected 20 workouts, found %.',
      v_workout_count;
  end if;

  if v_exercise_count <> 120 then
    raise exception
      'Expected 120 exercises, found %.',
      v_exercise_count;
  end if;

  if v_progression_key_count <> 24 then
    raise exception
      'Expected 24 exercise progression keys, found %.',
      v_progression_key_count;
  end if;

  if v_set_count <> 360 then
    raise exception
      'Expected 360 prescribed sets, found %.',
      v_set_count;
  end if;

  if v_loaded_set_count <> 0 then
    raise exception
      'Template target loads must remain empty.';
  end if;
end;
$$;

commit;
