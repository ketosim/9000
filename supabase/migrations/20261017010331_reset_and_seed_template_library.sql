begin;

-- This application currently supports one coach account.
-- Stop safely if the database does not contain exactly one coach.
do $$
declare
  v_coach_count integer;
begin
  select count(*)
  into v_coach_count
  from public.profiles
  where role = 'coach';

  if v_coach_count <> 1 then
    raise exception
      'Expected exactly one coach profile, but found %.',
      v_coach_count;
  end if;
end;
$$;

create temporary table seed_coach (
  id uuid primary key
) on commit drop;

insert into seed_coach (id)
select id
from public.profiles
where role = 'coach';


-- Permanently remove the existing dummy template library.
-- Weeks, workouts, exercises and sets are removed through ON DELETE CASCADE.
delete from public.program_mutation_receipts;

delete from public.programs;


-- Define the replacement template library.
create temporary table seed_templates (
  id uuid primary key,
  name text not null,
  goal text not null,
  description text not null,
  duration_weeks integer not null,
  sessions_per_week integer not null
) on commit drop;

insert into seed_templates (
  id,
  name,
  goal,
  description,
  duration_weeks,
  sessions_per_week
)
values
  (
    gen_random_uuid(),
    'BJJ Strength Base',
    'Build full-body strength that supports regular Brazilian Jiu-Jitsu training.',
    'Two manageable full-body strength workouts per week with an emphasis on pulling strength, posterior-chain strength, single-leg stability and trunk control.',
    5,
    2
  ),
  (
    gen_random_uuid(),
    'BJJ Power & Grip',
    'Develop explosive strength, grip endurance and athletic power for grappling.',
    'Two weekly sessions combining explosive lower-body work, upper-body pulling, loaded carries, grip training and rotational trunk work.',
    4,
    2
  ),
  (
    gen_random_uuid(),
    'Summer Shred Full Body',
    'Build and retain muscle while supporting a fat-loss phase.',
    'Three balanced full-body resistance-training workouts per week with moderate volume, efficient exercise selection and extra shoulder, arm and trunk work.',
    5,
    3
  ),
  (
    gen_random_uuid(),
    'Summer Shred High Frequency',
    'Increase weekly training volume with an upper-body and physique emphasis.',
    'Four resistance-training workouts per week using an upper-lower structure with additional shoulder, arm, upper-chest and back volume.',
    5,
    4
  ),
  (
    gen_random_uuid(),
    'Upper Body Strength',
    'Improve pressing and pulling strength across the upper body.',
    'Two upper-body strength workouts per week centred on horizontal pressing, vertical pressing, rowing and vertical pulling.',
    5,
    2
  ),
  (
    gen_random_uuid(),
    'Upper Body Hypertrophy',
    'Build muscle across the chest, back, shoulders and arms.',
    'Two upper-body hypertrophy workouts per week using moderate repetition ranges and balanced push, pull, shoulder and arm volume.',
    5,
    2
  ),
  (
    gen_random_uuid(),
    'Lower Body Strength',
    'Improve squat, hinge and single-leg strength.',
    'Two lower-body strength workouts per week centred on squat and hinge patterns with supporting unilateral, hamstring, calf and trunk work.',
    5,
    2
  ),
  (
    gen_random_uuid(),
    'Lower Body Hypertrophy',
    'Build muscle across the quadriceps, glutes, hamstrings and calves.',
    'Two lower-body hypertrophy workouts per week using complementary squat, hinge, lunge, leg-curl and calf-raise patterns.',
    5,
    2
  );


-- Save every seeded item as a modern editable template.
insert into public.programs (
  id,
  name,
  goal,
  description,
  duration_weeks,
  sessions_per_week,
  status,
  created_by,
  template_version,
  template_revision
)
select
  template.id,
  template.name,
  template.goal,
  template.description,
  template.duration_weeks,
  template.sessions_per_week,
  'draft',
  coach.id,
  2,
  0
from seed_templates as template
cross join seed_coach as coach;


-- Generate the correct number of weeks for each template.
insert into public.program_weeks (
  program_id,
  week_number,
  focus,
  coaching_notes,
  is_deload
)
select
  template.id,
  week_number,
  '',
  '',
  false
from seed_templates as template
cross join lateral generate_series(
  1,
  template.duration_weeks
) as week_number;


-- Give corresponding workouts in different weeks a shared progression key.
create temporary table seed_workout_keys (
  program_id uuid not null,
  workout_position integer not null,
  progression_key uuid not null,
  primary key (program_id, workout_position)
) on commit drop;

insert into seed_workout_keys (
  program_id,
  workout_position,
  progression_key
)
select
  template.id,
  workout_position,
  gen_random_uuid()
from seed_templates as template
cross join lateral generate_series(
  1,
  template.sessions_per_week
) as workout_position;


-- Generate Workout 1, Workout 2, etc. inside every week.
insert into public.program_workouts (
  week_id,
  name,
  position,
  warmup_notes,
  estimated_minutes,
  progression_key
)
select
  week.id,
  'Workout ' || workout_key.workout_position,
  workout_key.workout_position,
  '',
  null,
  workout_key.progression_key
from public.program_weeks as week
join seed_templates as template
  on template.id = week.program_id
join seed_workout_keys as workout_key
  on workout_key.program_id = template.id;


-- Verify the structure before committing.
do $$
declare
  v_template_count integer;
  v_week_count integer;
  v_workout_count integer;
begin
  select count(*)
  into v_template_count
  from public.programs;

  select count(*)
  into v_week_count
  from public.program_weeks;

  select count(*)
  into v_workout_count
  from public.program_workouts;

  if v_template_count <> 8 then
    raise exception
      'Template seed failed: expected 8 templates, found %.',
      v_template_count;
  end if;

  if v_week_count <> 39 then
    raise exception
      'Template seed failed: expected 39 weeks, found %.',
      v_week_count;
  end if;

  if v_workout_count <> 93 then
    raise exception
      'Template seed failed: expected 93 workouts, found %.',
      v_workout_count;
  end if;
end;
$$;

commit;
