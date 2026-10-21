begin;

create or replace function public.update_client_mesocycle(
  p_coach_id uuid,
  p_mesocycle_id uuid,
  p_name text,
  p_duration_weeks integer,
  p_starts_on date
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_status text;
begin
  p_name := btrim(coalesce(p_name, ''));

  if char_length(p_name) not between 1 and 100 then
    raise exception 'MESOCYCLE_NAME_INVALID';
  end if;

  if p_duration_weeks is null
    or p_duration_weeks not between 1 and 52
  then
    raise exception 'MESOCYCLE_DURATION_INVALID';
  end if;

  select client_mesocycles.status
  into v_status
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

  if v_status <> 'draft' then
    raise exception 'MESOCYCLE_NOT_DRAFT';
  end if;

  if exists (
    select 1
    from public.assigned_training_templates
    where mesocycle_id = p_mesocycle_id
      and duration_weeks <> p_duration_weeks
  ) then
    raise exception 'MESOCYCLE_DURATION_MISMATCH';
  end if;

  update public.client_mesocycles
  set
    name = p_name,
    duration_weeks = p_duration_weeks,
    starts_on = p_starts_on,
    updated_at = now()
  where id = p_mesocycle_id;
end;
$function$;

comment on function public.update_client_mesocycle(
  uuid,
  uuid,
  text,
  integer,
  date
) is
  'Updates the editable structure of a draft client mesocycle.';

revoke all on function public.update_client_mesocycle(
  uuid,
  uuid,
  text,
  integer,
  date
) from public, anon, authenticated;

grant execute on function public.update_client_mesocycle(
  uuid,
  uuid,
  text,
  integer,
  date
) to service_role;

commit;