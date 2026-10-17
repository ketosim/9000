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
  where name = 'Lower Body Hypertrophy'
  order by created_at
  limit 1;

  if v_program_id is null then
    raise exception
      'Lower Body Hypertrophy template was not found.';
  end if;

  update public.programs
  set
    goal =
      'Build quadriceps, glute, hamstring and calf muscle with balanced lower-body volume.',
    description =
      'Two lower-body hypertrophy workouts per week. Workout 1 emphasises the quadriceps, while Workout 2 emphasises the glutes and hamstrings. Loads are personalised when the template is assigned to a client.',
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
      'Lower Body Hypertrophy must contain five weeks and two workouts per week before it can be seeded.';
  end if;

  /*
   * Remove any dummy exercises already added to this template.
   * Prescribed sets are removed through ON DELETE CASCADE.
   */
  delete from public.program_exercises exercise
  using public.program_workouts workout,
        public.program_weeks week
  where exercise.workout_id = workout.id
    and workout.week_id = week.id
    and week.program_id = v_program_id;

  create temporary table lower_hypertrophy_seed (
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

  insert into lower_hypertrophy_seed (
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
     * Workout 1 — quadriceps emphasis
     */
    (
      1,
      1,
      'Hack Squat',
      'Quadriceps, glutes, adductors',
      'Keep the whole foot supported and descend through the deepest comfortable controlled range.',
      'machine_display',
      4,
      8,
      12,
      2,
      150
    ),
    (
      1,
      2,
      'Leg Press',
      'Quadriceps, glutes, adductors',
      'Keep the hips against the pad and lower until the pelvis would begin to roll.',
      'machine_display',
      3,
      10,
      15,
      2,
      120
    ),
    (
      1,
      3,
      'Bulgarian Split Squat',
      'Quadriceps, glutes, adductors',
      'Use a stable stance and lower under control. Complete the prescribed reps on each side.',
      'per_dumbbell',
      3,
      8,
      12,
      2,
      120
    ),
    (
      1,
      4,
      'Leg Extension',
      'Quadriceps',
      'Keep the hips against the pad and control both the contraction and lowering phase.',
      'machine_display',
      3,
      12,
      20,
      2,
      75
    ),
    (
      1,
      5,
      'Seated Leg Curl',
      'Hamstrings',
      'Keep the hips against the pad and reach a controlled hamstring stretch between repetitions.',
      'machine_display',
      3,
      10,
      15,
      2,
      90
    ),
    (
      1,
      6,
      'Standing Calf Raise',
      'Gastrocnemius, soleus',
      'Pause at the bottom stretch and avoid bouncing out of the lowest position.',
      'machine_display',
      4,
      10,
      15,
      2,
      75
    ),
    (
      1,
      7,
      'Cable Crunch',
      'Abdominals',
      'Flex through the trunk without pulling the cable using the arms.',
      'machine_display',
      3,
      10,
      15,
      2,
      75
    ),

    /*
     * Workout 2 — glute and hamstring emphasis
     */
    (
      2,
      1,
      'Barbell Romanian Deadlift',
      'Hamstrings, glutes, spinal erectors',
      'Push the hips back, keep the bar close and stop when hamstring tension limits the range.',
      'total',
      4,
      6,
      10,
      2,
      150
    ),
    (
      2,
      2,
      'Barbell Hip Thrust',
      'Glutes, hamstrings',
      'Keep the ribs down and finish through the hips without extending the lower back.',
      'total',
      4,
      8,
      12,
      2,
      120
    ),
    (
      2,
      3,
      'Dumbbell Walking Lunge',
      'Glutes, quadriceps, adductors',
      'Use controlled steps and maintain balance through the entire front foot.',
      'per_dumbbell',
      3,
      10,
      15,
      2,
      120
    ),
    (
      2,
      4,
      'Lying Leg Curl',
      'Hamstrings',
      'Keep the hips down and control the return to a full comfortable stretch.',
      'machine_display',
      4,
      10,
      15,
      2,
      90
    ),
    (
      2,
      5,
      '45-Degree Back Extension',
      'Glutes, hamstrings, spinal erectors',
      'Move through the hips and finish with the torso in line with the legs.',
      'bodyweight',
      3,
      10,
      15,
      2,
      90
    ),
    (
      2,
      6,
      'Seated Calf Raise',
      'Soleus, gastrocnemius',
      'Use a full controlled range and pause briefly at the bottom and top.',
      'machine_display',
      4,
      12,
      20,
      2,
      75
    ),
    (
      2,
      7,
      'Hanging Knee Raise',
      'Abdominals, hip flexors',
      'Control the pelvis and avoid swinging between repetitions.',
      'bodyweight',
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
      'lower-body-hypertrophy:'
      || seed.workout_position::text
      || ':'
      || seed.exercise_position::text
    )::uuid
  from public.program_weeks week
  join public.program_workouts workout
    on workout.week_id = week.id
  join lower_hypertrophy_seed seed
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
  join lower_hypertrophy_seed seed
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