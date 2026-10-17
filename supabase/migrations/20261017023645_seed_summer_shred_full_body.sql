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
where name = 'Summer Shred Full Body';

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
      'Expected exactly one Summer Shred Full Body template, but found %.',
      v_program_count;
  end if;

  if exists (
    select 1
    from target_program
    where duration_weeks <> 5
       or sessions_per_week <> 3
       or template_version <> 2
  ) then
    raise exception
      'Summer Shred Full Body must be a five-week, three-workout template.';
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
      'Summer Shred Full Body already contains exercises. No data was changed.';
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
  (
    gen_random_uuid(),
    1,
    1,
    'Hack Squat',
    'both',
    'machine_display',
    'Keep the whole foot planted. Lower under control. Drive through the platform without locking the knees forcefully.',
    6,
    10,
    2,
    150
  ),
  (
    gen_random_uuid(),
    1,
    2,
    'Incline Dumbbell Bench Press',
    'both',
    'per_dumbbell',
    'Set the shoulders against the bench. Lower the dumbbells under control. Press upward without bouncing.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    3,
    'Lat Pulldown',
    'both',
    'machine_display',
    'Keep the ribs controlled. Drive the elbows down. Return to a full stretch without shrugging.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    4,
    'Dumbbell Romanian Deadlift',
    'both',
    'per_dumbbell',
    'Soften the knees. Push the hips back. Keep the dumbbells close and stop when the hamstrings are fully stretched.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    5,
    'Cable Lateral Raise',
    'each_side',
    'machine_display',
    'Lead with the elbow. Raise the arm without shrugging. Lower slowly while maintaining cable tension.',
    12,
    20,
    2,
    60
  ),
  (
    gen_random_uuid(),
    1,
    6,
    'Cable Crunch',
    'both',
    'machine_display',
    'Keep the hips stable. Shorten the distance between the ribs and pelvis. Return under control.',
    10,
    15,
    2,
    60
  ),
  (
    gen_random_uuid(),
    2,
    1,
    'Barbell Hip Thrust',
    'both',
    'total',
    'Keep the ribs down. Drive through the feet. Finish with full hip extension without overextending the lower back.',
    6,
    10,
    2,
    150
  ),
  (
    gen_random_uuid(),
    2,
    2,
    'Chest-Supported Machine Row',
    'both',
    'machine_display',
    'Keep the chest supported. Pull the elbows toward the hips. Pause briefly without shrugging.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    2,
    3,
    'Seated Dumbbell Shoulder Press',
    'both',
    'per_dumbbell',
    'Keep the ribs stacked. Press the dumbbells upward smoothly. Lower until the shoulders are comfortably stretched.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    2,
    4,
    'Leg Extension',
    'both',
    'machine_display',
    'Keep the hips against the pad. Extend the knees smoothly. Lower under control to a comfortable stretch.',
    10,
    15,
    2,
    90
  ),
  (
    gen_random_uuid(),
    2,
    5,
    'Seated Leg Curl',
    'both',
    'machine_display',
    'Keep the hips secured. Curl through the full available range. Control the return without lifting the stack.',
    10,
    15,
    2,
    90
  ),
  (
    gen_random_uuid(),
    2,
    6,
    'Rope Triceps Pressdown',
    'both',
    'machine_display',
    'Keep the upper arms still. Extend the elbows fully. Return under control without letting the shoulders roll forward.',
    10,
    15,
    2,
    75
  ),
  (
    gen_random_uuid(),
    3,
    1,
    'Leg Press',
    'both',
    'machine_display',
    'Keep the hips against the pad. Lower to a controlled depth. Drive through the whole foot.',
    8,
    12,
    2,
    150
  ),
  (
    gen_random_uuid(),
    3,
    2,
    'Dumbbell Walking Lunge',
    'each_side',
    'per_dumbbell',
    'Take controlled steps. Keep the front foot planted. Drive through the front leg into the next repetition.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    3,
    3,
    'Machine Chest Press',
    'both',
    'machine_display',
    'Set the shoulders against the pad. Press smoothly without locking the elbows forcefully. Control the return.',
    8,
    12,
    2,
    120
  ),
  (
    gen_random_uuid(),
    3,
    4,
    'Assisted Pull-Up',
    'both',
    'assistance',
    'Begin from a controlled stretch. Drive the elbows down. Avoid swinging and lower smoothly.',
    6,
    10,
    2,
    120
  ),
  (
    gen_random_uuid(),
    3,
    5,
    'Cable Curl',
    'both',
    'machine_display',
    'Keep the upper arms still. Curl without leaning back. Lower until the elbows are fully extended.',
    10,
    15,
    2,
    75
  ),
  (
    gen_random_uuid(),
    3,
    6,
    'Standing Calf Raise',
    'both',
    'machine_display',
    'Lower into a comfortable calf stretch. Rise onto the toes. Pause briefly at the top without bouncing.',
    10,
    15,
    2,
    75
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

  if v_workout_count <> 15 then
    raise exception
      'Expected 15 workouts, found %.',
      v_workout_count;
  end if;

  if v_exercise_count <> 90 then
    raise exception
      'Expected 90 exercises, found %.',
      v_exercise_count;
  end if;

  if v_progression_key_count <> 18 then
    raise exception
      'Expected 18 exercise progression keys, found %.',
      v_progression_key_count;
  end if;

  if v_set_count <> 270 then
    raise exception
      'Expected 270 prescribed sets, found %.',
      v_set_count;
  end if;

  if v_loaded_set_count <> 0 then
    raise exception
      'Template target loads must remain empty.';
  end if;
end;
$$;

commit;