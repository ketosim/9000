begin;

-- Use the coach who owns the existing template library.
create temporary table venus_coach
on commit drop
as
select programs.created_by as id
from public.programs
group by programs.created_by
order by count(*) desc
limit 1;

do $$
declare
  v_coach_count integer;
  v_existing_count integer;
begin
  select count(*)
  into v_coach_count
  from venus_coach;

  if v_coach_count <> 1 then
    raise exception
      'Expected one coach-owned template library.';
  end if;

  select count(*)
  into v_existing_count
  from public.programs
  join venus_coach
    on venus_coach.id = programs.created_by
  where lower(btrim(programs.name)) =
    lower('Venus Retrograde');

  if v_existing_count > 0 then
    raise exception
      'Venus Retrograde already exists. No data was changed.';
  end if;
end;
$$;


-- Create the reusable template.
create temporary table venus_program (
  id uuid primary key,
  duration_weeks integer not null,
  sessions_per_week integer not null
) on commit drop;

insert into venus_program (
  id,
  duration_weeks,
  sessions_per_week
)
values (
  gen_random_uuid(),
  5,
  3
);

insert into public.programs (
  id,
  name,
  goal,
  description,
  duration_weeks,
  sessions_per_week,
  status,
  created_by,
  template_version,
  template_revision
)
select
  venus_program.id,
  'Venus Retrograde',
  'Build balanced full-body strength and muscle across the glutes, legs, chest, back, shoulders and arms.',
  'A three-day full-body training template. Every session combines upper- and lower-body work. Priority movements include hip thrusts, leg press, chest press, push-ups, lateral raises and direct arm work. Week 5 reduces volume for recovery.',
  venus_program.duration_weeks,
  venus_program.sessions_per_week,
  'active',
  venus_coach.id,
  2,
  1
from venus_program
cross join venus_coach;


-- Generate five weeks. Week 5 is the deload.
insert into public.program_weeks (
  program_id,
  week_number,
  focus,
  coaching_notes,
  is_deload
)
select
  venus_program.id,
  week_number,
  case week_number
    when 1 then 'Technique and baseline effort'
    when 2 then 'Build consistent working volume'
    when 3 then 'Progress repetitions or load'
    when 4 then 'Strongest productive training week'
    when 5 then 'Reduced-volume deload'
  end,
  case week_number
    when 1 then
      'Choose conservative starting loads and finish most sets with approximately three repetitions in reserve.'
    when 2 then
      'Keep technique stable and add repetitions where the previous week felt controlled.'
    when 3 then
      'Add a small amount of load when every set reached the top of its prescribed repetition range.'
    when 4 then
      'Train hard without sacrificing technique. Stop before form breaks down.'
    when 5 then
      'Use lighter loads, fewer sets and approximately four repetitions in reserve.'
  end,
  week_number = 5
from venus_program
cross join generate_series(1, 5) as week_number;


-- Shared workout keys link corresponding workouts between weeks.
create temporary table venus_workout_keys (
  workout_position integer primary key,
  progression_key uuid not null,
  workout_name text not null,
  warmup_notes text not null,
  estimated_minutes integer not null
) on commit drop;

insert into venus_workout_keys (
  workout_position,
  progression_key,
  workout_name,
  warmup_notes,
  estimated_minutes
)
values
  (
    1,
    gen_random_uuid(),
    'Full Body A',
    'Complete 5–8 minutes of easy movement, then perform progressive warm-up sets for the chest press, hip thrust and leg press.',
    75
  ),
  (
    2,
    gen_random_uuid(),
    'Full Body B',
    'Complete 5–8 minutes of easy movement, then perform progressive warm-up sets for the Romanian deadlift and upper-body pulling movements.',
    85
  ),
  (
    3,
    gen_random_uuid(),
    'Full Body C',
    'Complete 5–8 minutes of easy movement, then perform progressive warm-up sets for the chest press, hip thrust and leg press.',
    80
  );

insert into public.program_workouts (
  week_id,
  name,
  position,
  warmup_notes,
  estimated_minutes,
  progression_key
)
select
  program_week.id,
  workout_key.workout_name,
  workout_key.workout_position,
  workout_key.warmup_notes,
  workout_key.estimated_minutes,
  workout_key.progression_key
from public.program_weeks as program_week
join venus_program
  on venus_program.id = program_week.program_id
cross join venus_workout_keys as workout_key;


-- Each row describes one exercise slot. Its progression key remains the same
-- across all five weeks.
create temporary table venus_exercise_specifications (
  progression_key uuid primary key,
  workout_position integer not null,
  exercise_position integer not null,
  exercise_name text not null,
  side text not null,
  load_convention text not null,
  coaching_cues text not null,
  reps_min integer not null,
  reps_max integer not null,
  normal_sets integer not null,
  deload_sets integer not null,
  rest_seconds integer not null,

  unique (workout_position, exercise_position)
) on commit drop;


