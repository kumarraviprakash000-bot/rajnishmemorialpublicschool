import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "@/lib/parent";
import { PageHeader, LoadingRows, EmptyState, TableWrap } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/parent/results")({
  head: () => ({
    meta: [
      { title: "Results — Rajnish Memorial Public School" },
      { name: "description", content: "Published exam results for your child." },
      { property: "og:title", content: "Results — Rajnish Memorial Public School" },
      { property: "og:description", content: "Subject-wise marks and grades." },
    ],
  }),
  component: ParentResults,
});

function ParentResults() {
  const children = useMyChildren();
  const ids = (children.data ?? []).map((c) => c.id);

  const marks = useQuery({
    queryKey: ["parent-marks", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("id, subject_name, marks_obtained, max_marks, grade, student_id, exams(name, published)")
        .in("student_id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (children.isLoading || marks.isLoading) return <LoadingRows rows={4} />;
  const rows = (marks.data ?? []).filter((m) => (m.exams as { published: boolean } | null)?.published);
  if (!rows.length) return <EmptyState title="No results published yet" />;

  return (
    <>
      <PageHeader title="Results" description="Subject-wise marks from published exams." />
      <TableWrap>
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3 text-right">Marks</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">{(m.exams as { name: string } | null)?.name}</td>
                <td className="px-4 py-3">{m.subject_name}</td>
                <td className="px-4 py-3 text-right">
                  {Number(m.marks_obtained)} / {Number(m.max_marks)}
                </td>
                <td className="px-4 py-3 font-semibold">{m.grade ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
