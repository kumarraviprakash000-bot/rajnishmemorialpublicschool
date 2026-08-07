import { createFileRoute } from "@tanstack/react-router";
import { useCalendarEvents } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/parent/calendar")({
  head: () => ({
    meta: [
      { title: "School Calendar — Rajnish Memorial Public School" },
      { name: "description", content: "Holidays, exams and events for parents." },
      { property: "og:title", content: "School Calendar — Rajnish Memorial Public School" },
      { property: "og:description", content: "Important dates this session." },
    ],
  }),
  component: ParentCalendar,
});

function ParentCalendar() {
  const events = useCalendarEvents();
  if (events.isLoading) return <LoadingRows rows={4} />;
  const rows = events.data ?? [];
  if (!rows.length) return <EmptyState title="No events" />;

  return (
    <>
      <PageHeader title="Calendar" description="Holidays, exams and school events." />
      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className="card-surface flex items-start gap-4 p-4">
            <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
              <span className="text-lg font-bold leading-none">{new Date(e.event_date).getDate()}</span>
              <span className="text-[10px] uppercase text-muted-foreground">
                {new Date(e.event_date).toLocaleDateString("en-IN", { month: "short" })}
              </span>
            </div>
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground">{shortDate(e.event_date)} · {e.event_type}</p>
              {e.description ? <p className="mt-1 text-sm text-muted-foreground">{e.description}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
