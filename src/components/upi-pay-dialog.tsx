import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { inr } from "@/lib/format";

export const SCHOOL_UPI_ID = "vermamanoj975@ybl";
const PAYEE_NAME = "Rajnish Memorial Public School";

export function upiPayLink(amount: number, note: string) {
  const params = new URLSearchParams({
    pa: SCHOOL_UPI_ID,
    pn: PAYEE_NAME,
    cu: "INR",
    tn: note,
  });
  if (amount > 0) params.set("am", amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export function UpiPayDialog({
  open,
  onOpenChange,
  studentName,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentName: string;
  pending: number;
}) {
  const [amount, setAmount] = useState(pending > 0 ? String(pending) : "");

  useEffect(() => {
    if (open) setAmount(pending > 0 ? String(pending) : "");
  }, [open, pending]);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
            <p className="text-xs text-muted-foreground">
              Amount daal ke "Pay with UPI" dabayein — aapka UPI app khul jayega, school ki UPI ID pehle se bhari hogi.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button asChild disabled={!valid}>
            <a
              href={valid ? upiPayLink(value, `School fee ${studentName}`) : undefined}
              aria-disabled={!valid}
            >
              Pay with UPI
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
