begin;

-- Find the empty template created through the coach interface.
create temporary table target_program
on commit drop
as
select
  programs.id,
  programs.created_by,
  programs.duration_weeks,
  programs.sessions_per_week
from public.programs
where lower(btrim(programs.name)) =
  lower('Venus Retrograde');


-- Confirm that it is safe to populate.
do $$
declare
  v_program_count integer;
  v_week_count integer;
  v_workout_count integer;
  v_exercise_count integer;
begin
  select count(*)
  into v_program_count
  from target_program;

  if v_program_count <> 1 then
    raise exception
      'Expected exactly one Venus Retrograde template, but found %.',
      v_program_count;
  end if;

  if exists (
    select 1
    from target_program
    where duration_weeks <> 5
       or sessions_per_week <> 3
  ) then
    raise exception
      'Venus Retrograde must contain five weeks and three workouts per week.';
  end if;

  select count(*)
  into v_week_count
  from public.program_weeks
  join target_program
    on target_program.id = program_weeks.program_id;

  if v_week_count <> 5 then
    raise exception
      'Expected 5 existing weeks, but found %.',
      v_week_count;
  end if;

  select count(*)
  into v_workout_count
  from public.program_workouts
  join public.program_weeks
    on program_weeks.id = program_workouts.week_id
  join target_program
    on target_program.id = program_weeks.program_id;

  if v_workout_count <> 15 then
    raise exception
      'Expected 15 existing workouts, but found %.',
      v_workout_count;
  end if;
end;
$$;

-- Replace any incomplete exercise data already entered in this draft.
-- Prescribed sets are removed first so this works independently of the
-- program_sets foreign-key deletion configuration.
delete from public.program_sets
using
  public.program_exercises,
  public.program_workouts,
  public.program_weeks,
  target_program
where program_sets.exercise_id =
    program_exercises.id
  and program_exercises.workout_id =
    program_workouts.id
  and program_workouts.week_id =
    program_weeks.id
  and program_weeks.program_id =
    target_program.id;

delete from public.program_exercises
using
  public.program_workouts,
  public.program_weeks,
  target_program
where program_exercises.workout_id =
    program_workouts.id
  and program_workouts.week_id =
    program_weeks.id
  and program_weeks.program_id =
    target_program.id;


-- Standardise the name and finish the template metadata.
update public.programs
set
  name = 'Venus Retrograde',
  goal =
    'Build balanced full-body strength and muscle across the glutes, legs, chest, back, shoulders and arms.',
  description =
    'A three-day full-body training template. Every session combines upper- and lower-body work. Priority movements include hip thrusts, leg press, chest press, push-ups, lateral raises and direct arm work. Week 5 reduces volume for recovery.',
  status = 'active',
  template_version = 2,
  template_revision = template_revision + 1
where id = (
  select id
  from target_program
);


-- Add the five-week training structure.
update public.program_weeks
set
  focus = case week_number
    when 1 then 'Technique and baseline effort'
    when 2 then 'Build consistent working volume'
    when 3 then 'Progress repetitions or load'
    when 4 then 'Strongest productive training week'
    when 5 then 'Reduced-volume deload'
  end,
  coaching_notes = case week_number
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
  is_deload = week_number = 5
where program_id = (
  select id
  from target_program
);


-- Give the three workouts descriptive names.
update public.program_workouts
set
  name = case position
    when 1 then 'Full Body A'
    when 2 then 'Full Body B'
    when 3 then 'Full Body C'
  end,
  warmup_notes = case position
    when 1 then
      'Complete 5–8 minutes of easy movement, then perform progressive warm-up sets for the chest press, hip thrust and leg press.'
    when 2 then
      'Complete 5–8 minutes of easy movement, then perform progressive warm-up sets for the Romanian deadlift and upper-body pulling movements.'
    when 3 then
      'Complete 5–8 minutes of easy movement, then perform progressive warm-up sets for the chest press, hip thrust and leg press.'
  end,
  estimated_minutes = case position
    when 1 then 75
    when 2 then 85
    when 3 then 80
  end
from public.program_weeks
join target_program
  on target_program.id = program_weeks.program_id
where program_workouts.week_id = program_weeks.id;


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
  normal_sets integer not null,
  deload_sets integer not null,
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


-- Copy each exercise into the corresponding workout in every week.
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
  program_workout.id,
  specification.exercise_name,
  specification.exercise_position,
  specification.side,
  specification.load_convention,
  'kg',
  specification.coaching_cues,
  specification.progression_key
from target_program
join public.program_weeks
  on program_weeks.program_id = target_program.id
join public.program_workouts as program_workout
  on program_workout.week_id = program_weeks.id
join exercise_specifications as specification
  on specification.workout_position =
    program_workout.position;


-- Weeks 1–4 use the requested volume. Week 5 uses fewer work sets.
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
  program_exercise.id,
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
from target_program
join public.program_weeks as program_week
  on program_week.program_id = target_program.id
join public.program_workouts as program_workout
  on program_workout.week_id = program_week.id
join public.program_exercises as program_exercise
  on program_exercise.workout_id = program_workout.id
join exercise_specifications as specification
  on specification.workout_position =
      program_workout.position
 and specification.exercise_position =
      program_exercise.position
 and specification.progression_key =
      program_exercise.progression_key
cross join lateral generate_series(
  1,
  case
    when program_week.week_number = 5 then
      specification.deload_sets
    else
      specification.normal_sets
  end
) as generated_set(set_number);


-- Verify the completed template before committing.
do $$
declare
  v_program_count integer;
  v_week_count integer;
  v_deload_week_count integer;
  v_workout_count integer;
  v_exercise_count integer;
  v_progression_key_count integer;
  v_set_count integer;
  v_loaded_set_count integer;
begin
  select count(*)
  into v_program_count
  from public.programs
  join target_program
    on target_program.id = programs.id
  where programs.name = 'Venus Retrograde'
    and programs.status = 'active'
    and programs.duration_weeks = 5
    and programs.sessions_per_week = 3;

  select count(*)
  into v_week_count
  from public.program_weeks
  join target_program
    on target_program.id = program_weeks.program_id;

  select count(*)
  into v_deload_week_count
  from public.program_weeks
  join target_program
    on target_program.id = program_weeks.program_id
  where program_weeks.is_deload = true;

  select count(*)
  into v_workout_count
  from public.program_workouts
  join public.program_weeks
    on program_weeks.id = program_workouts.week_id
  join target_program
    on target_program.id = program_weeks.program_id;

  select
    count(*),
    count(distinct program_exercises.progression_key)
  into
    v_exercise_count,
    v_progression_key_count
  from public.program_exercises
  join public.program_workouts
    on program_workouts.id =
      program_exercises.workout_id
  join public.program_weeks
    on program_weeks.id =
      program_workouts.week_id
  join target_program
    on target_program.id =
      program_weeks.program_id;

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
    on program_exercises.id =
      program_sets.exercise_id
  join public.program_workouts
    on program_workouts.id =
      program_exercises.workout_id
  join public.program_weeks
    on program_weeks.id =
      program_workouts.week_id
  join target_program
    on target_program.id =
      program_weeks.program_id;

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
