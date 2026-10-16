--
-- PostgreSQL database dump
--

\restrict vPDw1tmYkDT2sj1aluL4YJxYGdx8kZkm1k9QsBsH5CcQtvv0XuTtKwK7KUuf3MH

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: coach_append_workout(uuid, uuid, uuid, uuid, text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.coach_append_workout(p_coach_id uuid, p_program_id uuid, p_week_id uuid, p_item_id uuid, p_name text, p_estimated_minutes integer, p_warmup_notes text) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  v_existing public.program_workouts%rowtype;
  v_ids uuid[];
  v_count integer;
  v_offset integer;
  v_index integer;
begin
  perform w.id
  from public.program_weeks w
  join public.programs p on p.id = w.program_id
  where w.id = p_week_id and p.id = p_program_id
    and p.created_by = p_coach_id
  for update of w;

  if not found then
    raise exception using errcode = 'P0001', message = 'WEEK_UNAVAILABLE';
  end if;

  if p_item_id is null or p_name is null
    or char_length(btrim(p_name)) not between 1 and 100
    or p_warmup_notes is null or char_length(p_warmup_notes) > 2000
    or (p_estimated_minutes is not null
        and p_estimated_minutes not between 1 and 300) then
    raise exception using errcode = 'P0001', message = 'INVALID_WORKOUT';
  end if;

  -- A lost response followed by a retry must not create a second workout.
  select * into v_existing from public.program_workouts where id = p_item_id;
  if found then
    if v_existing.week_id = p_week_id
      and v_existing.name = btrim(p_name)
      and v_existing.estimated_minutes is not distinct from p_estimated_minutes
      and v_existing.warmup_notes = p_warmup_notes then
      return p_item_id;
    end if;
    raise exception using errcode = 'P0001', message = 'ITEM_CONFLICT';
  end if;

  select coalesce(array_agg(id order by position, id), '{}'::uuid[]),
    count(*)::integer, coalesce(max(position), 0) + 1
  into v_ids, v_count, v_offset
  from public.program_workouts where week_id = p_week_id;

  if v_count >= 7 then
    raise exception using errcode = 'P0001', message = 'WEEK_FULL';
  end if;

  -- Preserve the order and close any gaps left by old manual numbering.
  -- Move into an unused positive range first to respect the unique constraint.
  update public.program_workouts set position = position + v_offset
  where week_id = p_week_id;
  if v_count > 0 then
    for v_index in 1..v_count loop
      update public.program_workouts set position = v_index
      where id = v_ids[v_index] and week_id = p_week_id;
    end loop;
  end if;

  insert into public.program_workouts
    (id, week_id, name, position, estimated_minutes, warmup_notes)
  values
    (p_item_id, p_week_id, btrim(p_name), v_count + 1,
     p_estimated_minutes, p_warmup_notes);
  return p_item_id;
end;
$$;


--
-- Name: coach_link_progression(uuid, uuid, text, uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.coach_link_progression(p_coach_id uuid, p_program_id uuid, p_kind text, p_reference_id uuid, p_item_id uuid, p_unlink boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  ref record;
  item record;
  new_key uuid;
begin
  -- Serialize link changes for a program and enforce ownership even with a service client.
  perform 1 from public.programs where id = p_program_id and created_by = p_coach_id for update;
  if not found then raise exception 'PROGRAM_UNAVAILABLE'; end if;
  if p_kind = 'workout' then
    select w.id, w.week_id, w.progression_key into item
      from public.program_workouts w join public.program_weeks k on k.id = w.week_id
      where w.id = p_item_id and k.program_id = p_program_id;
    if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
    if p_unlink then new_key := gen_random_uuid();
    else
      select w.id, w.week_id, w.progression_key into ref
        from public.program_workouts w join public.program_weeks k on k.id = w.week_id
        where w.id = p_reference_id and k.program_id = p_program_id;
      if not found then raise exception 'REFERENCE_UNAVAILABLE'; end if;
      if ref.week_id = item.week_id then raise exception 'DIFFERENT_WEEKS_REQUIRED'; end if;
      new_key := ref.progression_key;
    end if;
    update public.program_workouts set progression_key = new_key where id = item.id;
  elsif p_kind = 'exercise' then
    select e.id, e.progression_key, w.week_id, w.progression_key as workout_key into item
      from public.program_exercises e join public.program_workouts w on w.id = e.workout_id
      join public.program_weeks k on k.id = w.week_id
      where e.id = p_item_id and k.program_id = p_program_id;
    if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
    if p_unlink then new_key := gen_random_uuid();
    else
      select e.id, e.progression_key, w.week_id, w.progression_key as workout_key into ref
        from public.program_exercises e join public.program_workouts w on w.id = e.workout_id
        join public.program_weeks k on k.id = w.week_id
        where e.id = p_reference_id and k.program_id = p_program_id;
      if not found then raise exception 'REFERENCE_UNAVAILABLE'; end if;
      if ref.week_id = item.week_id then raise exception 'DIFFERENT_WEEKS_REQUIRED'; end if;
      if ref.workout_key <> item.workout_key then raise exception 'LINK_WORKOUT_FIRST'; end if;
      new_key := ref.progression_key;
    end if;
    update public.program_exercises set progression_key = new_key where id = item.id;
  else raise exception 'INVALID_KIND';
  end if;
end;
$$;


--
-- Name: coach_move_workout(uuid, uuid, uuid, uuid, text, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.coach_move_workout(p_coach_id uuid, p_program_id uuid, p_week_id uuid, p_workout_id uuid, p_direction text, p_expected_order uuid[]) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  v_ids uuid[];
  v_count integer;
  v_offset integer;
  v_index integer;
  v_target integer;
  v_other uuid;
begin
  perform w.id
  from public.program_weeks w
  join public.programs p on p.id = w.program_id
  where w.id = p_week_id and p.id = p_program_id
    and p.created_by = p_coach_id
  for update of w;

  if not found then
    raise exception using errcode = 'P0001', message = 'WEEK_UNAVAILABLE';
  end if;
  if p_direction is null or p_direction not in ('up', 'down') then
    raise exception using errcode = 'P0001', message = 'INVALID_DIRECTION';
  end if;

  select coalesce(array_agg(id order by position, id), '{}'::uuid[]),
    count(*)::integer, coalesce(max(position), 0) + 1
  into v_ids, v_count, v_offset
  from public.program_workouts where week_id = p_week_id;

  -- An old tab or repeated request must not silently move the wrong neighbour.
  if v_ids is distinct from p_expected_order then
    raise exception using errcode = 'P0001', message = 'ORDER_CHANGED';
  end if;

  v_index := array_position(v_ids, p_workout_id);
  if v_index is null then
    raise exception using errcode = 'P0001', message = 'WORKOUT_UNAVAILABLE';
  end if;
  v_target := v_index + case when p_direction = 'up' then -1 else 1 end;
  if v_target < 1 or v_target > v_count then
    return;
  end if;

  v_other := v_ids[v_target];
  v_ids[v_target] := p_workout_id;
  v_ids[v_index] := v_other;

  -- All position updates commit together, or all roll back together.
  update public.program_workouts set position = position + v_offset
  where week_id = p_week_id;
  for v_index in 1..v_count loop
    update public.program_workouts set position = v_index
    where id = v_ids[v_index] and week_id = p_week_id;
  end loop;
end;
$$;


--
-- Name: coach_template_mutation(uuid, uuid, bigint, uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.coach_template_mutation(p_coach_id uuid, p_program_id uuid, p_expected_revision bigint, p_request_id uuid, p_operation text, p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
#variable_conflict use_column
declare
 p public.programs%rowtype; receipt public.program_mutation_receipts%rowtype;
 w public.program_workouts%rowtype; source_w public.program_workouts%rowtype;
 e public.program_exercises%rowtype; s public.program_sets%rowtype;
 k public.program_weeks%rowtype; source_k public.program_weeks%rowtype;
 v_result jsonb; v_count integer; v_position integer; v_other integer; v_offset integer;
 v_id uuid; v_new_program uuid; v_key uuid; v_keys uuid[]; v_exercise uuid; v_workout uuid;
 v_map jsonb:='{}'; v_name text; v_base text; v_suffix integer; v_i integer;
 v_order uuid[]; v_revision bigint; v_min integer; v_max integer; v_rir integer; v_rest integer; v_sets integer;
begin
 if p_coach_id is null or p_program_id is null or p_request_id is null or p_expected_revision is null or p_expected_revision<0
   or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_REQUEST'; end if;
 -- Serialize this small private coach account, including duplicate-name allocation.
 perform pg_advisory_xact_lock(hashtextextended(p_coach_id::text,0));
 select * into receipt from public.program_mutation_receipts where coach_id=p_coach_id and request_id=p_request_id;
 if found then
   if receipt.program_id=p_program_id and receipt.operation=p_operation and receipt.payload=p_payload then return receipt.result; end if;
   raise exception 'REQUEST_CONFLICT';
 end if;
 if p_operation='create' then
   if exists(select 1 from public.programs where id=p_program_id) then raise exception 'REQUEST_CONFLICT'; end if;
   v_count:=(p_payload->>'count')::integer;
   if v_count is null or v_count not between 1 and 7 then raise exception 'WORKOUT_LIMIT'; end if;
   if char_length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 100
     or char_length(coalesce(p_payload->>'goal',''))>300 or char_length(coalesce(p_payload->>'description',''))>2000 then raise exception 'INVALID_REQUEST'; end if;
   insert into public.programs(id,name,goal,description,duration_weeks,sessions_per_week,status,created_by,template_version)
     values(p_program_id,btrim(p_payload->>'name'),coalesce(p_payload->>'goal',''),coalesce(p_payload->>'description',''),4,v_count,'draft',p_coach_id,2);
   v_keys:=array(select gen_random_uuid() from generate_series(1,v_count));
   for v_i in 1..4 loop
     v_id:=gen_random_uuid();
     insert into public.program_weeks(id,program_id,week_number) values(v_id,p_program_id,v_i);
     for v_position in 1..v_count loop
       insert into public.program_workouts(id,week_id,name,position,progression_key)
         values(gen_random_uuid(),v_id,'Workout '||v_position,v_position,v_keys[v_position]);
     end loop;
   end loop;
   v_result:=jsonb_build_object('programId',p_program_id);
 else
   select * into p from public.programs where id=p_program_id and created_by=p_coach_id for update;
   if not found then raise exception 'PROGRAM_UNAVAILABLE'; end if;
   if p.template_revision<>p_expected_revision then raise exception 'STALE_TEMPLATE'; end if;
   if p.template_version<>2 and p_operation not in('duplicate','details') then raise exception 'LEGACY_TEMPLATE'; end if;
   v_result:=jsonb_build_object('programId',p_program_id);
   if p_operation='details' then
     v_count:=(p_payload->>'count')::integer;
     if char_length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 100
       or char_length(coalesce(p_payload->>'goal',''))>300 or char_length(coalesce(p_payload->>'description',''))>2000
       or coalesce(p_payload->>'status','') not in('draft','active','archived') then raise exception 'INVALID_REQUEST'; end if;
     if p.template_version=2 then
       perform public.template_resize(p_program_id,v_count,(p_payload->>'confirmed')::boolean);
     elsif v_count is distinct from p.sessions_per_week then raise exception 'LEGACY_TEMPLATE'; end if;
     update public.programs set name=btrim(p_payload->>'name'),goal=coalesce(p_payload->>'goal',''),description=coalesce(p_payload->>'description',''),status=p_payload->>'status' where id=p_program_id;
   elsif p_operation='add_workout' then
     perform public.template_resize(p_program_id,p.sessions_per_week+1,false);
   elsif p_operation in('delete_workout','move_workout','workout_details') then
     select * into w from public.program_workouts where id=(p_payload->>'workoutId')::uuid
       and week_id in(select id from public.program_weeks where program_id=p_program_id);
     if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
     if p_operation='workout_details' then
       if char_length(coalesce(p_payload->>'warmup_notes',''))>2000 or ((p_payload->>'estimated_minutes') is not null and (p_payload->>'estimated_minutes')::integer not between 1 and 300) then raise exception 'INVALID_REQUEST'; end if;
       update public.program_workouts set warmup_notes=coalesce(p_payload->>'warmup_notes',''),estimated_minutes=(p_payload->>'estimated_minutes')::integer where id=w.id;
     elsif p_operation='delete_workout' then
       if p.sessions_per_week<=1 then raise exception 'WORKOUT_LIMIT'; end if;
       if not coalesce((p_payload->>'confirmed')::boolean,false) then raise exception 'CONFIRM_REMOVAL'; end if;
       delete from public.program_workouts where progression_key=w.progression_key and week_id in(select id from public.program_weeks where program_id=p_program_id);
       -- Renumber without transient collisions with the unique position index.
       update public.program_workouts set position=position+100 where week_id in(select id from public.program_weeks where program_id=p_program_id) and position>w.position;
       update public.program_workouts set position=position-101,name='Workout '||(position-101) where week_id in(select id from public.program_weeks where program_id=p_program_id) and position>100;
       update public.programs set sessions_per_week=sessions_per_week-1 where id=p_program_id;
     else
       if coalesce(p_payload->>'direction','') not in('up','down') then raise exception 'INVALID_REQUEST'; end if;
       v_other:=w.position+case when p_payload->>'direction'='up' then -1 else 1 end;
       if v_other between 1 and p.sessions_per_week then
         update public.program_workouts set position=position+100 where week_id in(select id from public.program_weeks where program_id=p_program_id) and position in(w.position,v_other);
         update public.program_workouts set position=case when position=w.position+100 then v_other else w.position end,
           name='Workout '||(case when position=w.position+100 then v_other else w.position end)
           where week_id in(select id from public.program_weeks where program_id=p_program_id) and position in(w.position+100,v_other+100);
       end if;
     end if;
   elsif p_operation='copy_week' then
     select * into k from public.program_weeks where id=(p_payload->>'weekId')::uuid and program_id=p_program_id;
     if not found or k.week_number=1 then raise exception 'INVALID_REQUEST'; end if;
     select * into source_k from public.program_weeks where program_id=p_program_id and week_number=k.week_number-1;
     if exists(select 1 from public.program_exercises where workout_id in(select id from public.program_workouts where week_id=k.id))
       and not coalesce((p_payload->>'confirmed')::boolean,false) then raise exception 'CONFIRM_REPLACE'; end if;
     for w in select * from public.program_workouts where week_id=k.id order by position loop
       select * into source_w from public.program_workouts where week_id=source_k.id and progression_key=w.progression_key;
       if not found then raise exception 'TEMPLATE_SHAPE'; end if;
       delete from public.program_exercises where workout_id=w.id;
       update public.program_workouts set estimated_minutes=source_w.estimated_minutes,warmup_notes=source_w.warmup_notes where id=w.id;
       for e in select * from public.program_exercises where workout_id=source_w.id order by position loop
         perform public.template_clone_exercise(e.id,w.id,gen_random_uuid(),e.position,e.progression_key);
       end loop;
     end loop;
     update public.program_weeks set focus=source_k.focus,coaching_notes=source_k.coaching_notes,is_deload=source_k.is_deload where id=k.id;
   elsif p_operation='duplicate' then
     if p.template_version<>2 and not coalesce((p_payload->>'confirmed')::boolean,false) then raise exception 'CONFIRM_LEGACY_COPY'; end if;
     v_new_program:=gen_random_uuid();
     v_suffix:=1;
     loop
       v_base:=case when v_suffix=1 then ' - dup' else ' - dup '||v_suffix end;
       v_name:=left(p.name,100-char_length(v_base))||v_base;
       exit when not exists(select 1 from public.programs where created_by=p_coach_id and name=v_name);
       v_suffix:=v_suffix+1;
     end loop;
     select greatest(p.sessions_per_week,coalesce(max(n),0)) into v_count from (
       select count(*)::integer n from public.program_workouts w join public.program_weeks k on k.id=w.week_id where k.program_id=p_program_id and k.week_number between 1 and 4 group by w.week_id
     ) counts;
     if v_count not between 1 and 7 then raise exception 'WORKOUT_LIMIT'; end if;
     insert into public.programs(id,name,goal,description,duration_weeks,sessions_per_week,status,created_by,template_version)
       values(v_new_program,v_name,p.goal,p.description,4,v_count,'draft',p_coach_id,2);
     v_keys:=array(select gen_random_uuid() from generate_series(1,v_count));
     for v_i in 1..4 loop
       select * into source_k from public.program_weeks where program_id=p_program_id and week_number=v_i;
       v_id:=gen_random_uuid();
       insert into public.program_weeks(id,program_id,week_number,focus,coaching_notes,is_deload)
         values(v_id,v_new_program,v_i,coalesce(source_k.focus,''),coalesce(source_k.coaching_notes,''),coalesce(source_k.is_deload,false));
       v_order:=array(select id from public.program_workouts where week_id=source_k.id order by position,id);
       for v_position in 1..v_count loop
         select * into source_w from public.program_workouts where id=v_order[v_position];
         v_workout:=gen_random_uuid();
         insert into public.program_workouts(id,week_id,name,position,progression_key,estimated_minutes,warmup_notes)
           values(v_workout,v_id,'Workout '||v_position,v_position,v_keys[v_position],source_w.estimated_minutes,coalesce(source_w.warmup_notes,''));
         for e in select * from public.program_exercises where workout_id=source_w.id order by position loop
           if not v_map ? e.progression_key::text then v_map:=v_map||jsonb_build_object(e.progression_key::text,gen_random_uuid()); end if;
           perform public.template_clone_exercise(e.id,v_workout,gen_random_uuid(),e.position,(v_map->>e.progression_key::text)::uuid);
         end loop;
       end loop;
     end loop;
     perform public.template_assert_valid(v_new_program,false);
     v_result:=jsonb_build_object('programId',v_new_program);
   elsif p_operation in('create_exercise','edit_exercise','duplicate_exercise','move_exercise','delete_exercise','create_set','edit_set','delete_set','link_exercise') then
     v_workout:=(p_payload->>'workoutId')::uuid;
     if p_operation='link_exercise' then
       select workout_id into v_workout from public.program_exercises where id=(p_payload->>'exerciseId')::uuid;
     end if;
     select * into w from public.program_workouts where id=v_workout
       and week_id in(select id from public.program_weeks where program_id=p_program_id);
     if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
     v_result:=v_result||jsonb_build_object('workoutId',w.id);
     if p_operation not in('create_exercise') then
       select * into e from public.program_exercises where id=(p_payload->>'exerciseId')::uuid and workout_id=w.id;
       if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
       v_result:=v_result||jsonb_build_object('itemId',e.id);
     end if;
     if p_operation in('create_exercise','edit_exercise') then
       if char_length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 100
         or char_length(coalesce(p_payload->>'variation',''))>200 or char_length(coalesce(p_payload->>'coaching_cues',''))>2000
         or char_length(coalesce(p_payload->>'exercise_group',''))>100 or char_length(coalesce(p_payload->>'coach_notes',''))>2000
         or coalesce(p_payload->>'side','both') not in('both','alternating','each_side') then raise exception 'INVALID_REQUEST'; end if;
       if p_operation='create_exercise' then
         select count(*)::integer,coalesce(max(position),0)+1 into v_count,v_position from public.program_exercises where workout_id=w.id;
         if v_count>=50 then raise exception 'EXERCISE_LIMIT'; end if;
         v_sets:=(p_payload->>'working_sets')::integer; v_min:=(p_payload->>'reps_min')::integer;
         v_max:=coalesce((p_payload->>'reps_max')::integer,v_min); v_rir:=coalesce((p_payload->>'rir')::integer,2); v_rest:=coalesce((p_payload->>'rest_seconds')::integer,120);
         if v_sets is null or v_sets not between 1 and 50 or v_min is null or v_min not between 1 and 1000 or v_max<v_min or v_max>1000 or v_rir not between 0 and 10 or v_rest not between 0 and 3600 then raise exception 'INVALID_REQUEST'; end if;
         v_exercise:=gen_random_uuid();
         insert into public.program_exercises(id,workout_id,name,position,variation,side,load_unit,load_convention,coaching_cues,exercise_group,coach_notes)
           values(v_exercise,w.id,btrim(p_payload->>'name'),v_position,coalesce(p_payload->>'variation',''),coalesce(p_payload->>'side','both'),'kg','total',coalesce(p_payload->>'coaching_cues',''),coalesce(p_payload->>'exercise_group',''),coalesce(p_payload->>'coach_notes',''));
         for v_i in 1..v_sets loop
           insert into public.program_sets(id,exercise_id,set_number,set_type,reps_min,reps_max,rir,rest_seconds)
             values(gen_random_uuid(),v_exercise,v_i,'working',v_min,v_max,v_rir,v_rest);
         end loop;
         v_result:=v_result||jsonb_build_object('itemId',v_exercise);
       else
         update public.program_exercises set name=btrim(p_payload->>'name'),variation=coalesce(p_payload->>'variation',''),side=coalesce(p_payload->>'side','both'),coaching_cues=coalesce(p_payload->>'coaching_cues',''),exercise_group=coalesce(p_payload->>'exercise_group',''),coach_notes=coalesce(p_payload->>'coach_notes','') where id=e.id;
       end if;
     elsif p_operation='duplicate_exercise' then
       select count(*)::integer,coalesce(max(position),0)+1 into v_count,v_position from public.program_exercises where workout_id=w.id;
       if v_count>=50 then raise exception 'EXERCISE_LIMIT'; end if;
       v_exercise:=gen_random_uuid();
       perform public.template_clone_exercise(e.id,w.id,v_exercise,v_position,gen_random_uuid());
       v_result:=v_result||jsonb_build_object('itemId',v_exercise);
     elsif p_operation='move_exercise' then
       if coalesce(p_payload->>'direction','') not in('up','down') then raise exception 'INVALID_REQUEST'; end if;
       select id,position into v_exercise,v_other from public.program_exercises where workout_id=w.id
         and case when p_payload->>'direction'='up' then position<e.position else position>e.position end
         order by case when p_payload->>'direction'='up' then -position else position end limit 1;
       if v_exercise is not null then
         select coalesce(max(position),0)+1 into v_offset from public.program_exercises where workout_id=w.id;
         update public.program_exercises set position=v_offset where id=e.id;
         update public.program_exercises set position=e.position where id=v_exercise;
         update public.program_exercises set position=v_other where id=e.id;
       end if;
     elsif p_operation='delete_exercise' then
       if not coalesce((p_payload->>'confirmed')::boolean,false) then raise exception 'CONFIRM_REMOVAL'; end if;
       delete from public.program_exercises where id=e.id;
       v_order:=array(select id from public.program_exercises where workout_id=w.id order by position,id);
       select coalesce(max(position),0)+1 into v_offset from public.program_exercises where workout_id=w.id;
       update public.program_exercises set position=position+v_offset where workout_id=w.id;
       for v_i in 1..coalesce(array_length(v_order,1),0) loop
         update public.program_exercises set position=v_i where id=v_order[v_i];
       end loop;
     elsif p_operation='link_exercise' then
       if coalesce((p_payload->>'unlink')::boolean,false) then v_key:=gen_random_uuid();
       else
         select x.progression_key into v_key from public.program_exercises x join public.program_workouts y on y.id=x.workout_id
           join public.program_weeks z on z.id=y.week_id where x.id=(p_payload->>'referenceId')::uuid
           and z.program_id=p_program_id and y.progression_key=w.progression_key and y.week_id<>w.week_id;
         if v_key is null then raise exception 'ITEM_UNAVAILABLE'; end if;
       end if;
       update public.program_exercises set progression_key=v_key where id=e.id;
     else
       if p_operation<>'create_set' then
         select * into s from public.program_sets where id=(p_payload->>'setId')::uuid and exercise_id=e.id;
         if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
       end if;
       if p_operation='delete_set' then
         if not coalesce((p_payload->>'confirmed')::boolean,false) then raise exception 'CONFIRM_REMOVAL'; end if;
         delete from public.program_sets where id=s.id;
         v_order:=array(select id from public.program_sets where exercise_id=e.id order by set_number,id);
         select coalesce(max(set_number),0)+1 into v_offset from public.program_sets where exercise_id=e.id;
         update public.program_sets set set_number=set_number+v_offset where exercise_id=e.id;
         for v_i in 1..coalesce(array_length(v_order,1),0) loop
           update public.program_sets set set_number=v_i where id=v_order[v_i];
         end loop;
       else
         v_min:=(p_payload->>'reps_min')::integer; v_max:=coalesce((p_payload->>'reps_max')::integer,v_min);
         v_rir:=coalesce((p_payload->>'rir')::integer,2); v_rest:=coalesce((p_payload->>'rest_seconds')::integer,120);
         if v_min is null or v_min not between 1 and 1000 or v_max<v_min or v_max>1000 or v_rir not between 0 and 10 or v_rest not between 0 and 3600
           or coalesce(p_payload->>'set_type','working') not in('warmup','working','top','backoff','drop')
           or char_length(coalesce(p_payload->>'notes',''))>2000
           or coalesce(p_payload->>'side_override','') not in('','both','alternating','each_side') then raise exception 'INVALID_REQUEST'; end if;
         if p_operation='create_set' then
           select count(*)::integer,coalesce(max(set_number),0)+1 into v_count,v_position from public.program_sets where exercise_id=e.id;
           if v_count>=50 then raise exception 'SET_LIMIT'; end if;
           insert into public.program_sets(id,exercise_id,set_number,set_type,reps_min,reps_max,rir,rest_seconds,side_override,notes)
             values(gen_random_uuid(),e.id,v_position,coalesce(p_payload->>'set_type','working'),v_min,v_max,v_rir,v_rest,nullif(p_payload->>'side_override',''),coalesce(p_payload->>'notes',''));
         else
           -- Keep existing target loads; personal loads are entered in client assignments.
           update public.program_sets set set_type=coalesce(p_payload->>'set_type','working'),reps_min=v_min,reps_max=v_max,rir=v_rir,rest_seconds=v_rest,side_override=nullif(p_payload->>'side_override',''),notes=coalesce(p_payload->>'notes','') where id=s.id;
         end if;
       end if;
     end if;
   else raise exception 'INVALID_REQUEST'; end if;
 end if;
 perform public.template_assert_valid(p_program_id,(select status='active' from public.programs where id=p_program_id));
 insert into public.program_mutation_receipts(coach_id,request_id,program_id,operation,payload,result)
   values(p_coach_id,p_request_id,p_program_id,p_operation,p_payload,v_result);
 return v_result;
end $$;


--
-- Name: create_profile_for_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_profile_for_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    split_part(new.email, '@', 1),
    'client'
  );

  return new;
end;
$$;


--
-- Name: template_assert_valid(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.template_assert_valid(p_program uuid, p_ready boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
#variable_conflict use_column
declare p public.programs%rowtype; v_count integer; v_keys uuid[]; k record; keys uuid[];
begin
  select * into p from public.programs where id=p_program;
  if p.template_version<>2 then return; end if;
  if p.duration_weeks<>4 or p.sessions_per_week not between 1 and 7 then raise exception 'TEMPLATE_SHAPE'; end if;
  select count(*) into v_count from public.program_weeks where program_id=p_program;
  if v_count<>4 or exists(select 1 from public.program_weeks where program_id=p_program and week_number not between 1 and 4) then raise exception 'TEMPLATE_SHAPE'; end if;
  for k in select id from public.program_weeks where program_id=p_program order by week_number loop
    select count(*),array_agg(progression_key order by position) into v_count,keys from public.program_workouts where week_id=k.id;
    if v_count<>p.sessions_per_week or exists(select 1 from public.program_workouts where week_id=k.id and position not between 1 and p.sessions_per_week) then raise exception 'TEMPLATE_SHAPE'; end if;
    if v_keys is null then v_keys:=keys; elsif keys is distinct from v_keys then raise exception 'TEMPLATE_SHAPE'; end if;
  end loop;
  if p_ready and (
    exists(select 1 from public.program_workouts w join public.program_weeks k on k.id=w.week_id
      where k.program_id=p_program and not exists(select 1 from public.program_exercises e where e.workout_id=w.id))
    or exists(select 1 from public.program_exercises e join public.program_workouts w on w.id=e.workout_id
      join public.program_weeks k on k.id=w.week_id where k.program_id=p_program and (
        not exists(select 1 from public.program_sets s where s.exercise_id=e.id)
        or exists(select 1 from public.program_sets s where s.exercise_id=e.id and
          (s.reps_min<1 or s.reps_max<s.reps_min or s.rir is null or s.rir not between 0 and 10 or s.rest_seconds is null or s.rest_seconds not between 0 and 3600))
      ))
  ) then raise exception 'TEMPLATE_NOT_READY'; end if;
end $$;


--
-- Name: template_clone_exercise(uuid, uuid, uuid, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.template_clone_exercise(p_source uuid, p_workout uuid, p_id uuid, p_position integer, p_key uuid) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
#variable_conflict use_column
declare e public.program_exercises%rowtype; s public.program_sets%rowtype;
begin
  select * into e from public.program_exercises where id=p_source;
  if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
  -- Preserve every existing prescription/setup field; convert old lb copies to
  -- kg rather than relabeling the numbers. Existing originals retain their unit.
  e := jsonb_populate_record(e,jsonb_build_object('id',p_id,'workout_id',p_workout,'position',p_position,'progression_key',p_key,'load_unit','kg','created_at',now()));
  insert into public.program_exercises select e.*;
  for s in select * from public.program_sets where exercise_id=p_source order by set_number loop
    if (select load_unit from public.program_exercises where id=p_source)='lb' and s.target_load is not null then
      s.target_load := round((s.target_load * 0.45359237)::numeric,2);
    end if;
    s := jsonb_populate_record(s,jsonb_build_object('id',gen_random_uuid(),'exercise_id',p_id,'created_at',now()));
    insert into public.program_sets select s.*;
  end loop;
end $$;


--
-- Name: template_resize(uuid, integer, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.template_resize(p_program uuid, p_count integer, p_confirm boolean) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
#variable_conflict use_column
declare p public.programs%rowtype; k record; v_key uuid; v_position integer;
begin
  select * into p from public.programs where id=p_program;
  if p_count not between 1 and 7 or p_count is null then raise exception 'WORKOUT_LIMIT'; end if;
  if p_count<p.sessions_per_week then
    if not coalesce(p_confirm,false) then raise exception 'CONFIRM_REMOVAL'; end if;
    delete from public.program_workouts where week_id in(select id from public.program_weeks where program_id=p_program) and position>p_count;
  elsif p_count>p.sessions_per_week then
    for v_position in p.sessions_per_week+1..p_count loop
      v_key:=gen_random_uuid();
      for k in select id from public.program_weeks where program_id=p_program loop
        insert into public.program_workouts(id,week_id,name,position,progression_key)
        values(gen_random_uuid(),k.id,'Workout '||v_position,v_position,v_key);
      end loop;
    end loop;
  end if;
  update public.programs set sessions_per_week=p_count where id=p_program;
end $$;


--
-- Name: template_revision_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.template_revision_trigger() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
#variable_conflict use_column
declare v_program uuid; v_parent uuid;
begin
  if tg_table_name='programs' then
    new.template_revision := old.template_revision + 1;
    return new;
  end if;
  if tg_table_name='program_weeks' then
    v_program := case when tg_op='DELETE' then old.program_id else new.program_id end;
  elsif tg_table_name='program_workouts' then
    v_parent := case when tg_op='DELETE' then old.week_id else new.week_id end;
    select program_id into v_program from public.program_weeks where id=v_parent;
  elsif tg_table_name='program_exercises' then
    v_parent := case when tg_op='DELETE' then old.workout_id else new.workout_id end;
    select k.program_id into v_program from public.program_workouts w
      join public.program_weeks k on k.id=w.week_id where w.id=v_parent;
  else
    v_parent := case when tg_op='DELETE' then old.exercise_id else new.exercise_id end;
    select k.program_id into v_program from public.program_exercises e
      join public.program_workouts w on w.id=e.workout_id join public.program_weeks k on k.id=w.week_id
      where e.id=v_parent;
  end if;
  update public.programs set template_revision=template_revision+1 where id=v_program;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    display_name text,
    role text DEFAULT 'client'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['coach'::text, 'client'::text])))
);


--
-- Name: program_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_exercises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workout_id uuid NOT NULL,
    name text NOT NULL,
    "position" integer NOT NULL,
    variation text DEFAULT ''::text NOT NULL,
    target_muscles text DEFAULT ''::text NOT NULL,
    machine_settings text DEFAULT ''::text NOT NULL,
    attachment text DEFAULT ''::text NOT NULL,
    setup_instructions text DEFAULT ''::text NOT NULL,
    side text DEFAULT 'both'::text NOT NULL,
    load_convention text DEFAULT 'total'::text NOT NULL,
    load_unit text DEFAULT 'kg'::text NOT NULL,
    coaching_cues text DEFAULT ''::text NOT NULL,
    exercise_group text DEFAULT ''::text NOT NULL,
    coach_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    progression_key uuid DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT program_exercises_load_convention_check CHECK ((load_convention = ANY (ARRAY['total'::text, 'per_dumbbell'::text, 'added_plates'::text, 'machine_display'::text, 'assistance'::text, 'bodyweight'::text]))),
    CONSTRAINT program_exercises_load_unit_check CHECK ((load_unit = ANY (ARRAY['kg'::text, 'lb'::text]))),
    CONSTRAINT program_exercises_name_check CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 100))),
    CONSTRAINT program_exercises_position_check CHECK (("position" > 0)),
    CONSTRAINT program_exercises_side_check CHECK ((side = ANY (ARRAY['both'::text, 'alternating'::text, 'each_side'::text])))
);


--
-- Name: program_mutation_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_mutation_receipts (
    coach_id uuid NOT NULL,
    request_id uuid NOT NULL,
    program_id uuid NOT NULL,
    operation text NOT NULL,
    payload jsonb NOT NULL,
    result jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: program_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exercise_id uuid NOT NULL,
    set_number integer NOT NULL,
    set_type text DEFAULT 'working'::text NOT NULL,
    reps_min integer NOT NULL,
    reps_max integer NOT NULL,
    target_load numeric(8,2),
    rir integer,
    rest_seconds integer,
    side_override text,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT program_sets_check CHECK ((reps_max >= reps_min)),
    CONSTRAINT program_sets_notes_check CHECK ((char_length(notes) <= 2000)),
    CONSTRAINT program_sets_reps_max_check CHECK (((reps_max >= 1) AND (reps_max <= 1000))),
    CONSTRAINT program_sets_reps_min_check CHECK (((reps_min >= 1) AND (reps_min <= 1000))),
    CONSTRAINT program_sets_rest_seconds_check CHECK (((rest_seconds >= 0) AND (rest_seconds <= 3600))),
    CONSTRAINT program_sets_rir_check CHECK (((rir >= 0) AND (rir <= 10))),
    CONSTRAINT program_sets_set_number_check CHECK ((set_number > 0)),
    CONSTRAINT program_sets_set_type_check CHECK ((set_type = ANY (ARRAY['warmup'::text, 'working'::text, 'top'::text, 'backoff'::text, 'drop'::text]))),
    CONSTRAINT program_sets_side_override_check CHECK ((side_override = ANY (ARRAY['both'::text, 'alternating'::text, 'each_side'::text]))),
    CONSTRAINT program_sets_target_load_check CHECK ((target_load >= (0)::numeric))
);


--
-- Name: program_weeks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_weeks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    week_number integer NOT NULL,
    focus text DEFAULT ''::text NOT NULL,
    coaching_notes text DEFAULT ''::text NOT NULL,
    is_deload boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT program_weeks_coaching_notes_check CHECK ((char_length(coaching_notes) <= 2000)),
    CONSTRAINT program_weeks_focus_check CHECK ((char_length(focus) <= 200)),
    CONSTRAINT program_weeks_week_number_check CHECK (((week_number >= 1) AND (week_number <= 52)))
);


