begin;

-- Create a client-owned training block and its ordered mesocycles.
create function public.create_client_training_block(
  p_coach_id uuid,
  p_client_id uuid,
  p_name text,
  p_description text default '',
  p_mesocycle_count integer default 3,
  p_starts_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_client_role text;
  v_coach_role text;
  v_block_position integer;
  v_block_id uuid;
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

  if p_mesocycle_count not between 1 and 6 then
    raise exception 'MESOCYCLE_COUNT_INVALID';
  end if;

  select role
  into v_coach_role
  from public.profiles
  where id = p_coach_id;

  if not found or v_coach_role <> 'coach' then
    raise exception 'COACH_UNAVAILABLE';
  end if;

  -- Lock the client row so simultaneous requests cannot create the same
  -- block position.
  select role
  into v_client_role
  from public.profiles
  where id = p_client_id
  for update;

  if not found or v_client_role <> 'client' then
    raise exception 'CLIENT_UNAVAILABLE';
  end if;

  select coalesce(max(position), 0) + 1
  into v_block_position
  from public.training_blocks
  where client_id = p_client_id;

  insert into public.training_blocks (
    name,
    description,
    status,
    created_by,
    client_id,
    position,
    starts_on
  )
  values (
    p_name,
    p_description,
    'draft',
    p_coach_id,
    p_client_id,
    v_block_position,
    p_starts_on
  )
  returning id into v_block_id;

  for v_index in 1..p_mesocycle_count loop
    insert into public.client_mesocycles (
      training_block_id,
      name,
      position,
      status
    )
    values (
      v_block_id,
      format('Mesocycle %s', v_index),
      v_index,
      'draft'
    );
  end loop;

  return v_block_id;
end;
$function$;

comment on function public.create_client_training_block(
  uuid,
  uuid,
  text,
  text,
  integer,
  date
) is
  'Creates an ordered client training block with one to six mesocycles. The default count is three.';

-- Change the number of mesocycles in an existing block.
--
-- Reducing the count is allowed only when the removed mesocycles contain no
-- assigned templates.
create function public.resize_client_training_block(
  p_coach_id uuid,
  p_block_id uuid,
  p_mesocycle_count integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_current_count integer;
  v_index integer;
begin
  if p_mesocycle_count not between 1 and 6 then
    raise exception 'MESOCYCLE_COUNT_INVALID';
  end if;

  -- Lock the block before reading or changing its mesocycles.
  perform 1
  from public.training_blocks
  where id = p_block_id
    and created_by = p_coach_id
  for update;

  if not found then
    raise exception 'BLOCK_UNAVAILABLE';
  end if;

  select count(*)::integer
  into v_current_count
  from public.client_mesocycles
  where training_block_id = p_block_id;

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
  set updated_at = now()
  where id = p_block_id;

  return p_mesocycle_count;
end;
$function$;

comment on function public.resize_client_training_block(
  uuid,
  uuid,
  integer
) is
  'Changes a client block to one through six mesocycles without removing assigned plans.';

revoke all on function public.create_client_training_block(
  uuid,
  uuid,
  text,
  text,
  integer,
  date
) from public, anon, authenticated;

revoke all on function public.resize_client_training_block(
  uuid,
  uuid,
  integer
) from public, anon, authenticated;

grant execute on function public.create_client_training_block(
  uuid,
  uuid,
  text,
  text,
  integer,
  date
) to service_role;

grant execute on function public.resize_client_training_block(
  uuid,
  uuid,
  integer
) to service_role;

commit;