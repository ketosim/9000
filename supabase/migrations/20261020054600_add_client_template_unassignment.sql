begin;

create function public.unassign_training_template(
  p_coach_id uuid,
  p_assignment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_mesocycle_id uuid;
  v_assignment_position integer;
  v_mesocycle_status text;
  v_template_name text;
  v_week_count integer;
  v_workout_count integer;
  v_exercise_count integer;
  v_set_count integer;
  v_remaining_count integer;
  v_assignment record;
begin
  select
    assigned_training_templates.mesocycle_id,
    assigned_training_templates.position,
    assigned_training_templates.template_name,
    client_mesocycles.status
  into
    v_mesocycle_id,
    v_assignment_position,
    v_template_name,
    v_mesocycle_status
  from public.assigned_training_templates
  join public.client_mesocycles
    on client_mesocycles.id =
      assigned_training_templates.mesocycle_id
  join public.training_blocks
    on training_blocks.id = client_mesocycles.training_block_id
  where assigned_training_templates.id = p_assignment_id
    and training_blocks.created_by = p_coach_id
  for update of assigned_training_templates, client_mesocycles;

  if not found then
    raise exception 'ASSIGNMENT_UNAVAILABLE';
  end if;

  if v_mesocycle_status <> 'draft' then
    raise exception 'MESOCYCLE_NOT_DRAFT';
  end if;

  select count(*)::integer
  into v_week_count
  from public.assigned_template_weeks
  where assignment_id = p_assignment_id;

  select count(*)::integer
  into v_workout_count
  from public.assigned_template_workouts
  join public.assigned_template_weeks
    on assigned_template_weeks.id =
      assigned_template_workouts.assigned_week_id
  where assigned_template_weeks.assignment_id = p_assignment_id;

  select count(*)::integer
  into v_exercise_count
  from public.assigned_template_exercises
  join public.assigned_template_workouts
    on assigned_template_workouts.id =
      assigned_template_exercises.assigned_workout_id
  join public.assigned_template_weeks
    on assigned_template_weeks.id =
      assigned_template_workouts.assigned_week_id
  where assigned_template_weeks.assignment_id = p_assignment_id;

  select count(*)::integer
  into v_set_count
  from public.assigned_template_sets
  join public.assigned_template_exercises
    on assigned_template_exercises.id =
      assigned_template_sets.assigned_exercise_id
  join public.assigned_template_workouts
    on assigned_template_workouts.id =
      assigned_template_exercises.assigned_workout_id
  join public.assigned_template_weeks
    on assigned_template_weeks.id =
      assigned_template_workouts.assigned_week_id
  where assigned_template_weeks.assignment_id = p_assignment_id;

  delete from public.assigned_training_templates
  where id = p_assignment_id;

  -- Move each later assignment into the open position one at a time so the
  -- existing unique constraint is never temporarily violated.
  for v_assignment in
    select id, position
    from public.assigned_training_templates
    where mesocycle_id = v_mesocycle_id
      and position > v_assignment_position
    order by position
  loop
    update public.assigned_training_templates
    set
      position = v_assignment.position - 1,
      updated_at = now()
    where id = v_assignment.id;
  end loop;

  select count(*)::integer
  into v_remaining_count
  from public.assigned_training_templates
  where mesocycle_id = v_mesocycle_id;

  if v_remaining_count = 0 then
    update public.client_mesocycles
    set
      duration_weeks = null,
      updated_at = now()
    where id = v_mesocycle_id;
  end if;

  return jsonb_build_object(
    'templateName', v_template_name,
    'weeksRemoved', v_week_count,
    'workoutsRemoved', v_workout_count,
    'exercisesRemoved', v_exercise_count,
    'setsRemoved', v_set_count,
    'remainingAssignments', v_remaining_count
  );
end;
$function$;

comment on function public.unassign_training_template(uuid, uuid) is
  'Removes a draft mesocycle template snapshot, compacts assignment positions and clears the duration when no assignments remain.';

revoke all on function public.unassign_training_template(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.unassign_training_template(uuid, uuid)
  to service_role;

commit;
