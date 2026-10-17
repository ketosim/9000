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
where name = 'Upper Body Strength';

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
      'Expected exactly one Upper Body Strength template, but found %.',
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
      'Upper Body Strength must be a five-week, two-workout template.';
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
      'Upper Body Strength already contains exercises. No data was changed.';
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
  set_count integer not null,
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
  set_count,
  reps_min,
  reps_max,
  rir,
  rest_seconds
)
values
  -- Workout 1
  (
    gen_random_uuid(), 1, 1,
    'Barbell Bench Press',
    'both', 'total',
    'Set the shoulders against the bench. Keep the feet planted. Lower under control and press without bouncing.',
    4, 4, 6, 2, 180
  ),
  (
    gen_random_uuid(), 1, 2,
    'Weighted Pull-Up',
    'both', 'added_plates',
    'Begin from a controlled hang. Drive the elbows down. Avoid swinging and lower under control.',
    4, 4, 6, 2, 180
  ),
  (
    gen_random_uuid(), 1, 3,
    'Seated Dumbbell Shoulder Press',
    'both', 'per_dumbbell',
    'Keep the ribs stacked. Press smoothly overhead and lower to a comfortable shoulder stretch.',
    3, 6, 8, 2, 120
  ),
  (
    gen_random_uuid(), 1, 4,
    'Chest-Supported Dumbbell Row',
    'both', 'per_dumbbell',
    'Keep the chest supported. Pull the elbows toward the hips. Pause without shrugging.',
    3, 6, 8, 2, 120
  ),
  (
    gen_random_uuid(), 1, 5,
    'Cable Triceps Pressdown',
    'both', 'machine_display',
    'Keep the upper arms still. Extend the elbows fully and return under control.',
    3, 8, 12, 2, 75
  ),
  (
    gen_random_uuid(), 1, 6,
    'Dumbbell Hammer Curl',
    'both', 'per_dumbbell',
    'Keep the wrists neutral and upper arms still. Lower the dumbbells under control.',
    3, 8, 12, 2, 75
  ),

  -- Workout 2
  (
    gen_random_uuid(), 2, 1,
    'Standing Barbell Overhead Press',
    'both', 'total',
    'Brace the trunk. Press the bar vertically and finish with it stacked overhead.',
    4, 4, 6, 2, 180
  ),
  (
    gen_random_uuid(), 2, 2,
    'Barbell Row',
    'both', 'total',
    'Brace the torso. Pull the bar toward the lower ribs. Avoid jerking or excessive body movement.',
    4, 5, 8, 2, 150
  ),
  (
    gen_random_uuid(), 2, 3,
    'Close-Grip Bench Press',
    'both', 'total',
    'Keep the shoulders set and elbows controlled. Press smoothly without bouncing.',
    3, 6, 8, 2, 150
  ),
  (
    gen_random_uuid(), 2, 4,
    'Neutral-Grip Lat Pulldown',
    'both', 'machine_display',
    'Keep the ribs controlled. Drive the elbows down and return to a full stretch.',
    3, 6, 10, 2, 120
  ),
  (
    gen_random_uuid(), 2, 5,
    'Cable Lateral Raise',
    'each_side', 'machine_display',
    'Lead with the elbow. Avoid shrugging and lower slowly under cable tension.',
    3, 10, 15, 2, 75
  ),
  (
    gen_random_uuid(), 2, 6,
    'Cable Face Pull',
    'both', 'machine_display',
    'Pull toward the forehead. Keep the shoulders down and rotate the hands apart.',
    3, 10, 15, 2, 75
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
cross join lateral generate_series(
  1,
  specification.set_count
) as set_number;


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

  if v_workout_count <> 10 then
    raise exception
      'Expected 10 workouts, found %.',
      v_workout_count;
  end if;

  if v_exercise_count <> 60 then
    raise exception
      'Expected 60 exercises, found %.',
      v_exercise_count;
  end if;

  if v_progression_key_count <> 12 then
    raise exception
      'Expected 12 exercise progression keys, found %.',
      v_progression_key_count;
  end if;

  if v_set_count <> 200 then
    raise exception
      'Expected 200 prescribed sets, found %.',
      v_set_count;
  end if;

  if v_loaded_set_count <> 0 then
    raise exception
      'Template target loads must remain empty.';
  end if;
end;
$$;

commit;