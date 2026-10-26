begin;

create or replace function public.get_client_active_training_plan()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_client_id uuid;
  v_client_role text;
  v_block public.training_blocks%rowtype;
  v_mesocycle public.client_mesocycles%rowtype;
  v_templates jsonb;
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

  select *
  into v_block
  from public.training_blocks
  where client_id = v_client_id
    and status = 'active'
  order by position
  limit 1;

  if not found then
    return null;
  end if;

  /*
   * If several mesocycles have active status, prefer the most recently
   * started one that has already reached its start date. Otherwise use
   * the first active mesocycle.
   */
  select *
  into v_mesocycle
  from public.client_mesocycles
  where training_block_id = v_block.id
    and status = 'active'
  order by
    case
      when starts_on is not null and starts_on <= current_date then 0
      else 1
    end,
    case
      when starts_on is not null and starts_on <= current_date
        then starts_on
    end desc nulls last,
    position
  limit 1;

  if not found then
    return jsonb_build_object(
      'block',
      jsonb_build_object(
        'id', v_block.id,
        'name', v_block.name,
        'description', v_block.description,
        'startsOn', v_block.starts_on,
        'status', v_block.status
      ),
      'mesocycle', null,
      'templates', '[]'::jsonb
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', assigned_training_templates.id,
        'name', assigned_training_templates.template_name,
        'goal', assigned_training_templates.goal,
        'description', assigned_training_templates.description,
        'durationWeeks',
          assigned_training_templates.duration_weeks,
        'sessionsPerWeek',
          assigned_training_templates.sessions_per_week,
        'position', assigned_training_templates.position,
        'weeks',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', assigned_template_weeks.id,
                  'weekNumber',
                    assigned_template_weeks.week_number,
                  'focus', assigned_template_weeks.focus,
                  'coachingNotes',
                    assigned_template_weeks.coaching_notes,
                  'workouts',
                    coalesce(
                      (
                        select jsonb_agg(
                          jsonb_build_object(
                            'id',
                              assigned_template_workouts.id,
                            'position',
                              assigned_template_workouts.position,
                            'estimatedMinutes',
                              assigned_template_workouts.estimated_minutes,
                            'warmupNotes',
                              assigned_template_workouts.warmup_notes
                          )
                          order by
                            assigned_template_workouts.position
                        )
                        from public.assigned_template_workouts
                        where assigned_template_workouts.assigned_week_id =
                          assigned_template_weeks.id
                      ),
                      '[]'::jsonb
                    )
                )
                order by assigned_template_weeks.week_number
              )
              from public.assigned_template_weeks
              where assigned_template_weeks.assignment_id =
                assigned_training_templates.id
            ),
            '[]'::jsonb
          )
      )
      order by assigned_training_templates.position
    ),
    '[]'::jsonb
  )
  into v_templates
  from public.assigned_training_templates
  where mesocycle_id = v_mesocycle.id;

  return jsonb_build_object(
    'block',
    jsonb_build_object(
      'id', v_block.id,
      'name', v_block.name,
      'description', v_block.description,
      'startsOn', v_block.starts_on,
      'status', v_block.status
    ),
    'mesocycle',
    jsonb_build_object(
      'id', v_mesocycle.id,
      'name', v_mesocycle.name,
      'position', v_mesocycle.position,
      'durationWeeks', v_mesocycle.duration_weeks,
      'startsOn', v_mesocycle.starts_on,
      'status', v_mesocycle.status
    ),
    'templates', v_templates
  );
end;
$function$;

comment on function public.get_client_active_training_plan() is
  'Returns the signed-in client active block, current active mesocycle and assigned template snapshots.';

revoke all on function public.get_client_active_training_plan()
  from public, anon;

grant execute on function public.get_client_active_training_plan()
  to authenticated;

commit;