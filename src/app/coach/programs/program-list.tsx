"use client";

import Link from "next/link";
import { useState } from "react";
import { matchesTitle } from "@/lib/programs/model";
import { TemplateActionControl } from "./template-action-control";

export type ProgramCard = {
  id: string;
  name: string;
  goal: string;
  description: string;
  duration_weeks: number;
  sessions_per_week: number;
  status: string;
  template_version: number;
  template_revision: number;
};
export function ProgramList({ programs }: { programs: ProgramCard[] }) {
  const [query, setQuery] = useState("");
  const matches = programs.filter((program) =>
    matchesTitle(program.name, query),
  );
  return (
    <section className="mt-8">
      <label
        htmlFor="program-search"
        className="block text-sm font-medium text-muted"
      >
        Search program titles
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="program-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search programs…"
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-white/15 bg-panel px-4 text-base outline-none focus:border-hal-red-bright"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="min-h-12 rounded-lg border border-white/15 px-4 text-sm"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">All programs</h2>
        <p role="status" className="text-sm text-muted">
          {matches.length} {query.trim() ? `of ${programs.length}` : ""}
        </p>
      </div>
      {matches.length === 0 ? (
        <div className="hal-panel mt-5 rounded-xl p-6">
          <h3 className="text-lg font-semibold">
            {programs.length ? "No matching programmes" : "No programs yet"}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {programs.length
              ? "Try another title or clear the search."
              : "Create your first program to start building your training library."}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {matches.map((program) => (
            <article
              key={program.id}
              className="hal-panel relative min-w-0 rounded-xl border border-white/10 p-5 transition hover:border-hal-red/50 sm:p-6"
            >
              <Link
                href={`/coach/programs/${program.id}/builder`}
                aria-label={`Open workouts for ${program.name}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 after:absolute after:inset-0 after:rounded-xl"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {program.status}
                </p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight [overflow-wrap:anywhere] group-hover:text-hal-red-bright">
                  {program.name}
                </h3>
                {program.goal && (
                  <div className="mt-5">
                    <p className="text-xs text-muted">Goal</p>
                    <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                      {program.goal}
                    </p>
                  </div>
                )}
                {program.description && (
                  <div className="mt-4">
                    <p className="text-xs text-muted">Description</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">
                      {program.description}
                    </p>
                  </div>
                )}
                <dl className="mt-6 grid grid-cols-2 divide-x divide-white/10">
                  <div className="pr-4">
                    <dt className="text-xs text-muted">Duration</dt>
                    <dd className="mt-2 text-lg font-semibold">
                      {program.duration_weeks} weeks
                    </dd>
                  </div>
                  <div className="pl-4">
                    <dt className="text-xs text-muted">Frequency</dt>
                    <dd className="mt-2 text-lg font-semibold">
                      {program.sessions_per_week} per week
                    </dd>
                  </div>
                </dl>
              </Link>
              <div className="pointer-events-none relative z-10 mt-4 flex justify-end border-t border-white/10 pt-3">
                <div className="pointer-events-auto">
                  <TemplateActionControl
                    key={`${program.id}-${program.template_revision}`}
                    programId={program.id}
                    revision={program.template_revision}
                    operation="duplicate"
                    label={
                      program.template_version === 2
                        ? "Duplicate"
                        : "Create 4-week copy"
                    }
                    confirmation={
                      program.template_version === 2
                        ? undefined
                        : `Create a separate four-week draft from ${program.name}? Only Weeks 1–4 are included; missing weeks/workout blocks start empty. Later weeks remain in the original. Workout labels become numbers. Existing lb loads in the copy are converted to kg. Review the new copy before using it.`
                    }
                    confirmLabel="Create copy"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
