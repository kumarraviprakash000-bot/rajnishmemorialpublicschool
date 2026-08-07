import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { classLabel, inr, shortDate } from "@/lib/format";
import { LoadingRows, ErrorState, TableWrap } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Structure = {
  id: string;
  class_id: string;
  academic_year: string;
  tuition_fee: number;
  annual_fee: number;
  transport_fee: number;
  other_fee: number;
  due_date: string;
  late_fee_per_month: number;
  classes: { grade: string; section: string } | null;
};

const FIELDS = [
  { key: "tuition_fee", label: "Tuition fee" },
  { key: "annual_fee", label: "Annual fee" },
  { key: "transport_fee", label: "Transport fee" },
  { key: "other_fee", label: "Other fee" },
  { key: "late_fee_per_month", label: "Late fee / month" },
] as const;

export function FeeStructures() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Structure | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["fee_structures"],
    queryFn: async (): Promise<Structure[]> => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*, classes(grade, section)");
      if (error) throw error;
      return ((data ?? []) as unknown as Structure[]).sort(
        (a, b) =>
          Number(a.classes?.grade ?? 0) - Number(b.classes?.grade ?? 0) ||
          (a.classes?.section ?? "").localeCompare(b.classes?.section ?? ""),
      );
    },
  });

  const open = (s: Structure) => {
    setEditing(s);
    setForm({
      tuition_fee: String(s.tuition_fee),
      annual_fee: String(s.annual_fee),
      transport_fee: String(s.transport_fee),
      other_fee: String(s.other_fee),
      late_fee_per_month: String(s.late_fee_per_month),
      due_date: s.due_date,
    });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase
      .from("fee_structures")
      .update({
        tuition_fee: Number((form["tuition_fee"] ?? "") || 0),
        annual_fee: Number((form["annual_fee"] ?? "") || 0),
        transport_fee: Number((form["transport_fee"] ?? "") || 0),
        other_fee: Number((form["other_fee"] ?? "") || 0),
        late_fee_per_month: Number((form["late_fee_per_month"] ?? "") || 0),
        due_date: form["due_date"] ?? new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fee structure updated. New dues apply to future fee records.");
    setEditing(null);
    void qc.invalidateQueries({ queryKey: ["fee_structures"] });
  };

  if (q.isLoading) return <LoadingRows rows={4} />;
  if (q.error) return <ErrorState message={(q.error as Error).message} />;

  return (
    <>
      <TableWrap>
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3 text-right">Tuition</th>
              <th className="px-4 py-3 text-right">Annual</th>
              <th className="px-4 py-3 text-right">Transport</th>
              <th className="px-4 py-3 text-right">Other</th>
              <th className="px-4 py-3 text-right">Total / year</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(q.data ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">
                  Class {classLabel(s.classes?.grade, s.classes?.section)}
                </td>
                <td className="px-4 py-3 text-right">{inr(s.tuition_fee)}</td>
                <td className="px-4 py-3 text-right">{inr(s.annual_fee)}</td>
                <td className="px-4 py-3 text-right">{inr(s.transport_fee)}</td>
                <td className="px-4 py-3 text-right">{inr(s.other_fee)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {inr(Number(s.tuition_fee) + Number(s.annual_fee) + Number(s.transport_fee) + Number(s.other_fee))}
                </td>
                <td className="px-4 py-3">{shortDate(s.due_date)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => open(s)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Fee structure · Class {classLabel(editing?.classes?.grade, editing?.classes?.section)}
            </DialogTitle>
            <DialogDescription>Amounts are for the full academic year.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label} (₹)</Label>
                <Input
                  id={f.key}
                  type="number"
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input
                id="due_date"
                type="date"
                value={(form["due_date"] ?? "") ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
