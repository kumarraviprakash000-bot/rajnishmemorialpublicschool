import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePayments, useStudent, useFeeRows } from "@/lib/data";
import { classLabel, inr, pendingOf, shortDate } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, TableWrap, FeeStatusBadge, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Profile — Rajnish Memorial Public School" },
      { name: "description", content: "Student profile with fees, payments, attendance and results." },
      { property: "og:title", content: "Student Profile — Rajnish Memorial Public School" },
      { property: "og:description", content: "Complete academic and fee record for a student." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { studentId } = Route.useParams();
  const student = useStudent(studentId);
  const payments = usePayments(studentId);
  const fees = useFeeRows();

  const attendance = useQuery({
    queryKey: ["attendance", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const marks = useQuery({
    queryKey: ["marks", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("subject_name, marks_obtained, max_marks, grade, exams(name, published)")
        .eq("student_id", studentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (student.isLoading) return <LoadingRows rows={5} />;
  if (student.error) return <ErrorState message={(student.error as Error).message} />;
  if (!student.data) return <ErrorState message="Student not found." />;

  const s = student.data;
  const fee = (fees.data ?? []).find((f) => f.student_id === studentId);
  const att = attendance.data ?? [];
  const present = att.filter((a) => a.status !== "ABSENT").length;
  const pct = att.length ? Math.round((present / att.length) * 100) : 0;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/students">
          <ArrowLeft className="size-4" /> Back to students
        </Link>
      </Button>

      <PageHeader
        title={s.full_name}
        description={`Admission ${s.admission_no} · Class ${classLabel(s.classes?.grade, s.classes?.section)} · Roll ${s.roll_no ?? "—"}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
              {s.full_name.slice(0, 1)}
            </span>
            <div>
              <p className="font-semibold">{s.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {s.gender ?? "—"} · DOB {shortDate(s.dob)}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Guardian</dt>
                <dd className="font-medium">{s.guardian_name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium">{s.guardian_phone ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="font-medium break-all">{s.guardian_email ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="font-medium">{s.address ?? "—"}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              label="Fee Payable"
              value={fee ? inr(Number(fee.total_amount) - Number(fee.discount) + Number(fee.late_fee)) : "—"}
              tone="brand"
            />
            <StatCard label="Fee Paid" value={fee ? inr(fee.paid_amount) : "—"} tone="success" />
            <StatCard label="Pending" value={fee ? inr(pendingOf(fee)) : "—"} tone="danger" />
            <StatCard label="Attendance" value={`${pct}%`} hint={`${present}/${att.length} days present`} tone="success" />
          </div>
          {fee ? (
            <div className="card-surface mt-4 flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">Fee status for {fee.academic_year}</p>
                <p className="text-xs text-muted-foreground">Due {shortDate(fee.due_date)}</p>
              </div>
              <FeeStatusBadge status={fee.status} />
            </div>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="payments" className="mt-6">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          {payments.data?.length ? (
            <TableWrap>
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.data.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-mono text-xs">{p.receipt_no}</td>
                      <td className="px-4 py-3">{shortDate(p.paid_on)}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.note ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-success">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <EmptyState title="No payments recorded" />
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {att.length ? (
            <div className="card-surface flex flex-wrap gap-2 p-5">
              {att.map((a) => (
                <span
                  key={a.date}
                  title={`${shortDate(a.date)} · ${a.status}`}
                  className={
                    "flex h-9 w-14 items-center justify-center rounded-md text-[10px] font-semibold " +
                    (a.status === "PRESENT"
                      ? "bg-success/12 text-success"
                      : a.status === "LATE"
                        ? "bg-warning/20 text-warning-foreground"
                        : "bg-destructive/12 text-destructive")
                  }
                >
                  {new Date(a.date).getDate()}/{new Date(a.date).getMonth() + 1}
                </span>
              ))}
            </div>
          ) : (
            <EmptyState title="No attendance records" />
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {marks.data?.length ? (
            <TableWrap>
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Exam</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3 text-right">Marks</th>
                    <th className="px-4 py-3">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {marks.data.map((m, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">{(m.exams as { name: string } | null)?.name ?? "—"}</td>
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
          ) : (
            <EmptyState title="No results published" />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