insert into venus_exercise_specifications (
  progression_key,
  workout_position,
  exercise_position,
  exercise_name,
  side,
  load_convention,
  coaching_cues,
  reps_min,
  reps_max,
  normal_sets,
  deload_sets,
  rest_seconds
)
values
  -- Day 1
  (
    gen_random_uuid(),
    1,
    1,
    'Machine Chest Press',
    'both',
    'machine_display',
    'Keep the shoulders against the pad. Press smoothly and control the return.',
    6,
    10,
    4,
    3,
    150
  ),
  (
    gen_random_uuid(),
    1,
    2,
    'Barbell Hip Thrust',
    'both',
    'total',
    'Keep the ribs down. Drive through the feet and finish with full hip extension without overextending the lower back.',
    6,
    10,
    4,
    3,
    150
  ),
  (
    gen_random_uuid(),
    1,
    3,
    'Leg Press',
    'both',
    'machine_display',
    'Keep the hips against the pad. Lower to a controlled depth and drive through the whole foot.',
    8,
    12,
    3,
    2,
    150
  ),
  (
    gen_random_uuid(),
    1,
    4,
    'Lat Pulldown',
    'both',
    'machine_display',
    'Keep the ribs controlled. Drive the elbows down and return to a full stretch without shrugging.',
    8,
    12,
    3,
    2,
    120
  ),
  (
    gen_random_uuid(),
    1,
    5,
    'Dumbbell Biceps Curl',
    'both',
    'per_dumbbell',
    'Keep the upper arms still. Curl without leaning back and lower under control.',
    10,
    15,
    3,
    2,
    75
  ),
  (
    gen_random_uuid(),
    1,
    6,
    'Cable Triceps Pressdown',
    'both',
    'machine_display',
    'Keep the upper arms still. Extend the elbows fully and control the return.',
    10,
    15,
    3,
    2,
    75
  ),

  -- Day 2
  (
    gen_random_uuid(),
    2,
    1,
    'Push-Up',
    'both',
    'bodyweight',
    'Keep the body rigid. Lower the chest under control and press without letting the hips sag.',
    8,
    15,
    3,
    2,
    90
  ),
  (
    gen_random_uuid(),
    2,
    2,
    'Dumbbell Lateral Raise',
    'both',
    'per_dumbbell',
    'Lead with the elbows. Raise without shrugging and lower slowly.',
    12,
    20,
    4,
    3,
    60
  ),
  (
    gen_random_uuid(),
    2,
    3,
    'Barbell Romanian Deadlift',
    'both',
    'total',
    'Soften the knees. Push the hips back, keep the bar close and stop when the hamstrings are fully stretched.',
    6,
    10,
    4,
    3,
    150
  ),
  (
    gen_random_uuid(),
    2,
    4,
    'Seated Leg Curl',
    'both',
    'machine_display',
    'Keep the hips secured. Curl through the full available range and control the return.',
    10,
    15,
    3,
    2,
    90
  ),
  (
    gen_random_uuid(),
    2,
    5,
    'Seated Cable Row',
    'both',
    'machine_display',
    'Keep the torso stable. Pull the elbows toward the hips and return under control.',
    8,
    12,
    3,
    2,
    120
  ),
  (
    gen_random_uuid(),
    2,
    6,
    'Dumbbell Biceps Curl',
    'both',
    'per_dumbbell',
    'Keep the upper arms still. Curl without leaning back and lower under control.',
    10,
    15,
    3,
    2,
    75
  ),
  (
    gen_random_uuid(),
    2,
    7,
    'Cable Triceps Pressdown',
    'both',
    'machine_display',
    'Keep the upper arms still. Extend the elbows fully and control the return.',
    10,
    15,
    3,
    2,
    75
  ),
  (
    gen_random_uuid(),
    2,
    8,
    'Cable Rotation Pull',
    'each_side',
    'machine_display',
    'Keep the hips stable. Rotate through the upper trunk and control the return on every repetition.',
    10,
    15,
    4,
    3,
    75
  ),

  -- Day 3
  (
    gen_random_uuid(),
    3,
    1,
    'Machine Chest Press',
    'both',
    'machine_display',
    'Keep the shoulders against the pad. Press smoothly and control the return.',
    8,
    12,
    3,
    2,
    120
  ),
  (
    gen_random_uuid(),
    3,
    2,
    'Push-Up',
    'both',
    'bodyweight',
    'Keep the body rigid. Lower the chest under control and press without letting the hips sag.',
    8,
    15,
    3,
    2,
    90
  ),
  (
    gen_random_uuid(),
    3,
    3,
    'Barbell Hip Thrust',
    'both',
    'total',
    'Keep the ribs down. Drive through the feet and finish with full hip extension without overextending the lower back.',
    8,
    12,
    3,
    2,
    120
  ),
  (
    gen_random_uuid(),
    3,
    4,
    'Leg Press',
    'both',
    'machine_display',
    'Keep the hips against the pad. Lower to a controlled depth and drive through the whole foot.',
    10,
    15,
    4,
    3,
    120
  ),
  (
    gen_random_uuid(),
    3,
    5,
    'Dumbbell Lateral Raise',
    'both',
    'per_dumbbell',
    'Lead with the elbows. Raise without shrugging and lower slowly.',
    12,
    20,
    3,
    2,
    60
  ),
  (
    gen_random_uuid(),
    3,
    6,
    'Lat Pulldown',
    'both',
    'machine_display',
    'Keep the ribs controlled. Drive the elbows down and return to a full stretch without shrugging.',
    8,
    12,
    3,
    2,
    120
  ),
  (
    gen_random_uuid(),
    3,
    7,
    'Seated Leg Curl',
    'both',
    'machine_display',
    'Keep the hips secured. Curl through the full available range and control the return.',
    10,
    15,
    3,
    2,
    90
  );


