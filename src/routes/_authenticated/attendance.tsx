import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, useStudents } from "@/lib/data";
import { classLabel } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, EmptyState, TableWrap } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Rajnish Memorial Public School" },
      { name: "description", content: "Mark and review daily class attendance." },
      { property: "og:title", content: "Attendance — Rajnish Memorial Public School" },
      { property: "og:description", content: "Daily attendance marking for teachers and admins." },
    ],
  }),
  component: AttendancePage,
});

type Status = "PRESENT" | "ABSENT" | "LATE";

function AttendancePage() {
  const classes = useClasses();
  const students = useStudents();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState("");
  const [busy, setBusy] = useState(false);

  const activeClass = classId || classes.data?.[0]?.id || "";

  const existing = useQuery({
    queryKey: ["attendance-day", activeClass, date],
    enabled: !!activeClass,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, status")
        .eq("class_id", activeClass)
        .eq("date", date);
      if (error) throw error;
      return data ?? [];
    },
  });

  const roster = useMemo(
    () => (students.data ?? []).filter((s) => s.class_id === activeClass && s.active),
    [students.data, activeClass],
  );

  const [draft, setDraft] = useState<Record<string, Status>>({});
  const statusOf = (id: string): Status =>
    draft[id] ?? ((existing.data?.find((a) => a.student_id === id)?.status as Status) || "PRESENT");

  if (classes.isLoading || students.isLoading) return <LoadingRows rows={5} />;
  if (classes.error) return <ErrorState message={(classes.error as Error).message} />;

  const save = async () => {
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    const rows = roster.map((s) => ({
      student_id: s.id,
      class_id: activeClass,
      date,
      status: statusOf(s.id),
      marked_by: userRes.user?.id ?? null,
    }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Attendance saved for ${roster.length} students`);
    setDraft({});
    void qc.invalidateQueries({ queryKey: ["attendance-day"] });
    void qc.invalidateQueries({ queryKey: ["attendance-today"] });
  };

  const counts = roster.reduce(
    (acc, s) => {
      acc[statusOf(s.id)] += 1;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0 } as Record<Status, number>,
  );

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance class by class."
        actions={
          <Button onClick={() => void save()} disabled={busy || !roster.length}>
            {busy ? "Saving…" : "Save attendance"}
          </Button>
        }
      />

      <div className="card-surface mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Class</label>
          <select
            className="h-9 rounded-md border bg-card px-3 text-sm"
            value={activeClass}
            onChange={(e) => {
              setClassId(e.target.value);
              setDraft({});
            }}
          >
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                Class {classLabel(c.grade, c.section)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Present" value={counts.PRESENT} tone="success" />
        <StatCard label="Absent" value={counts.ABSENT} tone="danger" />
        <StatCard label="Late" value={counts.LATE} tone="warning" />
      </div>

      <div className="mt-4">
        {roster.length ? (
          <TableWrap>
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-muted-foreground">{s.roll_no ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{s.full_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {(["PRESENT", "ABSENT", "LATE"] as Status[]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={statusOf(s.id) === st ? "default" : "outline"}
                            onClick={() => setDraft((d) => ({ ...d, [s.id]: st }))}
                          >
                            {st.charAt(0) + st.slice(1).toLowerCase()}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title="No students in this class" />
        )}
      </div>
    </>
  );
}
