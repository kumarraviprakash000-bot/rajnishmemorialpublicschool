import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import { usePayments } from "@/lib/data";
import { classLabel, downloadCsv, inr, shortDate, SCHOOL_NAME } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, TableWrap, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentRow } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Receipts — Rajnish Memorial Public School" },
      { name: "description", content: "All recorded fee payments with printable receipts." },
      { property: "og:title", content: "Payments & Receipts — Rajnish Memorial Public School" },
      { property: "og:description", content: "Search payments and print receipts for parents." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const payments = usePayments();
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState<PaymentRow | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (payments.data ?? []).filter(
      (p) => !q || `${p.students?.full_name} ${p.receipt_no} ${p.method}`.toLowerCase().includes(q),
    );
  }, [payments.data, search]);

  if (payments.isLoading) return <LoadingRows rows={6} />;
  if (payments.error) return <ErrorState message={(payments.error as Error).message} />;

  const total = rows.reduce((s, p) => s + Number(p.amount), 0);
  const thisMonth = rows
    .filter((p) => new Date(p.paid_on).getMonth() === new Date().getMonth())
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <PageHeader
        title="Payments & Receipts"
        description="Every fee payment recorded, with printable receipts."
        actions={
          <Button
            variant="outline"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                "payments.csv",
                rows.map((p) => ({
                  Receipt: p.receipt_no,
                  Date: p.paid_on,
                  Student: p.students?.full_name,
                  Class: classLabel(p.students?.classes?.grade, p.students?.classes?.section),
                  Method: p.method,
                  Amount: Number(p.amount),
                })),
              )
            }
          >
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Payments" value={rows.length} tone="brand" />
        <StatCard label="Total Collected" value={inr(total)} tone="success" />
        <StatCard label="This Month" value={inr(thisMonth)} tone="brand" />
        <StatCard
          label="Average Payment"
          value={rows.length ? inr(Math.round(total / rows.length)) : "—"}
          tone="default"
        />
      </div>

      <div className="relative my-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by student, receipt number or method"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs">{p.receipt_no}</td>
                  <td className="px-4 py-3">{shortDate(p.paid_on)}</td>
                  <td className="px-4 py-3 font-medium">{p.students?.full_name}</td>
                  <td className="px-4 py-3">{classLabel(p.students?.classes?.grade, p.students?.classes?.section)}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-success">{inr(p.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setReceipt(p)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState title="No payments found" description="Record a payment from the Fees page." />
      )}

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fee receipt</DialogTitle>
          </DialogHeader>
          {receipt ? (
            <div className="rounded-lg border p-5">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{SCHOOL_NAME}</p>
                <p className="text-xs text-muted-foreground">Official fee receipt</p>
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                {[
                  ["Receipt no.", receipt.receipt_no],
                  ["Date", shortDate(receipt.paid_on)],
                  ["Student", receipt.students?.full_name ?? "—"],
                  ["Admission no.", receipt.students?.admission_no ?? "—"],
                  ["Class", classLabel(receipt.students?.classes?.grade, receipt.students?.classes?.section)],
                  ["Method", receipt.method],
                  ["Note", receipt.note ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-dashed py-1.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 pt-2">
                  <dt className="font-semibold">Amount paid</dt>
                  <dd className="text-lg font-bold text-success">{inr(receipt.amount)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                This is a computer-generated receipt and does not require a signature.
              </p>
              <Button className="mt-4 w-full" onClick={() => window.print()}>
                <Printer className="size-4" /> Print receipt
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
