import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { classLabel, shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, ErrorState, EmptyState, TableWrap } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "Exams & Results — Rajnish Memorial Public School" },
      { name: "description", content: "Exam schedule and published results by class." },
      { property: "og:title", content: "Exams & Results — Rajnish Memorial Public School" },
      { property: "og:description", content: "Exam dates and subject-wise marks." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const exams = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*, classes(grade, section)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const marks = useQuery({
    queryKey: ["marks-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("subject_name, marks_obtained, max_marks, grade, students(full_name, classes(grade, section)), exams(name)")
        .limit(120);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (exams.isLoading) return <LoadingRows rows={5} />;
  if (exams.error) return <ErrorState message={(exams.error as Error).message} />;

  return (
    <>
      <PageHeader title="Exams & Results" description="Exam schedule and published subject-wise marks." />

      {exams.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.data.map((e) => {
            const c = e.classes as { grade: string; section: string } | null;
            return (
              <div key={e.id} className="card-surface p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Award className="size-4" />
                  </span>
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">Class {classLabel(c?.grade, c?.section)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {shortDate(e.start_date)} – {shortDate(e.end_date)}
                </p>
                <span
                  className={
                    "mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold " +
                    (e.published ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")
                  }
                >
                  {e.published ? "Results published" : "Results pending"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No exams scheduled" />
      )}

      <h2 className="mb-3 mt-6 font-semibold">Recent marks</h2>
      {marks.data?.length ? (
        <TableWrap>
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-right">Marks</th>
                <th className="px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {marks.data.map((m, i) => {
                const s = m.students as { full_name: string; classes: { grade: string; section: string } | null } | null;
                return (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium">{s?.full_name}</td>
                    <td className="px-4 py-3">{classLabel(s?.classes?.grade, s?.classes?.section)}</td>
                    <td className="px-4 py-3">{(m.exams as { name: string } | null)?.name}</td>
                    <td className="px-4 py-3">{m.subject_name}</td>
                    <td className="px-4 py-3 text-right">
                      {Number(m.marks_obtained)} / {Number(m.max_marks)}
                    </td>
                    <td className="px-4 py-3 font-semibold">{m.grade ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState title="No marks entered yet" />
      )}
    </>
  );
}
