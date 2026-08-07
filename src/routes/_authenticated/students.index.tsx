import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, useFeeRows, useStudents } from "@/lib/data";
import { classLabel, inr, pendingOf } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, TableWrap, EmptyState, FeeStatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/students/")({
  head: () => ({
    meta: [
      { title: "Students — Rajnish Memorial Public School" },
      { name: "description", content: "Search, filter and manage student records by class and section." },
      { property: "og:title", content: "Students — Rajnish Memorial Public School" },
      { property: "og:description", content: "Student directory with fee status and guardian details." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { role } = useAuth();
  const students = useStudents();
  const classes = useClasses();
  const fees = useFeeRows();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const feeByStudent = useMemo(() => {
    const map = new Map<string, { pending: number; status: "PAID" | "PARTIALLY_PAID" | "DUE" }>();
    for (const f of fees.data ?? []) map.set(f.student_id, { pending: pendingOf(f), status: f.status });
    return map;
  }, [fees.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students.data ?? []).filter((s) => {
      if (q && !`${s.full_name} ${s.admission_no} ${s.guardian_name}`.toLowerCase().includes(q)) return false;
      if (classFilter !== "all" && s.class_id !== classFilter) return false;
      return true;
    });
  }, [students.data, search, classFilter]);

  if (students.isLoading) return <LoadingRows rows={6} />;
  if (students.error) return <ErrorState message={(students.error as Error).message} />;

  const activeCount = (students.data ?? []).filter((s) => s.active).length;

  return (
    <>
      <PageHeader
        title="Students"
        description="Complete student directory with class, guardian and fee status."
        actions={
          role === "admin" ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Add student
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value={students.data?.length ?? 0} icon={<Users className="size-4" />} tone="brand" />
        <StatCard label="Active" value={activeCount} tone="success" />
        <StatCard label="Classes" value={classes.data?.length ?? 0} tone="brand" />
        <StatCard
          label="With Pending Fees"
          value={(fees.data ?? []).filter((f) => pendingOf(f) > 0).length}
          tone="warning"
        />
      </div>

      <div className="my-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search students, admission no. or guardian"
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
            <option key={c.id} value={c.id}>
              Class {classLabel(c.grade, c.section)}
            </option>
          ))}
        </select>
      </div>

      {rows.length ? (
        <TableWrap>
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Admission</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Guardian</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3">Fee status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((s) => {
                const fee = feeByStudent.get(s.id);
                return (
                  <tr key={s.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{s.admission_no}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: s.id }}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {s.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">Roll {s.roll_no ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">{classLabel(s.classes?.grade, s.classes?.section)}</td>
                    <td className="px-4 py-3">{s.guardian_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.guardian_phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fee ? inr(fee.pending) : "—"}</td>
                    <td className="px-4 py-3">{fee ? <FeeStatusBadge status={fee.status} /> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState title="No students found" description="Adjust your search or class filter." />
      )}

      <AddStudentDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ["students"] });
          void qc.invalidateQueries({ queryKey: ["student_fees"] });
        }}
      />
    </>
  );
}

function AddStudentDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const classes = useClasses();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    admission_no: "",
    class_id: "",
    roll_no: "",
    dob: "",
    gender: "Male",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    address: "",
  });

  const save = async () => {
    if (!form.full_name.trim() || !form.admission_no.trim() || !form.guardian_name.trim()) {
      toast.error("Student name, admission number and guardian name are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("students").insert({
      full_name: form.full_name.trim(),
      admission_no: form.admission_no.trim(),
      class_id: form.class_id || null,
      roll_no: form.roll_no ? Number(form.roll_no) : null,
      dob: form.dob || null,
      gender: form.gender,
      guardian_name: form.guardian_name.trim(),
      guardian_phone: form.guardian_phone.trim() || null,
      guardian_email: form.guardian_email.trim() || null,
      address: form.address.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Student added");
    onOpenChange(false);
    onSaved();
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>Create a new admission record.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("full_name", "Full name")}
          {field("admission_no", "Admission number")}
          <div className="space-y-2">
            <Label htmlFor="class_id">Class</Label>
            <select
              id="class_id"
              className="h-9 w-full rounded-md border bg-card px-3 text-sm"
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            >
              <option value="">Unassigned</option>
              {(classes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  Class {classLabel(c.grade, c.section)}
                </option>
              ))}
            </select>
          </div>
          {field("roll_no", "Roll number", "number")}
          {field("dob", "Date of birth", "date")}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className="h-9 w-full rounded-md border bg-card px-3 text-sm"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          {field("guardian_name", "Guardian name")}
          {field("guardian_phone", "Guardian phone")}
          {field("guardian_email", "Guardian email", "email")}
          {field("address", "Address")}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