--
-- Name: program_workouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_workouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_id uuid NOT NULL,
    name text NOT NULL,
    "position" integer NOT NULL,
    warmup_notes text DEFAULT ''::text NOT NULL,
    estimated_minutes integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    progression_key uuid DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT program_workouts_estimated_minutes_check CHECK (((estimated_minutes >= 1) AND (estimated_minutes <= 300))),
    CONSTRAINT program_workouts_name_check CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 100))),
    CONSTRAINT program_workouts_position_check CHECK (("position" > 0)),
    CONSTRAINT program_workouts_warmup_notes_check CHECK ((char_length(warmup_notes) <= 2000))
);


--
-- Name: programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    duration_weeks integer DEFAULT 4 NOT NULL,
    sessions_per_week integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    goal text DEFAULT ''::text NOT NULL,
    template_version integer DEFAULT 1 NOT NULL,
    template_revision bigint DEFAULT 0 NOT NULL,
    CONSTRAINT programs_description_check CHECK ((char_length(description) <= 2000)),
    CONSTRAINT programs_duration_weeks_check CHECK (((duration_weeks >= 1) AND (duration_weeks <= 52))),
    CONSTRAINT programs_name_check CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 100))),
    CONSTRAINT programs_sessions_per_week_check CHECK (((sessions_per_week >= 1) AND (sessions_per_week <= 7))),
    CONSTRAINT programs_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: program_exercises program_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_exercises
    ADD CONSTRAINT program_exercises_pkey PRIMARY KEY (id);


