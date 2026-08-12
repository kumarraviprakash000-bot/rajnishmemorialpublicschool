import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { inr, shortDate, SCHOOL_NAME } from "@/lib/format";
import { recordUpiPayment } from "@/lib/parent-pay.functions";

export const SCHOOL_UPI_ID = "vermamanoj975@ybl";
const PAYEE_NAME = "Rajnish Memorial Public School";

function upiQuery(amount: number, note: string) {
  const params = new URLSearchParams({
    pa: SCHOOL_UPI_ID,
    pn: PAYEE_NAME,
    cu: "INR",
    tn: note,
  });
  if (amount > 0) params.set("am", amount.toFixed(2));
  return params.toString();
}

export function upiPayLink(amount: number, note: string) {
  return `upi://pay?${upiQuery(amount, note)}`;
}

const APPS = [
  { key: "PhonePe", scheme: (q: string) => `phonepe://pay?${q}` },
  { key: "Google Pay", scheme: (q: string) => `tez://upi/pay?${q}` },
  { key: "Paytm", scheme: (q: string) => `paytmmp://pay?${q}` },
  { key: "Other UPI app", scheme: (q: string) => `upi://pay?${q}` },
];

type Receipt = {
  receipt_no: string;
  amount: number;
  method: string;
  paid_on: string;
  reference: string | null;
  studentName: string;
  admissionNo: string;
};

export function UpiPayDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  studentName: string;
  pending: number;
}) {
  const [amount, setAmount] = useState(pending > 0 ? String(pending) : "");
  const [launched, setLaunched] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const save = useServerFn(recordUpiPayment);
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setAmount(pending > 0 ? String(pending) : "");
      setLaunched(null);
      setReference("");
      setReceipt(null);
    }
  }, [open, pending]);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;

  const openApp = (app: (typeof APPS)[number]) => {
    if (!valid) return;
    const q = upiQuery(value, `School fee ${studentName}`);
    setLaunched(app.key);
    window.location.href = app.scheme(q);
  };

  const confirmPaid = async () => {
    setBusy(true);
    try {
      const res = await save({
        data: { studentId, amount: value, reference, app: launched ?? "UPI" },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setReceipt(res.receipt as Receipt);
      void qc.invalidateQueries({ queryKey: ["payments"] });
      void qc.invalidateQueries({ queryKey: ["student_fees"] });
      toast.success("Payment record ho gaya — receipt taiyar hai.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment save nahi ho paya.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {receipt ? (
          <>
            <DialogHeader>
              <DialogTitle>Fee receipt</DialogTitle>
              <DialogDescription>Payment successful — receipt niche hai.</DialogDescription>
            </DialogHeader>
            <div id="upi-receipt" className="rounded-xl border p-4 text-sm">
              <p className="text-center text-base font-bold">{SCHOOL_NAME}</p>
              <p className="mb-3 text-center text-xs text-muted-foreground">Official fee receipt</p>
              <dl className="space-y-1">
                {[
                  ["Receipt no.", receipt.receipt_no],
                  ["Date", shortDate(receipt.paid_on)],
                  ["Student", receipt.studentName],
                  ["Admission no.", receipt.admissionNo],
                  ["Method", receipt.method],
                  ["UPI ref.", receipt.reference || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t pt-2">
                  <dt className="font-semibold">Amount paid</dt>
                  <dd className="text-lg font-bold text-success">{inr(receipt.amount)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Computer-generated receipt — signature ki zaroorat nahi.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => window.print()}>
                <Printer className="size-4" /> Print receipt
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pending fee clear karein</DialogTitle>
              <DialogDescription>
                {studentName} · Pending {inr(pending)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground">School UPI ID</p>
                <p className="font-mono font-semibold">{SCHOOL_UPI_ID}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="upi-amount">Amount (₹)</Label>
                <Input
                  id="upi-amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={String(pending)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  App chunein — UPI ID aur amount apne aap bhar jayega.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {APPS.map((app) => (
                    <Button
                      key={app.key}
                      variant={launched === app.key ? "default" : "outline"}
                      disabled={!valid}
                      onClick={() => openApp(app)}
                    >
                      {app.key}
                    </Button>
                  ))}
                </div>
              </div>
              {launched ? (
                <div className="space-y-2 rounded-lg border border-dashed p-3">
                  <Label htmlFor="upi-ref">UPI transaction ID (optional)</Label>
                  <Input
                    id="upi-ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="12 digit UTR / transaction ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Payment complete hone ke baad neeche button dabayein — receipt turant mil jayegi.
                  </p>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={!valid || !launched || busy} onClick={() => void confirmPaid()}>
                {busy ? "Please wait…" : "Payment ho gaya — receipt lein"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
