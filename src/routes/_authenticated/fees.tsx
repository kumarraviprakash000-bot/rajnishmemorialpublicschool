import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, IndianRupee, Search, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, useFeeRows, type FeeRow } from "@/lib/data";
import { classLabel, downloadCsv, inr, pendingOf, shortDate } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, FeeStatusBadge, TableWrap, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { FeeStructures } from "@/components/fee-structures";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => ({
    meta: [
      { title: "Fee Management — Rajnish Memorial Public School" },
      { name: "description", content: "Track expected, collected and pending school fees and record payments." },
      { property: "og:title", content: "Fee Management — Rajnish Memorial Public School" },
      { property: "og:description", content: "Fee structures, student dues, payments and receipts." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  const { role } = useAuth();
  const fees = useFeeRows();
  const classes = useClasses();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [target, setTarget] = useState<FeeRow | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (fees.data ?? [])
      .filter((r) => {
        const s = r.students;
        if (!s) return false;
        if (q && !`${s.full_name} ${s.admission_no} ${s.guardian_name}`.toLowerCase().includes(q)) return false;
        if (classFilter !== "all" && classLabel(s.classes?.grade, s.classes?.section) !== classFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => (a.students?.admission_no ?? "").localeCompare(b.students?.admission_no ?? ""));
  }, [fees.data, search, classFilter, statusFilter]);

  if (role && role !== "admin") return <ErrorState message="Fee management is available to administrators only." />;
  if (fees.isLoading) return <LoadingRows rows={6} />;
  if (fees.error) return <ErrorState message={(fees.error as Error).message} />;

  const all = fees.data ?? [];
  const expected = all.reduce((s, r) => s + Number(r.total_amount) - Number(r.discount) + Number(r.late_fee), 0);
  const collected = all.reduce((s, r) => s + Number(r.paid_amount), 0);
  const pendingTotal = all.reduce((s, r) => s + pendingOf(r), 0);
  const pendingCount = all.filter((r) => pendingOf(r) > 0).length;

  const exportCsv = () => {
    downloadCsv(
      "fee-statement.csv",
      rows.map((r) => ({
        Admission: r.students?.admission_no,
        Student: r.students?.full_name,
        Class: classLabel(r.students?.classes?.grade, r.students?.classes?.section),
        Guardian: r.students?.guardian_name,
        Total: Number(r.total_amount),
        Discount: Number(r.discount),
        LateFee: Number(r.late_fee),
        Paid: Number(r.paid_amount),
        Pending: pendingOf(r),
        DueDate: r.due_date,
        Status: r.status,
      })),
    );
  };

  return (
    <>
      <PageHeader
        title="Fee Management"
        description="Fee structures, student dues, collections and receipts for session 2026-27."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Fee Expected" value={inr(expected)} icon={<Wallet className="size-4" />} tone="brand" />
        <StatCard label="Total Collected" value={inr(collected)} icon={<IndianRupee className="size-4" />} tone="success" />
        <StatCard label="Total Pending" value={inr(pendingTotal)} icon={<IndianRupee className="size-4" />} tone="danger" />
        <StatCard label="Students With Dues" value={pendingCount} tone="warning" />
      </div>

      <Tabs defaultValue="students" className="mt-6">
        <TabsList>
          <TabsTrigger value="students">Student fees</TabsTrigger>
          <TabsTrigger value="structures">Fee structures</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by student, admission no. or guardian"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border bg-card px-3 text-sm"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All classes</option>
              {(classes.data ?? []).map((c) => (
                <option key={c.id} value={classLabel(c.grade, c.section)}>
                  Class {classLabel(c.grade, c.section)}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-card px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="DUE">Due</option>
            </select>
          </div>

          {rows.length ? (
            <TableWrap>
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                    <th className="px-4 py-3">Due date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.students?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.students?.admission_no}</p>
                      </td>
                      <td className="px-4 py-3">{classLabel(r.students?.classes?.grade, r.students?.classes?.section)}</td>
                      <td className="px-4 py-3 text-right">{inr(Number(r.total_amount) - Number(r.discount) + Number(r.late_fee))}</td>
                      <td className="px-4 py-3 text-right text-success">{inr(r.paid_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{inr(pendingOf(r))}</td>
                      <td className="px-4 py-3">{shortDate(r.due_date)}</td>
                      <td className="px-4 py-3"><FeeStatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setTarget(r)}>
                          Record payment
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <EmptyState title="No matching fee records" description="Try changing the search or filters." />
          )}
        </TabsContent>

        <TabsContent value="structures" className="mt-4">
          <FeeStructures />
        </TabsContent>
      </Tabs>

      <RecordPaymentDialog
        row={target}
        onClose={() => setTarget(null)}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ["student_fees"] });
          void qc.invalidateQueries({ queryKey: ["payments"] });
        }}
      />
    </>
  );
}

export function RecordPaymentDialog({
  row,
  onClose,
  onSaved,
}: {
  row: FeeRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const due = row ? pendingOf(row) : 0;

  const submit = async () => {
    if (!row) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a payment amount greater than zero.");
      return;
    }
    if (value > due) {
      toast.error(`Amount cannot exceed the pending balance of ${inr(due)}.`);
      return;
    }
    setBusy(true);
    const { data: receipt, error: rpcError } = await supabase.rpc("next_receipt_no");
    if (rpcError || !receipt) {
      setBusy(false);
      toast.error(rpcError?.message ?? "Could not generate a receipt number.");
      return;
    }
    const { error } = await supabase.from("payments").insert({
      student_fee_id: row.id,
      student_id: row.student_id,
      receipt_no: receipt as unknown as string,
      amount: value,
      method,
      note: note.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payment recorded · Receipt ${receipt}`);
    setAmount("");
    setNote("");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {row?.students?.full_name} · Pending {inr(due)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              max={due}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(due)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Payment method</Label>
            <select
              id="method"
              className="h-9 w-full rounded-md border bg-card px-3 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Instalment 2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : "Save payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
