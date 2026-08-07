import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "@/lib/parent";
import { shortDate } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/parent/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Rajnish Memorial Public School" },
      { name: "description", content: "Day-by-day attendance record for your child." },
      { property: "og:title", content: "Attendance — Rajnish Memorial Public School" },
      { property: "og:description", content: "Presence, absences and late marks." },
    ],
  }),
  component: ParentAttendance,
});

function ParentAttendance() {
  const children = useMyChildren();
  const ids = (children.data ?? []).map((c) => c.id);

  const att = useQuery({
    queryKey: ["parent-attendance", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, date, status, student_id")
        .in("student_id", ids)
        .order("date", { ascending: false })
        .limit(120);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (children.isLoading || att.isLoading) return <LoadingRows rows={4} />;
  const kids = children.data ?? [];
  if (!kids.length) return <EmptyState title="No student linked" />;

  return (
    <>
      <PageHeader title="Attendance" description="Attendance history for the last few weeks." />
      {kids.map((child) => {
        const rows = (att.data ?? []).filter((a) => a.student_id === child.id);
        const present = rows.filter((r) => r.status !== "ABSENT").length;
        const pct = rows.length ? Math.round((present / rows.length) * 100) : 0;
        return (
          <div key={child.id} className="mb-6">
            <h2 className="mb-3 font-semibold">{child.full_name}</h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Attendance" value={`${pct}%`} tone="success" />
              <StatCard label="Present" value={present} tone="brand" />
              <StatCard label="Absent" value={rows.length - present} tone="danger" />
            </div>
            <div className="card-surface mt-3 flex flex-wrap gap-2 p-4">
              {rows.map((r) => (
                <span
                  key={r.id}
                  title={`${shortDate(r.date)} · ${r.status}`}
                  className={
                    "flex h-9 w-14 items-center justify-center rounded-md text-[10px] font-semibold " +
                    (r.status === "PRESENT"
                      ? "bg-success/12 text-success"
                      : r.status === "LATE"
                        ? "bg-warning/20 text-warning-foreground"
                        : "bg-destructive/12 text-destructive")
                  }
                >
                  {new Date(r.date).getDate()}/{new Date(r.date).getMonth() + 1}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
