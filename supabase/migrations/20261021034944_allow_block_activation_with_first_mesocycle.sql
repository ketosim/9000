begin;

create or replace function public.set_client_training_block_status(
  p_coach_id uuid,
  p_block_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_block public.training_blocks%rowtype;
  v_first_mesocycle public.client_mesocycles%rowtype;
begin
  p_status := lower(btrim(coalesce(p_status, '')));

  if p_status not in ('draft', 'active', 'archived') then
    raise exception 'INVALID_STATUS';
  end if;

  select *
  into v_block
  from public.training_blocks
  where id = p_block_id
    and created_by = p_coach_id
  for update;

  if not found then
    raise exception 'BLOCK_UNAVAILABLE';
  end if;

  -- Prevent simultaneous requests from activating multiple blocks
  -- for the same client.
  perform 1
  from public.profiles
  where id = v_block.client_id
    and role = 'client'
  for update;

  if not found then
    raise exception 'CLIENT_UNAVAILABLE';
  end if;

  if v_block.status = p_status then
    return p_status;
  end if;

  -- A block that has already started cannot be returned to draft.
  if p_status = 'draft'
    and v_block.status = 'active'
    and v_block.starts_on is not null
    and v_block.starts_on <= current_date
  then
    raise exception 'BLOCK_ALREADY_STARTED';
  end if;

  if p_status = 'active' then
    -- Only the first mesocycle is required to start the block.
    select *
    into v_first_mesocycle
    from public.client_mesocycles
    where training_block_id = p_block_id
    order by position
    limit 1
    for update;

    if not found then
      raise exception 'BLOCK_HAS_NO_MESOCYCLES';
    end if;

    if v_first_mesocycle.position <> 1 then
      raise exception 'BLOCK_FIRST_MESOCYCLE_MISSING';
    end if;

    if v_first_mesocycle.status <> 'active' then
      raise exception 'BLOCK_FIRST_MESOCYCLE_NOT_ACTIVE';
    end if;

    if v_first_mesocycle.starts_on is null then
      raise exception 'FIRST_MESOCYCLE_START_DATE_REQUIRED';
    end if;

    if v_first_mesocycle.duration_weeks is null then
      raise exception 'FIRST_MESOCYCLE_DURATION_REQUIRED';
    end if;

    if not exists (
      select 1
      from public.assigned_training_templates
      where mesocycle_id = v_first_mesocycle.id
    ) then
      raise exception 'FIRST_MESOCYCLE_TEMPLATE_REQUIRED';
    end if;

    -- Every template assigned to the first mesocycle must match its duration.
    if exists (
      select 1
      from public.assigned_training_templates
      where mesocycle_id = v_first_mesocycle.id
        and duration_weeks <> v_first_mesocycle.duration_weeks
    ) then
      raise exception 'MESOCYCLE_DURATION_MISMATCH';
    end if;

    if exists (
      select 1
      from public.training_blocks
      where client_id = v_block.client_id
        and status = 'active'
        and id <> p_block_id
    ) then
      raise exception 'CLIENT_ALREADY_HAS_ACTIVE_BLOCK';
    end if;

    -- Starting the first mesocycle starts the whole block.
    update public.training_blocks
    set
      status = 'active',
      starts_on = v_first_mesocycle.starts_on,
      updated_at = now()
    where id = p_block_id;

    return 'active';
  end if;

  update public.training_blocks
  set
    status = p_status,
    updated_at = now()
  where id = p_block_id;

  return p_status;

exception
  when unique_violation then
    raise exception 'CLIENT_ALREADY_HAS_ACTIVE_BLOCK';
end;
$function$;

comment on function public.set_client_training_block_status(
  uuid,
  uuid,
  text
) is
  'Changes a client training block status. Activation requires only the first mesocycle to be active and ready.';

revoke all on function public.set_client_training_block_status(
  uuid,
  uuid,
  text
) from public, anon, authenticated;

grant execute on function public.set_client_training_block_status(
  uuid,
  uuid,
  text
) to service_role;

commit;