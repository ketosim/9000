begin;

-- Return one live workout session belonging to the signed-in client.
create or replace function public.get_client_workout_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_client_id uuid;
  v_client_role text;
  v_session record;
  v_exercises jsonb;
begin
  v_client_id := auth.uid();

  if v_client_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select profiles.role
  into v_client_role
  from public.profiles
  where profiles.id = v_client_id;

  if not found or v_client_role <> 'client' then
    raise exception 'CLIENT_ACCESS_REQUIRED';
  end if;

  select
    workout_sessions.id,
    workout_sessions.client_id,
    workout_sessions.assigned_workout_id,
    workout_sessions.session_mode,
    workout_sessions.status,
    workout_sessions.started_at,
    workout_sessions.completed_at,
    workout_sessions.abandoned_at,
    workout_sessions.session_notes,

    assigned_template_workouts.position as workout_position,
    assigned_template_workouts.estimated_minutes,
    assigned_template_workouts.warmup_notes,

    assigned_template_weeks.week_number,
    assigned_template_weeks.focus as week_focus,

    assigned_training_templates.template_name,

    client_mesocycles.name as mesocycle_name,
    training_blocks.name as block_name
  into v_session
  from public.workout_sessions
  join public.assigned_template_workouts
    on assigned_template_workouts.id =
      workout_sessions.assigned_workout_id
  join public.assigned_template_weeks
    on assigned_template_weeks.id =
      assigned_template_workouts.assigned_week_id
  join public.assigned_training_templates
    on assigned_training_templates.id =
      assigned_template_weeks.assignment_id
  join public.client_mesocycles
    on client_mesocycles.id =
      assigned_training_templates.mesocycle_id
  join public.training_blocks
    on training_blocks.id =
      client_mesocycles.training_block_id
  where workout_sessions.id = p_session_id
    and workout_sessions.client_id = v_client_id
    and training_blocks.client_id = v_client_id
  limit 1;

  if not found then
    raise exception 'SESSION_UNAVAILABLE';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', session_exercises.id,
        'assignedExerciseId',
          session_exercises.assigned_exercise_id,
        'replacesAssignedExerciseId',
          session_exercises.replaces_assigned_exercise_id,
        'source', session_exercises.exercise_source,
        'name', session_exercises.name,
        'position', session_exercises.position,
        'variation', session_exercises.variation,
        'side', session_exercises.side,
        'loadConvention',
          session_exercises.load_convention,
        'loadUnit', session_exercises.load_unit,
        'isDeload', session_exercises.is_deload,
        'notes', session_exercises.exercise_notes,
        'sets',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', session_sets.id,
                  'assignedSetId',
                    session_sets.assigned_set_id,
                  'setNumber',
                    session_sets.set_number,
                  'source',
                    session_sets.set_source,
                  'actualReps',
                    session_sets.actual_reps,
                  'actualLoad',
                    session_sets.actual_load,
                  'actualRir',
                    session_sets.actual_rir,
                  'side',
                    session_sets.side,
                  'completed',
                    session_sets.completed,
                  'completedAt',
                    session_sets.completed_at,
                  'notes',
                    session_sets.set_notes,

                  'prescribed',
                    case
                      when prescribed_sets.id is null then null
                      else jsonb_build_object(
                        'setNumber',
                          prescribed_sets.set_number,
                        'setType',
                          prescribed_sets.set_type,
                        'repsMin',
                          prescribed_sets.reps_min,
                        'repsMax',
                          prescribed_sets.reps_max,
                        'targetLoad',
                          prescribed_sets.target_load,
                        'rir',
                          prescribed_sets.rir,
                        'restSeconds',
                          prescribed_sets.rest_seconds,
                        'sideOverride',
                          prescribed_sets.side_override,
                        'notes',
                          prescribed_sets.notes
                      )
                    end
                )
                order by session_sets.set_number
              )
              from public.workout_session_sets as session_sets
              left join public.assigned_template_sets
                as prescribed_sets
                on prescribed_sets.id =
                  session_sets.assigned_set_id
              where session_sets.session_exercise_id =
                session_exercises.id
            ),
            '[]'::jsonb
          )
      )
      order by session_exercises.position
    ),
    '[]'::jsonb
  )
  into v_exercises
  from public.workout_session_exercises as session_exercises
  where session_exercises.session_id = v_session.id;

  return jsonb_build_object(
    'id', v_session.id,
    'assignedWorkoutId', v_session.assigned_workout_id,
    'mode', v_session.session_mode,
    'status', v_session.status,
    'startedAt', v_session.started_at,
    'completedAt', v_session.completed_at,
    'abandonedAt', v_session.abandoned_at,
    'notes', v_session.session_notes,

    'workout',
      jsonb_build_object(
        'id', v_session.assigned_workout_id,
        'position', v_session.workout_position,
        'estimatedMinutes', v_session.estimated_minutes,
        'warmupNotes', v_session.warmup_notes
      ),

    'week',
      jsonb_build_object(
        'weekNumber', v_session.week_number,
        'focus', v_session.week_focus
      ),

    'templateName', v_session.template_name,
    'mesocycleName', v_session.mesocycle_name,
    'blockName', v_session.block_name,
    'exercises', v_exercises
  );
end;
$function$;

comment on function public.get_client_workout_session(uuid) is
  'Returns one live workout session and its logged exercises and sets when it belongs to the signed-in client.';


