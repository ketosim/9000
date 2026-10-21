begin;

-- Enforce one active training block per client at the database level.
create unique index training_blocks_one_active_per_client_idx
  on public.training_blocks (client_id)
  where status = 'active';


-- Change the status of one client mesocycle.
create function public.set_client_mesocycle_status(
  p_coach_id uuid,
  p_mesocycle_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_mesocycle public.client_mesocycles%rowtype;
  v_block public.training_blocks%rowtype;
begin
  p_status := lower(btrim(coalesce(p_status, '')));

  if p_status not in ('draft', 'active', 'archived') then
    raise exception 'INVALID_STATUS';
  end if;

  select client_mesocycles.*
  into v_mesocycle
  from public.client_mesocycles
  join public.training_blocks
    on training_blocks.id =
      client_mesocycles.training_block_id
  where client_mesocycles.id = p_mesocycle_id
    and training_blocks.created_by = p_coach_id
  for update of client_mesocycles;

  if not found then
    raise exception 'MESOCYCLE_UNAVAILABLE';
  end if;

  select *
  into v_block
  from public.training_blocks
  where id = v_mesocycle.training_block_id
    and created_by = p_coach_id
  for update;

  if not found then
    raise exception 'BLOCK_UNAVAILABLE';
  end if;

  if v_mesocycle.status = p_status then
    return p_status;
  end if;

  if v_block.status = 'archived'
    and p_status <> 'archived'
  then
    raise exception 'BLOCK_ARCHIVED';
  end if;

  -- An active block cannot have an individual mesocycle returned to draft
  -- or archived underneath it.
  if v_block.status = 'active'
    and p_status <> 'active'
  then
    raise exception 'ACTIVE_BLOCK_STRUCTURE_LOCKED';
  end if;

  if p_status = 'active' then
    if v_mesocycle.starts_on is null then
      raise exception 'MESOCYCLE_START_DATE_REQUIRED';
    end if;

    if v_mesocycle.duration_weeks is null then
      raise exception 'MESOCYCLE_DURATION_REQUIRED';
    end if;

    if not exists (
      select 1
      from public.assigned_training_templates
      where mesocycle_id = p_mesocycle_id
    ) then
      raise exception 'MESOCYCLE_TEMPLATE_REQUIRED';
    end if;

    if exists (
      select 1
      from public.assigned_training_templates
      where mesocycle_id = p_mesocycle_id
        and duration_weeks <>
          v_mesocycle.duration_weeks
    ) then
      raise exception 'MESOCYCLE_DURATION_MISMATCH';
    end if;

    if v_block.starts_on is not null
      and v_mesocycle.starts_on < v_block.starts_on
    then
      raise exception 'MESOCYCLE_BEFORE_BLOCK';
    end if;
  end if;

  update public.client_mesocycles
  set
    status = p_status,
    updated_at = now()
  where id = p_mesocycle_id;

  update public.training_blocks
  set updated_at = now()
  where id = v_block.id;

  return p_status;
end;
$function$;

comment on function public.set_client_mesocycle_status(
  uuid,
  uuid,
  text
) is
  'Changes a coach-owned client mesocycle between draft, active and archived with readiness validation.';


-- Change the status of a client training block.
create function public.set_client_training_block_status(
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
  v_mesocycle_count integer;
  v_first_start date;
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

  -- Lock the client so simultaneous activation requests cannot both pass
  -- the active-block check.
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

  if p_status = 'draft'
    and v_block.status = 'active'
    and v_block.starts_on is not null
    and v_block.starts_on <= current_date
  then
    raise exception 'BLOCK_ALREADY_STARTED';
  end if;

  if p_status = 'active' then
    if v_block.starts_on is null then
      raise exception 'BLOCK_START_DATE_REQUIRED';
    end if;

    select count(*)::integer
    into v_mesocycle_count
    from public.client_mesocycles
    where training_block_id = p_block_id;

    if v_mesocycle_count = 0 then
      raise exception 'BLOCK_HAS_NO_MESOCYCLES';
    end if;

    if exists (
      select 1
      from public.client_mesocycles
      where training_block_id = p_block_id
        and status <> 'active'
    ) then
      raise exception 'BLOCK_MESOCYCLES_NOT_ACTIVE';
    end if;

    if exists (
      select 1
      from public.client_mesocycles
      where training_block_id = p_block_id
        and starts_on is null
    ) then
      raise exception 'MESOCYCLE_START_DATE_REQUIRED';
    end if;

    if exists (
      select 1
      from public.client_mesocycles
      where training_block_id = p_block_id
        and duration_weeks is null
    ) then
      raise exception 'MESOCYCLE_DURATION_REQUIRED';
    end if;

    if exists (
      select 1
      from public.client_mesocycles
      where training_block_id = p_block_id
        and not exists (
          select 1
          from public.assigned_training_templates
          where assigned_training_templates.mesocycle_id =
            client_mesocycles.id
        )
    ) then
      raise exception 'MESOCYCLE_TEMPLATE_REQUIRED';
    end if;

    select starts_on
    into v_first_start
    from public.client_mesocycles
    where training_block_id = p_block_id
    order by position
    limit 1;

    if v_first_start is distinct from v_block.starts_on then
      raise exception 'BLOCK_START_MISMATCH';
    end if;

    -- Different template durations inside one mesocycle are not allowed
    -- by the current model. The broader duration policy remains a separate
    -- product decision.
    if exists (
      select 1
      from public.client_mesocycles
      join public.assigned_training_templates
        on assigned_training_templates.mesocycle_id =
          client_mesocycles.id
      where client_mesocycles.training_block_id =
        p_block_id
        and assigned_training_templates.duration_weeks <>
          client_mesocycles.duration_weeks
    ) then
      raise exception 'MESOCYCLE_DURATION_MISMATCH';
    end if;

    -- Mesocycles may have gaps between them for now, but they cannot overlap.
    if exists (
      select 1
      from (
        select
          starts_on,
          lag(
            starts_on + duration_weeks * 7
          ) over (
            order by position
          ) as previous_ends_on
        from public.client_mesocycles
        where training_block_id = p_block_id
      ) as schedule
      where previous_ends_on is not null
        and starts_on < previous_ends_on
    ) then
      raise exception 'MESOCYCLE_DATE_OVERLAP';
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
  'Changes a client training block between draft, active and archived with scheduling and readiness validation.';


revoke all on function public.set_client_mesocycle_status(
  uuid,
  uuid,
  text
) from public, anon, authenticated;

revoke all on function public.set_client_training_block_status(
  uuid,
  uuid,
  text
) from public, anon, authenticated;

grant execute on function public.set_client_mesocycle_status(
  uuid,
  uuid,
  text
) to service_role;

grant execute on function public.set_client_training_block_status(
  uuid,
  uuid,
  text
) to service_role;

commit;