--
-- Name: program_exercises program_exercises_workout_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_exercises
    ADD CONSTRAINT program_exercises_workout_id_position_key UNIQUE (workout_id, "position");


--
-- Name: program_mutation_receipts program_mutation_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_mutation_receipts
    ADD CONSTRAINT program_mutation_receipts_pkey PRIMARY KEY (coach_id, request_id);


--
-- Name: program_sets program_sets_exercise_id_set_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_sets
    ADD CONSTRAINT program_sets_exercise_id_set_number_key UNIQUE (exercise_id, set_number);


--
-- Name: program_sets program_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_sets
    ADD CONSTRAINT program_sets_pkey PRIMARY KEY (id);


--
-- Name: program_weeks program_weeks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_weeks
    ADD CONSTRAINT program_weeks_pkey PRIMARY KEY (id);


--
-- Name: program_weeks program_weeks_program_id_week_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_weeks
    ADD CONSTRAINT program_weeks_program_id_week_number_key UNIQUE (program_id, week_number);


--
-- Name: program_workouts program_workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_workouts
    ADD CONSTRAINT program_workouts_pkey PRIMARY KEY (id);


--
-- Name: program_workouts program_workouts_week_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_workouts
    ADD CONSTRAINT program_workouts_week_id_position_key UNIQUE (week_id, "position");


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: program_exercise_progression_workout; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX program_exercise_progression_workout ON public.program_exercises USING btree (workout_id, progression_key);


