import type { Field } from "./workout-form";
export const sideOptions = [
  { value: "both", label: "Both sides together" },
  { value: "alternating", label: "Alternating sides" },
  { value: "each_side", label: "Each side separately" },
];
export const setOptions = [
  { value: "working", label: "Working" },
  { value: "warmup", label: "Warm-up" },
  { value: "top", label: "Top set" },
  { value: "backoff", label: "Back-off" },
  { value: "drop", label: "Drop set" },
];
export const exerciseFields: Field[] = [
  { name: "name", label: "Exercise name", required: true, maxLength: 100 },
  {
    name: "coaching_cues",
    label: "Coaching cues (optional)",
    type: "textarea",
    maxLength: 2000,
  },
  {
    name: "variation",
    label: "Variation (optional)",
    maxLength: 200,
    advanced: true,
  },
  {
    name: "side",
    label: "Side",
    defaultValue: "both",
    options: sideOptions,
    advanced: true,
  },
  {
    name: "exercise_group",
    label: "Superset / circuit group (optional)",
    maxLength: 100,
    advanced: true,
  },
  {
    name: "coach_notes",
    label: "Exercise notes (optional)",
    type: "textarea",
    maxLength: 2000,
    advanced: true,
  },
];
export const prescriptionFields: Field[] = [
  {
    name: "reps_min",
    label: "Reps / minimum reps",
    type: "number",
    required: true,
    min: 1,
    max: 1000,
  },
  {
    name: "reps_max",
    label: "Maximum reps (optional)",
    type: "number",
    min: 1,
    max: 1000,
  },
  {
    name: "rir",
    label: "Target RIR",
    type: "number",
    required: true,
    min: 0,
    max: 10,
    defaultValue: "2",
  },
  {
    name: "rest_seconds",
    label: "Rest (seconds)",
    type: "number",
    required: true,
    min: 0,
    max: 3600,
    defaultValue: "120",
  },
];
export const createExerciseFields: Field[] = [
  exerciseFields[0],
  {
    name: "working_sets",
    label: "Working sets",
    type: "number",
    required: true,
    min: 1,
    max: 50,
    defaultValue: "3",
  },
  ...prescriptionFields,
  ...exerciseFields.slice(1),
];
export const setFields: Field[] = [
  {
    name: "set_type",
    label: "Set type",
    defaultValue: "working",
    options: setOptions,
  },
  ...prescriptionFields,
  {
    name: "side_override",
    label: "Side",
    options: [{ value: "", label: "Use exercise setting" }, ...sideOptions],
    advanced: true,
  },
  {
    name: "notes",
    label: "Set notes (optional)",
    type: "textarea",
    maxLength: 2000,
    advanced: true,
  },
];
