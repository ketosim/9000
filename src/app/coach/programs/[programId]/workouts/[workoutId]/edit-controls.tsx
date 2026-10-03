import { DeleteControl } from "./delete-control";
import { FormDialog } from "@/components/forms/form-dialog";
import { WorkoutForm } from "./workout-form";
import { exerciseFields, setFields } from "./exercise-fields";

export function EditWorkoutItem({
  mode,
  programId,
  workoutId,
  exerciseId,
  item,
  setCount = 0,
  revision,
}: {
  mode: "exercise" | "set";
  programId: string;
  workoutId: string;
  exerciseId?: string;
  item: { id: string };
  setCount?: number;
  revision: number;
}) {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(item))
    if (value === null) values[key] = "";
    else if (typeof value === "string" || typeof value === "number")
      values[key] = String(value);
  return (
    <FormDialog
      key={`${revision}-${item.id}`}
      title={mode === "exercise" ? "Edit exercise" : "Edit set"}
      trigger="Edit"
    >
      <WorkoutForm
        operation="update"
        mode={mode}
        programId={programId}
        workoutId={workoutId}
        revision={revision}
        exerciseId={exerciseId}
        itemId={item.id}
        initialValues={values}
        fields={mode === "exercise" ? exerciseFields : setFields}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-white/10 pt-2">
        <DeleteControl
          mode={mode}
          programId={programId}
          revision={revision}
          workoutId={workoutId}
          exerciseId={exerciseId}
          itemId={item.id}
          label={mode === "exercise" ? values.name : `set ${values.set_number}`}
          setCount={setCount}
        />
      </div>
    </FormDialog>
  );
}