--
-- Name: program_workout_progression_week; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX program_workout_progression_week ON public.program_workouts USING btree (week_id, progression_key);


--
-- Name: program_exercises template_revision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER template_revision BEFORE INSERT OR DELETE OR UPDATE ON public.program_exercises FOR EACH ROW EXECUTE FUNCTION public.template_revision_trigger();


--
-- Name: program_sets template_revision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER template_revision BEFORE INSERT OR DELETE OR UPDATE ON public.program_sets FOR EACH ROW EXECUTE FUNCTION public.template_revision_trigger();


--
-- Name: program_weeks template_revision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER template_revision BEFORE INSERT OR DELETE OR UPDATE ON public.program_weeks FOR EACH ROW EXECUTE FUNCTION public.template_revision_trigger();


--
-- Name: program_workouts template_revision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER template_revision BEFORE INSERT OR DELETE OR UPDATE ON public.program_workouts FOR EACH ROW EXECUTE FUNCTION public.template_revision_trigger();


--
-- Name: programs template_revision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER template_revision BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.template_revision_trigger();


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: program_exercises program_exercises_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_exercises
    ADD CONSTRAINT program_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.program_workouts(id) ON DELETE CASCADE;


--
-- Name: program_sets program_sets_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_sets
    ADD CONSTRAINT program_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.program_exercises(id) ON DELETE CASCADE;


--
-- Name: program_weeks program_weeks_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_weeks
    ADD CONSTRAINT program_weeks_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


--
-- Name: program_workouts program_workouts_week_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_workouts
    ADD CONSTRAINT program_workouts_week_id_fkey FOREIGN KEY (week_id) REFERENCES public.program_weeks(id) ON DELETE CASCADE;


--
-- Name: programs programs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: profiles Users can read their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: program_exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: program_mutation_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_mutation_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: program_sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_sets ENABLE ROW LEVEL SECURITY;

--
-- Name: program_weeks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;

--
-- Name: program_workouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_workouts ENABLE ROW LEVEL SECURITY;

--
-- Name: programs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict vPDw1tmYkDT2sj1aluL4YJxYGdx8kZkm1k9QsBsH5CcQtvv0XuTtKwK7KUuf3MH

