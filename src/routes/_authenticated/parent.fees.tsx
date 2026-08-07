import { createFileRoute } from "@tanstack/react-router";
import { useFeeRows, usePayments } from "@/lib/data";
import { useMyChildren } from "@/lib/parent";
import { inr, pendingOf, shortDate } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, EmptyState, TableWrap, FeeStatusBadge } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/parent/fees")({
  head: () => ({
    meta: [
      { title: "My Child's Fees — Rajnish Memorial Public School" },
      { name: "description", content: "Fee status, dues and payment receipts for your child." },
      { property: "og:title", content: "My Child's Fees — Rajnish Memorial Public School" },
      { property: "og:description", content: "Track paid and pending school fees." },
    ],
  }),
  component: ParentFees,
});

function ParentFees() {
  const children = useMyChildren();
  const fees = useFeeRows();
  const payments = usePayments();

  if (children.isLoading || fees.isLoading) return <LoadingRows rows={4} />;
  const kids = children.data ?? [];
  if (!kids.length) return <EmptyState title="No student linked" />;

  return (
    <>
      <PageHeader title="Fees" description="Your child's fee status and payment history." />
      {kids.map((child) => {
        const fee = (fees.data ?? []).find((f) => f.student_id === child.id);
        const pays = (payments.data ?? []).filter((p) => p.student_id === child.id);
        return (
          <div key={child.id} className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{child.full_name}</h2>
              {fee ? <FeeStatusBadge status={fee.status} /> : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Payable"
                value={fee ? inr(Number(fee.total_amount) - Number(fee.discount) + Number(fee.late_fee)) : "—"}
                tone="brand"
              />
              <StatCard label="Paid" value={fee ? inr(fee.paid_amount) : "—"} tone="success" />
              <StatCard label="Pending" value={fee ? inr(pendingOf(fee)) : "—"} tone="danger" />
            </div>
            {fee ? (
              <p className="mt-2 text-xs text-muted-foreground">Due date {shortDate(fee.due_date)}</p>
            ) : null}
            {pays.length ? (
              <TableWrap>
                <table className="mt-3 w-full min-w-[480px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Receipt</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pays.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-mono text-xs">{p.receipt_no}</td>
                        <td className="px-4 py-3">{shortDate(p.paid_on)}</td>
                        <td className="px-4 py-3">{p.method}</td>
                        <td className="px-4 py-3 text-right font-semibold text-success">{inr(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </div>
        );
      })}
    </>
  );
}
