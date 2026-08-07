import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useCalendarEvents } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, ErrorState, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Academic Calendar — Rajnish Memorial Public School" },
      { name: "description", content: "Holidays, exams and events for the academic session." },
      { property: "og:title", content: "Academic Calendar — Rajnish Memorial Public School" },
      { property: "og:description", content: "Key dates for parents, students and staff." },
    ],
  }),
  component: CalendarPage,
});

const TYPE_STYLE: Record<string, string> = {
  HOLIDAY: "bg-destructive/12 text-destructive",
  EXAM: "bg-warning/20 text-warning-foreground",
  EVENT: "bg-primary-soft text-primary",
  MEETING: "bg-success/12 text-success",
};

function CalendarPage() {
  const events = useCalendarEvents();
  if (events.isLoading) return <LoadingRows rows={5} />;
  if (events.error) return <ErrorState message={(events.error as Error).message} />;

  const rows = events.data ?? [];
  const upcoming = rows.filter((e) => new Date(e.event_date) >= new Date(new Date().toDateString()));
  const past = rows.filter((e) => new Date(e.event_date) < new Date(new Date().toDateString()));

  const list = (items: typeof rows) => (
    <ul className="space-y-3">
      {items.map((e) => (
        <li key={e.id} className="card-surface flex items-start gap-4 p-4">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
            <span className="text-lg font-bold leading-none">{new Date(e.event_date).getDate()}</span>
            <span className="text-[10px] uppercase text-muted-foreground">
              {new Date(e.event_date).toLocaleDateString("en-IN", { month: "short" })}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{e.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLE[e.event_type] ?? "bg-muted"}`}>
                {e.event_type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {shortDate(e.event_date)}
              {e.end_date && e.end_date !== e.event_date ? ` – ${shortDate(e.end_date)}` : ""}
            </p>
            {e.description ? <p className="mt-1 text-sm text-muted-foreground">{e.description}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader title="Academic Calendar" description="Holidays, exams, meetings and school events." />
      {rows.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <CalendarDays className="size-4 text-primary" /> Upcoming
            </h2>
            {upcoming.length ? list(upcoming) : <EmptyState title="Nothing scheduled" />}
          </section>
          <section>
            <h2 className="mb-3 font-semibold text-muted-foreground">Earlier this session</h2>
            {past.length ? list(past) : <EmptyState title="No past events" />}
          </section>
        </div>
      ) : (
        <EmptyState title="No calendar events" />
      )}
    </>
  );
}
