import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { useFeeRows, useStudents } from "@/lib/data";
import { classLabel, downloadCsv, inr, pendingOf } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, TableWrap } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Rajnish Memorial Public School" },
      { name: "description", content: "Class-wise fee collection and defaulter reports with CSV export." },
      { property: "og:title", content: "Reports — Rajnish Memorial Public School" },
      { property: "og:description", content: "Collection performance and outstanding dues by class." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const fees = useFeeRows();
  const students = useStudents();

  if (fees.isLoading) return <LoadingRows rows={5} />;
  if (fees.error) return <ErrorState message={(fees.error as Error).message} />;

  const rows = fees.data ?? [];
  const byClass = new Map<string, { collected: number; pending: number; students: number }>();
  for (const r of rows) {
    const key = classLabel(r.students?.classes?.grade, r.students?.classes?.section);
    const cur = byClass.get(key) ?? { collected: 0, pending: 0, students: 0 };
    cur.collected += Number(r.paid_amount);
    cur.pending += pendingOf(r);
    cur.students += 1;
    byClass.set(key, cur);
  }
  const data = [...byClass.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const defaulters = rows
    .filter((r) => pendingOf(r) > 0)
    .sort((a, b) => pendingOf(b) - pendingOf(a))
    .slice(0, 15);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Fee collection performance and top outstanding balances."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "class-fee-report.csv",
                data.map((d) => ({ Class: d.name, Students: d.students, Collected: d.collected, Pending: d.pending })),
              )
            }
          >
            <Download className="size-4" /> Export report
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={students.data?.length ?? 0} tone="brand" />
        <StatCard label="Collected" value={inr(data.reduce((s, d) => s + d.collected, 0))} tone="success" />
        <StatCard label="Pending" value={inr(data.reduce((s, d) => s + d.pending, 0))} tone="danger" />
        <StatCard label="Defaulters" value={rows.filter((r) => pendingOf(r) > 0).length} tone="warning" />
      </div>

      <div className="card-surface mt-6 p-5">
        <h2 className="mb-4 font-semibold">Collected vs pending by class</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Bar dataKey="collected" name="Collected" fill="var(--success)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="mb-3 mt-6 font-semibold">Top outstanding balances</h2>
      <TableWrap>
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3 text-right">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {defaulters.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.students?.full_name}</td>
                <td className="px-4 py-3">{classLabel(r.students?.classes?.grade, r.students?.classes?.section)}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.students?.guardian_name}</td>
                <td className="px-4 py-3 text-right font-semibold text-destructive">{inr(pendingOf(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
