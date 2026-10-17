begin;

do $seed$
declare
  v_program_id uuid;
  v_week_count integer;
  v_workout_count integer;
begin
  select id
  into v_program_id
  from public.programs
  where name = 'Upper Body Hypertrophy'
    and created_by = (
      select created_by
      from public.programs
      where name = 'Upper Body Strength'
      limit 1
    )
  order by created_at
  limit 1;

  if v_program_id is null then
    raise exception
      'Upper Body Hypertrophy template was not found.';
  end if;

  update public.programs
  set
    goal =
      'Build upper-body muscle with balanced chest, back, shoulder and arm development.',
    description =
      'Two upper-body hypertrophy workouts per week. Prescriptions use moderate-to-high repetitions and controlled proximity to failure. Loads are personalised when the template is assigned to a client.',
    duration_weeks = 5,
    sessions_per_week = 2,
    status = 'draft'
  where id = v_program_id;

  select count(*)
  into v_week_count
  from public.program_weeks
  where program_id = v_program_id;

  select count(*)
  into v_workout_count
  from public.program_workouts workout
  join public.program_weeks week
    on week.id = workout.week_id
  where week.program_id = v_program_id;

  if v_week_count <> 5 or v_workout_count <> 10 then
    raise exception
      'Upper Body Hypertrophy must contain five weeks and two workouts per week before it can be seeded.';
  end if;

  /*
   * The template was originally created empty, but deleting here makes this
   * migration safe if dummy exercises were added before running the seed.
   * Prescribed sets are removed automatically through ON DELETE CASCADE.
   */
  delete from public.program_exercises exercise
  using public.program_workouts workout,
        public.program_weeks week
  where exercise.workout_id = workout.id
    and workout.week_id = week.id
    and week.program_id = v_program_id;

  create temporary table upper_hypertrophy_seed (
    workout_position integer not null,
    exercise_position integer not null,
    exercise_name text not null,
    target_muscles text not null,
    coaching_cues text not null,
    load_convention text not null,
    set_count integer not null,
    reps_min integer not null,
    reps_max integer not null,
    rir integer not null,
    rest_seconds integer not null,
    primary key (workout_position, exercise_position)
  ) on commit drop;

  insert into upper_hypertrophy_seed (
    workout_position,
    exercise_position,
    exercise_name,
    target_muscles,
    coaching_cues,
    load_convention,
    set_count,
    reps_min,
    reps_max,
    rir,
    rest_seconds
  )
  values
    /*
     * Workout 1 — horizontal push and pull emphasis
     */
    (
      1,
      1,
      'Incline Dumbbell Press',
      'Upper chest, anterior deltoids, triceps',
      'Keep the shoulder blades stable and lower the dumbbells under control.',
      'per_dumbbell',
      4,
      6,
      10,
      2,
      150
    ),
    (
      1,
      2,
      'Chest-Supported Dumbbell Row',
      'Upper back, lats, rear deltoids, biceps',
      'Keep the chest supported and drive the elbows back without shrugging.',
      'per_dumbbell',
      4,
      8,
      12,
      2,
      120
    ),
    (
      1,
      3,
      'Machine Chest Press',
      'Chest, anterior deltoids, triceps',
      'Use a controlled stretch and stop before the shoulders roll forward.',
      'machine_display',
      3,
      8,
      12,
      2,
      120
    ),
    (
      1,
      4,
      'Neutral-Grip Lat Pulldown',
      'Lats, upper back, biceps',
      'Pull the elbows toward the ribs and control the return overhead.',
      'machine_display',
      3,
      8,
      12,
      2,
      120
    ),
    (
      1,
      5,
      'Cable Lateral Raise',
      'Lateral deltoids',
      'Lead with the elbow and keep tension on the shoulder throughout.',
      'machine_display',
      4,
      12,
      20,
      2,
      75
    ),
    (
      1,
      6,
      'Reverse Pec Deck',
      'Rear deltoids, upper back',
      'Keep the torso still and move through the rear shoulders.',
      'machine_display',
      3,
      12,
      20,
      2,
      75
    ),

    /*
     * Workout 2 — vertical push and pull, arms
     */
    (
      2,
      1,
      'Seated Dumbbell Shoulder Press',
      'Anterior deltoids, lateral deltoids, triceps',
      'Keep the ribs down and press through a comfortable shoulder path.',
      'per_dumbbell',
      3,
      6,
      10,
      2,
      150
    ),
    (
      2,
      2,
      'Neutral-Grip Lat Pulldown',
      'Lats, upper back, biceps',
      'Drive the elbows down and avoid leaning excessively backward.',
      'machine_display',
      3,
      6,
      10,
      2,
      120
    ),
    (
      2,
      3,
      'Cable Chest Fly',
      'Chest',
      'Maintain a soft elbow bend and bring the upper arms across the torso.',
      'machine_display',
      3,
      10,
      15,
      2,
      90
    ),
    (
      2,
      4,
      'Single-Arm Cable Row',
      'Lats, upper back, biceps',
      'Keep the torso square and pull the elbow toward the hip.',
      'machine_display',
      3,
      10,
      15,
      2,
      90
    ),
    (
      2,
      5,
      'Dumbbell Lateral Raise',
      'Lateral deltoids',
      'Raise through the elbows and avoid using momentum.',
      'per_dumbbell',
      4,
      12,
      20,
      2,
      75
    ),
    (
      2,
      6,
      'Overhead Cable Triceps Extension',
      'Triceps',
      'Keep the upper arms stable and reach a controlled stretch overhead.',
      'machine_display',
      3,
      10,
      15,
      2,
      75
    ),
    (
      2,
      7,
      'Incline Dumbbell Curl',
      'Biceps',
      'Keep the shoulders behind the torso and fully control the lowering phase.',
      'per_dumbbell',
      3,
      10,
      15,
      2,
      75
    );

  insert into public.program_exercises (
    id,
    workout_id,
    name,
    position,
    variation,
    target_muscles,
    machine_settings,
    attachment,
    setup_instructions,
    side,
    coaching_cues,
    exercise_group,
    coach_notes,
    load_unit,
    load_convention,
    progression_key
  )
  select
    gen_random_uuid(),
    workout.id,
    seed.exercise_name,
    seed.exercise_position,
    '',
    seed.target_muscles,
    '',
    '',
    '',
    'both',
    seed.coaching_cues,
    '',
    '',
    'kg',
    seed.load_convention,
    md5(
      'upper-body-hypertrophy:'
      || seed.workout_position::text
      || ':'
      || seed.exercise_position::text
    )::uuid
  from public.program_weeks week
  join public.program_workouts workout
    on workout.week_id = week.id
  join upper_hypertrophy_seed seed
    on seed.workout_position = workout.position
  where week.program_id = v_program_id;

  insert into public.program_sets (
    id,
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
    gen_random_uuid(),
    exercise.id,
    set_number.number,
    'working',
    seed.reps_min,
    seed.reps_max,
    null,
    seed.rir,
    seed.rest_seconds,
    null,
    ''
  from public.program_weeks week
  join public.program_workouts workout
    on workout.week_id = week.id
  join public.program_exercises exercise
    on exercise.workout_id = workout.id
  join upper_hypertrophy_seed seed
    on seed.workout_position = workout.position
   and seed.exercise_position = exercise.position
  cross join lateral generate_series(
    1,
    seed.set_count
  ) as set_number(number)
  where week.program_id = v_program_id;

  update public.programs
  set template_revision = template_revision + 1
  where id = v_program_id;
end;
$seed$;

commit;