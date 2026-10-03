"use client";

export function BlockOptions({
  name,
  label,
  options,
  value,
  required = false,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  required?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm text-muted">{label}</legend>
      <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto p-1">
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={value === option.value}
              required={required}
              className="peer sr-only"
            />
            <span className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-white/15 bg-black px-4 py-3 text-sm text-muted peer-checked:border-hal-red peer-checked:bg-hal-red/10 peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-400 peer-disabled:cursor-wait">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
