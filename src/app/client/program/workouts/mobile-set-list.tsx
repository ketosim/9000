type PrescribedSet = {
  id: string;
  setNumber: number;
  setType: string;
  repsMin: number;
  repsMax: number;
  targetLoad: number | null;
  rir: number | null;
  restSeconds: number | null;
  sideOverride: string | null;
  notes: string;
};

type MobileSetListProps = {
  sets: PrescribedSet[];
  loadUnit: string;
};

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatReps(set: PrescribedSet) {
  if (set.repsMin === set.repsMax) {
    return String(set.repsMin);
  }

  return `${set.repsMin}–${set.repsMax}`;
}

function formatLoad(
  targetLoad: number | null,
  loadUnit: string,
) {
  if (targetLoad === null) {
    return "Not prescribed";
  }

  return `${targetLoad} ${loadUnit}`;
}

function formatRest(seconds: number | null) {
  if (seconds === null) {
    return "Not prescribed";
  }

  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds
    ? `${minutes} min ${remainingSeconds} sec`
    : `${minutes} min`;
}

export function MobileSetList({
  sets,
  loadUnit,
}: MobileSetListProps) {
  if (sets.length === 0) {
    return (
      <div className="border-t border-blue-100 p-4">
        <p className="text-sm text-muted">
          No sets have been prescribed.
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 border-t border-blue-100 bg-slate-50/50 p-3 sm:p-4"
      aria-label="Prescribed sets"
    >
      {sets.map((set) => (
        <article
          key={set.id}
          className="rounded-xl border border-blue-100 bg-white p-4"
        >
          <header className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">
              Set {set.setNumber}
            </h4>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
              {formatLabel(set.setType)}
            </span>
          </header>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3">
              <dt className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted">
                Reps
              </dt>
              <dd className="mt-1 break-words font-semibold tabular-nums">
                {formatReps(set)}
              </dd>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3">
              <dt className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted">
                Load
              </dt>
              <dd className="mt-1 break-words font-semibold tabular-nums">
                {set.targetLoad === null
                  ? "—"
                  : `${set.targetLoad} ${loadUnit}`}
              </dd>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3">
              <dt className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted">
                RIR
              </dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {set.rir ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-blue-100 px-3 py-2 text-sm">
            <span className="text-muted">Rest</span>
            <span className="font-medium tabular-nums">
              {formatRest(set.restSeconds)}
            </span>
          </div>

          {set.sideOverride && (
            <p className="mt-3 text-sm">
              <span className="text-muted">Side: </span>
              <span className="font-medium">
                {formatLabel(set.sideOverride)}
              </span>
            </p>
          )}

          {set.notes && (
            <p className="mt-3 whitespace-pre-line rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-blue-950">
              {set.notes}
            </p>
          )}

          {set.targetLoad === null && (
            <p className="sr-only">
              {formatLoad(set.targetLoad, loadUnit)}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}