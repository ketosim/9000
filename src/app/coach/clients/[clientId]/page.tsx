import Link from "next/link";
import { notFound } from "next/navigation";
import { createCoachAdminClient } from "@/lib/supabase/admin";
import { TrainingBlockForm } from "./training-block-form";
import { TrainingBlockEditForm } from "./training-block-edit-form";
import { MesocycleEditForm } from "./mesocycle-edit-form";
import {
  TemplateAssignmentForm,
  type AssignableTemplate,
} from "./template-assignment-form";
import { TemplateUnassignForm } from "./template-unassign-form";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

type AssignedTemplate = {
  id: string;
  source_program_id: string | null;
  template_name: string;
  duration_weeks: number;
  sessions_per_week: number;
  position: number;
};

type ClientMesocycle = {
  id: string;
  name: string;
  position: number;
  duration_weeks: number | null;
  status: "draft" | "active" | "archived";
  starts_on: string | null;
  assigned_training_templates: AssignedTemplate[];
};

type TrainingBlock = {
  id: string;
  name: string;
  description: string;
  position: number;
  status: "draft" | "active" | "archived";
  starts_on: string | null;
  client_mesocycles: ClientMesocycle[];
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(new Date(value));
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { clientId } = await params;

  if (!uuidPattern.test(clientId)) {
    notFound();
  }

  const admin = await createCoachAdminClient();

  const [clientResult, blocksResult, templatesResult] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, username, display_name, created_at")
        .eq("id", clientId)
        .eq("role", "client")
        .maybeSingle(),

      admin
        .from("training_blocks")
        .select(
          `
            id,
            name,
            description,
            position,
            status,
            starts_on,
            client_mesocycles (
              id,
              name,
              position,
              duration_weeks,
              status,
              starts_on,
              assigned_training_templates (
                id,
                source_program_id,
                template_name,
                duration_weeks,
                sessions_per_week,
                position
              )
            )
          `,
        )
        .eq("client_id", clientId)
        .eq("created_by", process.env.COACH_USER_ID!)
        .order("position", { ascending: true }),

      admin
        .from("programs")
        .select(
          "id, name, duration_weeks, sessions_per_week",
        )
        .eq("created_by", process.env.COACH_USER_ID!)
        .eq("status", "active")
        .order("name", { ascending: true }),
    ]);

  if (clientResult.error) {
    throw new Error(
      "Could not load this client. Please try again.",
    );
  }

  if (!clientResult.data) {
    notFound();
  }

  if (blocksResult.error) {
    throw new Error(
      "Could not load this client's training blocks. Please try again.",
    );
  }

  if (templatesResult.error) {
    throw new Error(
      "Could not load active training templates. Please try again.",
    );
  }

  const client = clientResult.data;

  const blocks = (blocksResult.data ?? []) as TrainingBlock[];

  const activeTemplates = (templatesResult.data ??
    []) as AssignableTemplate[];

  const name =
    client.display_name?.trim() ||
    client.username ||
    "Unnamed client";

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part.charAt(0))
    .join("")
    .toUpperCase();

  const joined = client.created_at
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Australia/Sydney",
      }).format(new Date(client.created_at))
    : "Not available";

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/coach/clients"
          className="inline-flex min-h-11 items-center rounded-lg text-sm text-muted transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          ← Back to clients
        </Link>

        <header className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            Client profile
          </p>

          <div className="mt-5 flex items-center gap-4 sm:gap-5">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xl font-semibold text-blue-800"
            >
              {initials}
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                {name}
              </h1>

              <p className="mt-2 break-words text-sm text-muted">
                {client.username
                  ? `@${client.username}`
                  : "Username not set"}
              </p>
            </div>
          </div>
        </header>

        <section
          className="mt-10"
          aria-labelledby="training-blocks-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="training-blocks-heading"
                className="text-2xl font-semibold"
              >
                Training blocks
              </h2>

              <p className="mt-2 text-sm text-muted">
                Organise this client&apos;s mesocycles and assigned
                training templates.
              </p>
            </div>

            <span className="text-sm text-muted">
              {blocks.length}{" "}
              {blocks.length === 1 ? "block" : "blocks"}
            </span>
          </div>

          <details className="hal-panel mt-5 rounded-2xl">
            <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl px-5 py-4 font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500 sm:px-6">
              Create training block

              <span aria-hidden="true" className="text-xl">
                +
              </span>
            </summary>

            <div className="border-t border-blue-100 px-5 pb-5 sm:px-6 sm:pb-6">
              <TrainingBlockForm clientId={clientId} />
            </div>
          </details>

          {blocks.length === 0 ? (
            <div className="hal-panel mt-5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold">
                No training blocks yet
              </h3>

              <p className="mt-2 text-sm text-muted">
                Create the first block to organise this client&apos;s
                mesocycles and assign training templates.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {blocks.map((block) => {
                const mesocycles = [
                  ...block.client_mesocycles,
                ].sort(
                  (first, second) =>
                    first.position - second.position,
                );

                return (
                  <article
                    key={block.id}
                    className="hal-panel overflow-hidden rounded-2xl"
                  >
                    <header className="border-b border-blue-100 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.15em] text-blue-700">
                            Block {block.position}
                          </p>

                          <h3 className="mt-2 break-words text-2xl font-semibold">
                            {block.name}
                          </h3>

                          {block.description && (
                            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-muted">
                              {block.description}
                            </p>
                          )}
                        </div>

                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs capitalize text-blue-800">
                          {block.status}
                        </span>
                      </div>

                      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted">
                            Starts
                          </dt>

                          <dd className="mt-1 font-medium">
                            {formatDate(block.starts_on)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-muted">
                            Mesocycles
                          </dt>

                          <dd className="mt-1 font-medium">
                            {mesocycles.length}
                          </dd>
                        </div>
                      </dl>

                      <TrainingBlockEditForm
                        clientId={clientId}
                        blockId={block.id}
                        initialName={block.name}
                        initialDescription={block.description}
                        initialStartsOn={block.starts_on}
                        initialMesocycleCount={mesocycles.length}
                        blockStatus={block.status}
                      />
                    </header>

                    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
                      {mesocycles.map((mesocycle) => {
                        const assignments = [
                          ...mesocycle.assigned_training_templates,
                        ].sort(
                          (first, second) =>
                            first.position - second.position,
                        );

                        const assignedProgramIds = new Set(
                          assignments.flatMap((assignment) =>
                            assignment.source_program_id
                              ? [assignment.source_program_id]
                              : [],
                          ),
                        );

                        const compatibleTemplates =
                          activeTemplates.filter(
                            (template) =>
                              !assignedProgramIds.has(template.id) &&
                              (mesocycle.duration_weeks === null ||
                                template.duration_weeks ===
                                  mesocycle.duration_weeks),
                          );

                        return (
                          <section
                            key={mesocycle.id}
                            className="min-w-0 rounded-xl border border-blue-100 bg-blue-50/60 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-700">
                                  Position {mesocycle.position}
                                </p>

                                <h4 className="mt-1 break-words font-semibold">
                                  {mesocycle.name}
                                </h4>
                              </div>

                              <span className="rounded-full bg-white px-2 py-1 text-[11px] capitalize text-muted">
                                {mesocycle.status}
                              </span>
                            </div>

                            <p className="mt-3 text-xs text-muted">
                              {mesocycle.duration_weeks
                                ? `${mesocycle.duration_weeks} weeks`
                                : "Duration set by first template"}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              Starts:{" "}
                              {formatDate(mesocycle.starts_on)}
                            </p>

                            <MesocycleEditForm
                              clientId={clientId}
                              mesocycleId={mesocycle.id}
                              initialName={mesocycle.name}
                              initialStartsOn={mesocycle.starts_on}
                              mesocycleStatus={mesocycle.status}
                            />

                            {assignments.length === 0 ? (
                              <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white/70 p-3">
                                <p className="text-sm text-muted">
                                  No templates assigned
                                </p>
                              </div>
                            ) : (
                              <ul className="mt-4 space-y-2">
                                {assignments.map((assignment) => (
                                  <li
                                    key={assignment.id}
                                    className="rounded-lg border border-blue-100 bg-white p-3"
                                  >
                                    <p className="break-words text-sm font-medium">
                                      {assignment.template_name}
                                    </p>

                                    <p className="mt-1 text-xs text-muted">
                                      {assignment.duration_weeks}{" "}
                                      weeks ·{" "}
                                      {
                                        assignment.sessions_per_week
                                      }{" "}
                                      {assignment.sessions_per_week ===
                                      1
                                        ? "workout"
                                        : "workouts"}{" "}
                                      per week
                                    </p>

                                    {mesocycle.status === "draft" && (
                                      <TemplateUnassignForm
                                        clientId={clientId}
                                        assignmentId={assignment.id}
                                        templateName={
                                          assignment.template_name
                                        }
                                        durationWeeks={
                                          assignment.duration_weeks
                                        }
                                      />
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {mesocycle.status === "draft" && (
                              <TemplateAssignmentForm
                                clientId={clientId}
                                mesocycleId={mesocycle.id}
                                durationWeeks={
                                  mesocycle.duration_weeks
                                }
                                templates={compatibleTemplates}
                              />
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="mt-10"
          aria-labelledby="account-heading"
        >
          <h2
            id="account-heading"
            className="text-2xl font-semibold"
          >
            Account details
          </h2>

          <dl className="hal-panel mt-5 grid overflow-hidden rounded-2xl sm:grid-cols-2">
            <div className="border-b border-blue-100 p-5 sm:border-r sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Display name
              </dt>

              <dd className="mt-2 break-words">
                {client.display_name?.trim() || "Not set"}
              </dd>
            </div>

            <div className="border-b border-blue-100 p-5 sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Username
              </dt>

              <dd className="mt-2 break-words">
                {client.username || "Not set"}
              </dd>
            </div>

            <div className="border-b border-blue-100 p-5 sm:border-b-0 sm:border-r sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Account type
              </dt>

              <dd className="mt-2">Client</dd>
            </div>

            <div className="p-5 sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Joined
              </dt>

              <dd className="mt-2">{joined}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}