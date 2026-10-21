begin;

do $migration$
declare
  v_program_id uuid;
  v_program_count integer;
  v_week_count integer;
  v_workout_count integer;
  v_exercise_count integer;
  v_set_count integer;
begin
  select count(*)
  into v_program_count
  from public.programs
  where name = 'BJJ Power & Grip';

  if v_program_count <> 1 then
    raise exception
      'Expected exactly one BJJ Power & Grip template, but found %.',
      v_program_count;
  end if;

  select id
  into v_program_id
  from public.programs
  where name = 'BJJ Power & Grip';

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

  select count(*)
  into v_exercise_count
  from public.program_exercises exercise
  join public.program_workouts workout
    on workout.id = exercise.workout_id
  join public.program_weeks week
    on week.id = workout.week_id
  where week.program_id = v_program_id;

  select count(*)
  into v_set_count
  from public.program_sets prescribed_set
  join public.program_exercises exercise
    on exercise.id = prescribed_set.exercise_id
  join public.program_workouts workout
    on workout.id = exercise.workout_id
  join public.program_weeks week
    on week.id = workout.week_id
  where week.program_id = v_program_id;

  if v_week_count <> 4 then
    raise exception
      'BJJ Power & Grip should contain 4 weeks, but found %.',
      v_week_count;
  end if;

  if v_workout_count <> 8 then
    raise exception
      'BJJ Power & Grip should contain 8 workouts, but found %.',
      v_workout_count;
  end if;

  if v_exercise_count <> 40 then
    raise exception
      'BJJ Power & Grip should contain 40 exercises, but found %.',
      v_exercise_count;
  end if;

  if v_set_count <> 128 then
    raise exception
      'BJJ Power & Grip should contain 128 prescribed sets, but found %.',
      v_set_count;
  end if;

  /*
   * Explosive exercises previously used null RIR.
   * The active-template validator requires every set to have an RIR.
   *
   * RIR 4 communicates that these sets should remain fast and well away
   * from muscular failure.
   */
  update public.program_sets
  set rir = 4
  where rir is null
    and exercise_id in (
      select exercise.id
      from public.program_exercises exercise
      join public.program_workouts workout
        on workout.id = exercise.workout_id
      join public.program_weeks week
        on week.id = workout.week_id
      where week.program_id = v_program_id
    );

  if exists (
    select 1
    from public.program_sets prescribed_set
    join public.program_exercises exercise
      on exercise.id = prescribed_set.exercise_id
    join public.program_workouts workout
      on workout.id = exercise.workout_id
    join public.program_weeks week
      on week.id = workout.week_id
    where week.program_id = v_program_id
      and (
        prescribed_set.reps_min < 1
        or prescribed_set.reps_max < prescribed_set.reps_min
        or prescribed_set.rir is null
        or prescribed_set.rir not between 0 and 10
        or prescribed_set.rest_seconds is null
        or prescribed_set.rest_seconds not between 0 and 3600
      )
  ) then
    raise exception
      'BJJ Power & Grip still contains incomplete prescribed sets.';
  end if;

  perform public.template_assert_valid(
    v_program_id,
    true
  );

  update public.programs
  set
    status = 'active',
    template_revision = template_revision + 1
  where id = v_program_id;

  perform public.template_assert_valid(
    v_program_id,
    true
  );
end;
$migration$;

commit;