-- Copy the exercise structure into every week.
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
from venus_program
join public.program_weeks as program_week
  on program_week.program_id = venus_program.id
join public.program_workouts as workout
  on workout.week_id = program_week.id
join venus_exercise_specifications as specification
  on specification.workout_position = workout.position;


-- Weeks 1–4 use the requested volume. Week 5 uses fewer sets and a higher RIR.
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
  generated_set.set_number,
  'working',
  specification.reps_min,
  specification.reps_max,
  null,
  case program_week.week_number
    when 1 then 3
    when 2 then 2
    when 3 then 2
    when 4 then 1
    when 5 then 4
  end,
  specification.rest_seconds,
  null,
  case
    when program_week.week_number = 5 then
      'Deload: use a lighter load and keep every repetition controlled.'
    else
      ''
  end
from venus_program
join public.program_weeks as program_week
  on program_week.program_id = venus_program.id
join public.program_workouts as workout
  on workout.week_id = program_week.id
join public.program_exercises as exercise
  on exercise.workout_id = workout.id
join venus_exercise_specifications as specification
  on specification.workout_position = workout.position
 and specification.exercise_position = exercise.position
 and specification.progression_key = exercise.progression_key
cross join lateral generate_series(
  1,
  case
    when program_week.week_number = 5 then
      specification.deload_sets
    else
      specification.normal_sets
  end
) as generated_set(set_number);


-- Validate the complete template before committing.
do $$
declare
  v_program_count integer;
  v_week_count integer;
  v_workout_count integer;
  v_exercise_count integer;
  v_progression_key_count integer;
  v_set_count integer;
  v_deload_week_count integer;
  v_loaded_set_count integer;
begin
  select count(*)
  into v_program_count
  from public.programs
  join venus_program
    on venus_program.id = programs.id
  where programs.name = 'Venus Retrograde'
    and programs.status = 'active'
    and programs.duration_weeks = 5
    and programs.sessions_per_week = 3;

  select count(*)
  into v_week_count
  from public.program_weeks
  join venus_program
    on venus_program.id = program_weeks.program_id;

  select count(*)
  into v_deload_week_count
  from public.program_weeks
  join venus_program
    on venus_program.id = program_weeks.program_id
  where program_weeks.is_deload = true;

  select count(*)
  into v_workout_count
  from public.program_workouts
  join public.program_weeks
    on program_weeks.id = program_workouts.week_id
  join venus_program
    on venus_program.id = program_weeks.program_id;

  select
    count(*),
    count(distinct program_exercises.progression_key)
  into
    v_exercise_count,
    v_progression_key_count
  from public.program_exercises
  join public.program_workouts
    on program_workouts.id = program_exercises.workout_id
  join public.program_weeks
    on program_weeks.id = program_workouts.week_id
  join venus_program
    on venus_program.id = program_weeks.program_id;

  select
    count(*),
    count(*) filter (
      where program_sets.target_load is not null
    )
  into
    v_set_count,
    v_loaded_set_count
  from public.program_sets
  join public.program_exercises
    on program_exercises.id = program_sets.exercise_id
  join public.program_workouts
    on program_workouts.id = program_exercises.workout_id
  join public.program_weeks
    on program_weeks.id = program_workouts.week_id
  join venus_program
    on venus_program.id = program_weeks.program_id;

  if v_program_count <> 1 then
    raise exception
      'Expected one active Venus Retrograde template, found %.',
      v_program_count;
  end if;

  if v_week_count <> 5 then
    raise exception
      'Expected 5 weeks, found %.',
      v_week_count;
  end if;

  if v_deload_week_count <> 1 then
    raise exception
      'Expected one deload week, found %.',
      v_deload_week_count;
  end if;

  if v_workout_count <> 15 then
    raise exception
      'Expected 15 workouts, found %.',
      v_workout_count;
  end if;

  if v_exercise_count <> 105 then
    raise exception
      'Expected 105 exercises, found %.',
      v_exercise_count;
  end if;

  if v_progression_key_count <> 21 then
    raise exception
      'Expected 21 exercise progression keys, found %.',
      v_progression_key_count;
  end if;

  if v_set_count <> 324 then
    raise exception
      'Expected 324 prescribed sets, found %.',
      v_set_count;
  end if;

  if v_loaded_set_count <> 0 then
    raise exception
      'Template target loads must remain empty.';
  end if;
end;
$$;

commit;