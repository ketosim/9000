begin;

create or replace function public.template_resize_weeks(
  p_program uuid,
  p_duration integer,
  p_confirm boolean
)
returns void
language plpgsql
set search_path to ''
as $$
#variable_conflict use_column
declare
  p public.programs%rowtype;
  v_week_id uuid;
  v_week_number integer;
  v_position integer;
  v_keys uuid[];
  v_has_content boolean;
begin
  select *
  into p
  from public.programs
  where id = p_program
  for update;

  if not found then
    raise exception 'PROGRAM_UNAVAILABLE';
  end if;

  if p_duration is null or p_duration not between 1 and 12 then
    raise exception 'DURATION_LIMIT';
  end if;

  if p.template_version <> 2 then
    raise exception 'LEGACY_TEMPLATE';
  end if;

  if p_duration < p.duration_weeks then
    select exists (
      select 1
      from public.program_weeks k
      where k.program_id = p_program
        and k.week_number > p_duration
        and (
          k.focus <> ''
          or k.coaching_notes <> ''
          or k.is_deload
          or exists (
            select 1
            from public.program_workouts w
            where w.week_id = k.id
              and (
                w.estimated_minutes is not null
                or w.warmup_notes <> ''
                or exists (
                  select 1
                  from public.program_exercises e
                  where e.workout_id = w.id
                )
              )
          )
        )
    )
    into v_has_content;

    if v_has_content and not coalesce(p_confirm, false) then
      raise exception 'CONFIRM_REMOVAL';
    end if;

    delete from public.program_weeks
    where program_id = p_program
      and week_number > p_duration;

  elsif p_duration > p.duration_weeks then
    select array_agg(w.progression_key order by w.position)
    into v_keys
    from public.program_workouts w
    join public.program_weeks k on k.id = w.week_id
    where k.program_id = p_program
      and k.week_number = 1;

    if coalesce(array_length(v_keys, 1), 0) <> p.sessions_per_week then
      raise exception 'TEMPLATE_SHAPE';
    end if;

    for v_week_number in p.duration_weeks + 1..p_duration loop
      v_week_id := gen_random_uuid();

      insert into public.program_weeks (
        id,
        program_id,
        week_number
      )
      values (
        v_week_id,
        p_program,
        v_week_number
      );

      for v_position in 1..p.sessions_per_week loop
        insert into public.program_workouts (
          id,
          week_id,
          name,
          position,
          progression_key
        )
        values (
          gen_random_uuid(),
          v_week_id,
          'Workout ' || v_position,
          v_position,
          v_keys[v_position]
        );
      end loop;
    end loop;
  end if;

  update public.programs
  set duration_weeks = p_duration
  where id = p_program;
end;
$$;

revoke all on function public.template_resize_weeks(
  uuid,
  integer,
  boolean
) from public, anon, authenticated;

grant execute on function public.template_resize_weeks(
  uuid,
  integer,
  boolean
) to service_role;


create or replace function public.template_assert_valid(
  p_program uuid,
  p_ready boolean default false
)
returns void
language plpgsql
set search_path to ''
as $$
#variable_conflict use_column
declare
  p public.programs%rowtype;
  v_count integer;
  v_keys uuid[];
  k record;
  keys uuid[];
begin
  select *
  into p
  from public.programs
  where id = p_program;

  if p.template_version <> 2 then
    return;
  end if;

  if p.duration_weeks not between 1 and 12
    or p.sessions_per_week not between 1 and 7
  then
    raise exception 'TEMPLATE_SHAPE';
  end if;

  select count(*)
  into v_count
  from public.program_weeks
  where program_id = p_program;

  if v_count <> p.duration_weeks
    or exists (
      select 1
      from public.program_weeks
      where program_id = p_program
        and week_number not between 1 and p.duration_weeks
    )
  then
    raise exception 'TEMPLATE_SHAPE';
  end if;

  for k in
    select id
    from public.program_weeks
    where program_id = p_program
    order by week_number
  loop
    select
      count(*),
      array_agg(progression_key order by position)
    into v_count, keys
    from public.program_workouts
    where week_id = k.id;

    if v_count <> p.sessions_per_week
      or exists (
        select 1
        from public.program_workouts
        where week_id = k.id
          and position not between 1 and p.sessions_per_week
      )
    then
      raise exception 'TEMPLATE_SHAPE';
    end if;

    if v_keys is null then
      v_keys := keys;
    elsif keys is distinct from v_keys then
      raise exception 'TEMPLATE_SHAPE';
    end if;
  end loop;

  if p_ready and (
    exists (
      select 1
      from public.program_workouts w
      join public.program_weeks k on k.id = w.week_id
      where k.program_id = p_program
        and not exists (
          select 1
          from public.program_exercises e
          where e.workout_id = w.id
        )
    )
    or exists (
      select 1
      from public.program_exercises e
      join public.program_workouts w on w.id = e.workout_id
      join public.program_weeks k on k.id = w.week_id
      where k.program_id = p_program
        and (
          not exists (
            select 1
            from public.program_sets s
            where s.exercise_id = e.id
          )
          or exists (
            select 1
            from public.program_sets s
            where s.exercise_id = e.id
              and (
                s.reps_min < 1
                or s.reps_max < s.reps_min
                or s.rir is null
                or s.rir not between 0 and 10
                or s.rest_seconds is null
                or s.rest_seconds not between 0 and 3600
              )
          )
        )
    )
  ) then
    raise exception 'TEMPLATE_NOT_READY';
  end if;
end;
$$;

commit;
