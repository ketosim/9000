begin;

-- Edit a training block and safely change its mesocycle count.
create function public.update_client_training_block(
  p_coach_id uuid,
  p_block_id uuid,
  p_name text,
  p_description text default '',
  p_mesocycle_count integer default 3,
  p_starts_on date default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_block_status text;
  v_current_count integer;
  v_index integer;
begin
  p_name := btrim(coalesce(p_name, ''));
  p_description := btrim(coalesce(p_description, ''));

  if char_length(p_name) not between 1 and 100 then
    raise exception 'BLOCK_NAME_INVALID';
  end if;

  if char_length(p_description) > 2000 then
    raise exception 'BLOCK_DESCRIPTION_INVALID';
  end if;

  if p_mesocycle_count is null
    or p_mesocycle_count not between 1 and 6
  then
    raise exception 'MESOCYCLE_COUNT_INVALID';
  end if;

  select status
  into v_block_status
  from public.training_blocks
  where id = p_block_id
    and created_by = p_coach_id
  for update;

  if not found then
    raise exception 'BLOCK_UNAVAILABLE';
  end if;

  if v_block_status = 'archived' then
    raise exception 'BLOCK_ARCHIVED';
  end if;

  select count(*)::integer
  into v_current_count
  from public.client_mesocycles
  where training_block_id = p_block_id;

  -- Structural changes are restricted to draft blocks.
  if p_mesocycle_count <> v_current_count
    and v_block_status <> 'draft'
  then
    raise exception 'BLOCK_STRUCTURE_LOCKED';
  end if;

  -- Never remove mesocycles containing assigned templates.
  if p_mesocycle_count < v_current_count
    and exists (
      select 1
      from public.client_mesocycles
      join public.assigned_training_templates
        on assigned_training_templates.mesocycle_id =
          client_mesocycles.id
      where client_mesocycles.training_block_id = p_block_id
        and client_mesocycles.position > p_mesocycle_count
    )
  then
    raise exception 'BLOCK_MESOCYCLES_IN_USE';
  end if;

  -- Do not silently remove a mesocycle that has already left draft.
  if p_mesocycle_count < v_current_count
    and exists (
      select 1
      from public.client_mesocycles
      where training_block_id = p_block_id
        and position > p_mesocycle_count
        and status <> 'draft'
    )
  then
    raise exception 'BLOCK_MESOCYCLES_NOT_DRAFT';
  end if;

  if p_mesocycle_count < v_current_count then
    delete from public.client_mesocycles
    where training_block_id = p_block_id
      and position > p_mesocycle_count;

  elsif p_mesocycle_count > v_current_count then
    for v_index in (v_current_count + 1)..p_mesocycle_count loop
      insert into public.client_mesocycles (
        training_block_id,
        name,
        position,
        status
      )
      values (
        p_block_id,
        format('Mesocycle %s', v_index),
        v_index,
        'draft'
      );
    end loop;
  end if;

  update public.training_blocks
  set
    name = p_name,
    description = p_description,
    starts_on = p_starts_on,
    updated_at = now()
  where id = p_block_id;

  return p_mesocycle_count;
end;
$function$;

comment on function public.update_client_training_block(
  uuid,
  uuid,
  text,
  text,
  integer,
  date
) is
  'Edits a client training block and safely changes its ordered mesocycle count.';


-- Edit one mesocycle's name and scheduled start date.
create function public.update_client_mesocycle(
  p_coach_id uuid,
  p_mesocycle_id uuid,
  p_name text,
  p_starts_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_block_id uuid;
  v_block_status text;
  v_mesocycle_status text;
begin
  p_name := btrim(coalesce(p_name, ''));

  if char_length(p_name) not between 1 and 100 then
    raise exception 'MESOCYCLE_NAME_INVALID';
  end if;

  select
    training_blocks.id,
    training_blocks.status,
    client_mesocycles.status
  into
    v_block_id,
    v_block_status,
    v_mesocycle_status
  from public.client_mesocycles
  join public.training_blocks
    on training_blocks.id = client_mesocycles.training_block_id
  where client_mesocycles.id = p_mesocycle_id
    and training_blocks.created_by = p_coach_id
  for update of client_mesocycles, training_blocks;

  if not found then
    raise exception 'MESOCYCLE_UNAVAILABLE';
  end if;

  if v_block_status = 'archived'
    or v_mesocycle_status = 'archived'
  then
    raise exception 'MESOCYCLE_ARCHIVED';
  end if;

  update public.client_mesocycles
  set
    name = p_name,
    starts_on = p_starts_on,
    updated_at = now()
  where id = p_mesocycle_id;

  update public.training_blocks
  set updated_at = now()
  where id = v_block_id;

  return p_mesocycle_id;
end;
$function$;

comment on function public.update_client_mesocycle(
  uuid,
  uuid,
  text,
  date
) is
  'Edits the name and scheduled start date of a client mesocycle.';


revoke all on function public.update_client_training_block(
  uuid,
  uuid,
  text,
  text,
  integer,
  date
) from public, anon, authenticated;

revoke all on function public.update_client_mesocycle(
  uuid,
  uuid,
  text,
  date
) from public, anon, authenticated;

grant execute on function public.update_client_training_block(
  uuid,
  uuid,
  text,
  text,
  integer,
  date
) to service_role;

grant execute on function public.update_client_mesocycle(
  uuid,
  uuid,
  text,
  date
) to service_role;

commit;