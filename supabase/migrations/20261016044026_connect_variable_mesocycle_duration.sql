begin;

create function pg_temp.replace_once_required(
  p_source text,
  p_old text,
  p_new text
)
returns text
language plpgsql
as $$
declare
  v_position integer;
begin
  p_old := btrim(p_old, E'\n\r');
  p_new := btrim(p_new, E'\n\r');

  v_position := strpos(p_source, p_old);

  if v_position = 0 then
    raise exception 'Expected database function fragment was not found: %',
      left(p_old, 100);
  end if;

  return overlay(
    p_source
    placing p_new
    from v_position
    for char_length(p_old)
  );
end;
$$;

do $migration$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.coach_template_mutation(uuid,uuid,bigint,uuid,text,jsonb)'
      ::regprocedure
  )
  into v_definition;

  /*
   * CREATE:
   * Accept durationWeeks, default to five, and validate 1–12.
   */
  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
if v_count is null or v_count not between 1 and 7 then raise exception 'WORKOUT_LIMIT'; end if;
$old$,
    $new$
if v_count is null or v_count not between 1 and 7 then raise exception 'WORKOUT_LIMIT'; end if;
   if coalesce((p_payload->>'durationWeeks')::integer,5) not between 1 and 12 then raise exception 'DURATION_LIMIT'; end if;
$new$
  );

  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
coalesce(p_payload->>'description',''),4,v_count,'draft'
$old$,
    $new$
coalesce(p_payload->>'description',''),coalesce((p_payload->>'durationWeeks')::integer,5),v_count,'draft'
$new$
  );

  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
for v_i in 1..4 loop
$old$,
    $new$
for v_i in 1..coalesce((p_payload->>'durationWeeks')::integer,5) loop
$new$
  );

  /*
   * DETAILS:
   * Resize workouts first, then resize the number of weeks.
   */
  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
perform public.template_resize(p_program_id,v_count,(p_payload->>'confirmed')::boolean);
$old$,
    $new$
perform public.template_resize(p_program_id,v_count,(p_payload->>'confirmed')::boolean);
       perform public.template_resize_weeks(
         p_program_id,
         coalesce((p_payload->>'durationWeeks')::integer,p.duration_weeks),
         (p_payload->>'confirmed')::boolean
       );
$new$
  );

  /*
   * DUPLICATE:
   * Preserve the source mesocycle's complete duration.
   */
  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
v_new_program:=gen_random_uuid();
$old$,
    $new$
v_new_program:=gen_random_uuid();
     if p.duration_weeks not between 1 and 12 then raise exception 'DURATION_LIMIT'; end if;
$new$
  );

  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
and k.week_number between 1 and 4 group by
$old$,
    $new$
and k.week_number between 1 and p.duration_weeks group by
$new$
  );

  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
values(v_new_program,v_name,p.goal,p.description,4,v_count,'draft'
$old$,
    $new$
values(v_new_program,v_name,p.goal,p.description,p.duration_weeks,v_count,'draft'
$new$
  );

  v_definition := pg_temp.replace_once_required(
    v_definition,
    $old$
for v_i in 1..4 loop
$old$,
    $new$
for v_i in 1..p.duration_weeks loop
$new$
  );

  if strpos(v_definition, 'for v_i in 1..4 loop') > 0
    or strpos(
      v_definition,
      'and k.week_number between 1 and 4 group by'
    ) > 0
  then
    raise exception 'Fixed four-week logic remains in coach_template_mutation';
  end if;

  execute v_definition;
end;
$migration$;

commit;