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
  where name = 'Lower Body Strength'
  order by created_at
  limit 1;

  if v_program_id is null then
    raise exception
      'Lower Body Strength template was not found.';
  end if;

  update public.programs
  set
    goal =
      'Build squat, hip-hinge and single-leg strength while improving trunk stability.',
    description =
      'Two lower-body strength workouts per week. The template combines heavy compound lifts with unilateral work, hamstring training, calves and trunk stability. Loads are personalised when assigned to a client.',
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
      'Lower Body Strength must contain five weeks and two workouts per week before it can be seeded.';
  end if;

  /*
   * Remove any dummy exercise data already added to this template.
   * Its prescribed sets are removed by ON DELETE CASCADE.
   */
  delete from public.program_exercises exercise
  using public.program_workouts workout,
        public.program_weeks week
  where exercise.workout_id = workout.id
    and workout.week_id = week.id
    and week.program_id = v_program_id;

  create temporary table lower_strength_seed (
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

  insert into lower_strength_seed (
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
     * Workout 1 — squat emphasis
     */
    (
      1,
      1,
      'Barbell Back Squat',
      'Quadriceps, glutes, adductors, trunk',
      'Brace before descending, keep the whole foot planted and drive evenly out of the bottom.',
      'total',
      4,
      3,
      5,
      2,
      180
    ),
    (
      1,
      2,
      'Barbell Romanian Deadlift',
      'Hamstrings, glutes, spinal erectors',
      'Push the hips back, keep the bar close and stop when hamstring tension limits the range.',
      'total',
      4,
      4,
      6,
      2,
      180
    ),
    (
      1,
      3,
      'Bulgarian Split Squat',
      'Quadriceps, glutes, adductors',
      'Keep the front foot stable and lower under control. Complete the prescribed reps on each side.',
      'per_dumbbell',
      3,
      5,
      8,
      2,
      120
    ),
    (
      1,
      4,
      'Seated Leg Curl',
      'Hamstrings',
      'Keep the hips against the pad and control both the curl and return.',
      'machine_display',
      3,
      6,
      10,
      2,
      90
    ),
    (
      1,
      5,
      'Standing Calf Raise',
      'Gastrocnemius, soleus',
      'Pause in the stretched position and finish each repetition with a controlled contraction.',
      'machine_display',
      3,
      6,
      10,
      2,
      90
    ),
    (
      1,
      6,
      'Ab Wheel Rollout',
      'Abdominals, lats, trunk stabilisers',
      'Keep the ribs down and only roll as far as you can maintain a stable spine.',
      'bodyweight',
      3,
      6,
      12,
      2,
      90
    ),

    /*
     * Workout 2 — hip-hinge and unilateral emphasis
     */
    (
      2,
      1,
      'Trap Bar Deadlift',
      'Glutes, quadriceps, hamstrings, upper back',
      'Brace before lifting and drive the floor away while keeping the handles close to the body.',
      'total',
      4,
      3,
      5,
      2,
      180
    ),
    (
      2,
      2,
      'Barbell Front Squat',
      'Quadriceps, glutes, upper back, trunk',
      'Keep the elbows high, torso tall and pressure through the whole foot.',
      'total',
      3,
      4,
      6,
      2,
      180
    ),
    (
      2,
      3,
      'Barbell Hip Thrust',
      'Glutes, hamstrings',
      'Keep the ribs down and finish with the hips without overextending the lower back.',
      'total',
      3,
      5,
      8,
      2,
      120
    ),
    (
      2,
      4,
      'Dumbbell Reverse Lunge',
      'Quadriceps, glutes, adductors',
      'Step back under control and drive through the front leg. Complete the prescribed reps on each side.',
      'per_dumbbell',
      3,
      6,
      8,
      2,
      120
    ),
    (
      2,
      5,
      'Lying Leg Curl',
      'Hamstrings',
      'Keep the hips down and control the return to a full comfortable stretch.',
      'machine_display',
      3,
      6,
      10,
      2,
      90
    ),
    (
      2,
      6,
      'Seated Calf Raise',
      'Soleus, gastrocnemius',
      'Use a complete controlled range and pause briefly at the bottom and top.',
      'machine_display',
      3,
      8,
      12,
      2,
      90
    ),
    (
      2,
      7,
      'Cable Pallof Press',
      'Obliques, abdominals, trunk stabilisers',
      'Keep the hips and shoulders square. Resist rotation as the arms extend.',
      'machine_display',
      3,
      8,
      12,
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
      'lower-body-strength:'
      || seed.workout_position::text
      || ':'
      || seed.exercise_position::text
    )::uuid
  from public.program_weeks week
  join public.program_workouts workout
    on workout.week_id = week.id
  join lower_strength_seed seed
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
  join lower_strength_seed seed
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