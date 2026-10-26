begin;

create or replace function public.get_client_assigned_workout(
  p_workout_id uuid
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
  v_workout record;
  v_exercises jsonb;
begin
  v_client_id := auth.uid();

  if v_client_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select role
  into v_client_role
  from public.profiles
  where id = v_client_id;

  if not found or v_client_role <> 'client' then
    raise exception 'CLIENT_ACCESS_REQUIRED';
  end if;

  select
    assigned_template_workouts.id,
    assigned_template_workouts.position,
    assigned_template_workouts.estimated_minutes,
    assigned_template_workouts.warmup_notes,

    assigned_template_weeks.id as week_id,
    assigned_template_weeks.week_number,
    assigned_template_weeks.focus as week_focus,
    assigned_template_weeks.coaching_notes as week_coaching_notes,

    assigned_training_templates.id as assignment_id,
    assigned_training_templates.template_name,
    assigned_training_templates.position as template_position,

    client_mesocycles.id as mesocycle_id,
    client_mesocycles.name as mesocycle_name,

    training_blocks.id as block_id,
    training_blocks.name as block_name
  into v_workout
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
  limit 1;

  if not found then
    raise exception 'WORKOUT_UNAVAILABLE';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', assigned_template_exercises.id,
        'name', assigned_template_exercises.name,
        'position', assigned_template_exercises.position,
        'variation', assigned_template_exercises.variation,
        'targetMuscles',
          assigned_template_exercises.target_muscles,
        'machineSettings',
          assigned_template_exercises.machine_settings,
        'attachment', assigned_template_exercises.attachment,
        'setupInstructions',
          assigned_template_exercises.setup_instructions,
        'side', assigned_template_exercises.side,
        'loadConvention',
          assigned_template_exercises.load_convention,
        'loadUnit', assigned_template_exercises.load_unit,
        'coachingCues',
          assigned_template_exercises.coaching_cues,
        'exerciseGroup',
          assigned_template_exercises.exercise_group,
        'coachNotes',
          assigned_template_exercises.coach_notes,
        'isDeload', assigned_template_exercises.is_deload,
        'personalisationNotes',
          assigned_template_exercises.personalisation_notes,
        'sets',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', assigned_template_sets.id,
                  'setNumber',
                    assigned_template_sets.set_number,
                  'setType',
                    assigned_template_sets.set_type,
                  'repsMin',
                    assigned_template_sets.reps_min,
                  'repsMax',
                    assigned_template_sets.reps_max,
                  'targetLoad',
                    assigned_template_sets.target_load,
                  'rir', assigned_template_sets.rir,
                  'restSeconds',
                    assigned_template_sets.rest_seconds,
                  'sideOverride',
                    assigned_template_sets.side_override,
                  'notes', assigned_template_sets.notes
                )
                order by assigned_template_sets.set_number
              )
              from public.assigned_template_sets
              where assigned_template_sets.assigned_exercise_id =
                assigned_template_exercises.id
            ),
            '[]'::jsonb
          )
      )
      order by assigned_template_exercises.position
    ),
    '[]'::jsonb
  )
  into v_exercises
  from public.assigned_template_exercises
  where assigned_workout_id = v_workout.id;

  return jsonb_build_object(
    'id', v_workout.id,
    'position', v_workout.position,
    'estimatedMinutes', v_workout.estimated_minutes,
    'warmupNotes', v_workout.warmup_notes,

    'week',
      jsonb_build_object(
        'id', v_workout.week_id,
        'weekNumber', v_workout.week_number,
        'focus', v_workout.week_focus,
        'coachingNotes', v_workout.week_coaching_notes
      ),

    'template',
      jsonb_build_object(
        'id', v_workout.assignment_id,
        'name', v_workout.template_name,
        'position', v_workout.template_position
      ),

    'mesocycle',
      jsonb_build_object(
        'id', v_workout.mesocycle_id,
        'name', v_workout.mesocycle_name
      ),

    'block',
      jsonb_build_object(
        'id', v_workout.block_id,
        'name', v_workout.block_name
      ),

    'exercises', v_exercises
  );
end;
$function$;

comment on function public.get_client_assigned_workout(uuid) is
  'Returns one assigned workout snapshot when it belongs to the signed-in client active training plan.';

revoke all on function public.get_client_assigned_workout(uuid)
  from public, anon;

grant execute on function public.get_client_assigned_workout(uuid)
  to authenticated;

commit;