-- Start a client self-training session or resume the existing unfinished
-- session for the same assigned workout.
--
-- p_client_request_id must be generated once in the browser and reused if the
-- request is retried. This prevents duplicate sessions after a weak connection
-- or an uncertain response.
create or replace function public.start_or_resume_client_workout(
  p_workout_id uuid,
  p_client_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_client_id uuid;
  v_client_role text;
  v_session_id uuid;
  v_exercise record;
  v_set record;
  v_session_exercise_id uuid;
begin
  v_client_id := auth.uid();

  if v_client_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_workout_id is null or p_client_request_id is null then
    raise exception 'INVALID_REQUEST';
  end if;

  -- Locking the client row serialises concurrent start requests from multiple
  -- browser tabs or retries.
  select profiles.role
  into v_client_role
  from public.profiles
  where profiles.id = v_client_id
  for update;

  if not found or v_client_role <> 'client' then
    raise exception 'CLIENT_ACCESS_REQUIRED';
  end if;

  -- An exact retry returns the session created by the original request,
  -- including when that session has since been completed.
  select workout_sessions.id
  into v_session_id
  from public.workout_sessions
  where workout_sessions.client_id = v_client_id
    and workout_sessions.client_request_id =
      p_client_request_id
  limit 1;

  if found then
    return public.get_client_workout_session(v_session_id);
  end if;

  -- Confirm that this assigned workout belongs to the client's current active
  -- block and active mesocycle.
  if not exists (
    select 1
    from public.assigned_template_workouts
    join public.assigned_template_weeks
      on assigned_template_weeks.id =
        assigned_template_workouts.assigned_week_id
    join public.assigned_training_templates
      on assigned_training_templates.id =
        assigned_template_weeks.assignment_id
    join public.client_mesocycles
      on client_mesocycles.id =
        assigned_training_templates.mesocycle_id
    join public.training_blocks
      on training_blocks.id =
        client_mesocycles.training_block_id
    where assigned_template_workouts.id = p_workout_id
      and training_blocks.client_id = v_client_id
      and training_blocks.status = 'active'
      and client_mesocycles.status = 'active'
  ) then
    raise exception 'WORKOUT_UNAVAILABLE';
  end if;

  -- Resume an existing unfinished performance even if the browser generated a
  -- new request ID after reloading.
  select workout_sessions.id
  into v_session_id
  from public.workout_sessions
  where workout_sessions.client_id = v_client_id
    and workout_sessions.assigned_workout_id =
      p_workout_id
    and workout_sessions.status = 'in_progress'
  order by workout_sessions.started_at desc
  limit 1;

  if found then
    return public.get_client_workout_session(v_session_id);
  end if;

  insert into public.workout_sessions (
    client_id,
    assigned_workout_id,
    session_mode,
    status,
    started_by,
    attending_coach_id,
    client_request_id
  )
  values (
    v_client_id,
    p_workout_id,
    'client_self',
    'in_progress',
    v_client_id,
    null,
    p_client_request_id
  )
  returning id into v_session_id;

  -- Copy the prescribed exercises into the live session. Future template
  -- changes cannot alter the session that is already underway.
  for v_exercise in
    select
      assigned_template_exercises.id,
      assigned_template_exercises.name,
      assigned_template_exercises.position,
      assigned_template_exercises.variation,
      assigned_template_exercises.side,
      assigned_template_exercises.load_convention,
      assigned_template_exercises.load_unit,
      assigned_template_exercises.is_deload
    from public.assigned_template_exercises
    where assigned_template_exercises.assigned_workout_id =
      p_workout_id
    order by assigned_template_exercises.position
  loop
    insert into public.workout_session_exercises (
      session_id,
      assigned_exercise_id,
      replaces_assigned_exercise_id,
      exercise_source,
      name,
      position,
      variation,
      side,
      load_convention,
      load_unit,
      is_deload,
      client_request_id
    )
    values (
      v_session_id,
      v_exercise.id,
      null,
      'prescribed',
      v_exercise.name,
      v_exercise.position,
      v_exercise.variation,
      v_exercise.side,
      v_exercise.load_convention,
      v_exercise.load_unit,
      v_exercise.is_deload,
      gen_random_uuid()
    )
    returning id into v_session_exercise_id;

    for v_set in
      select
        assigned_template_sets.id,
        assigned_template_sets.set_number
      from public.assigned_template_sets
      where assigned_template_sets.assigned_exercise_id =
        v_exercise.id
      order by assigned_template_sets.set_number
    loop
      insert into public.workout_session_sets (
        session_exercise_id,
        assigned_set_id,
        set_number,
        set_source,
        completed,
        client_request_id
      )
      values (
        v_session_exercise_id,
        v_set.id,
        v_set.set_number,
        'prescribed',
        false,
        gen_random_uuid()
      );
    end loop;
  end loop;

  return public.get_client_workout_session(v_session_id);
end;
$function$;

comment on function public.start_or_resume_client_workout(
  uuid,
  uuid
) is
  'Starts or resumes a self-training session for an assigned workout belonging to the signed-in client.';


revoke all on function public.get_client_workout_session(uuid)
  from public, anon, authenticated;

revoke all on function public.start_or_resume_client_workout(
  uuid,
  uuid
) from public, anon, authenticated;

grant execute on function public.get_client_workout_session(uuid)
  to authenticated, service_role;

grant execute on function public.start_or_resume_client_workout(
  uuid,
  uuid
) to authenticated, service_role;

commit;