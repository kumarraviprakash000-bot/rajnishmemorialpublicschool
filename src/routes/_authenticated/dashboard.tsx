import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Users, GraduationCap, IndianRupee, AlertCircle, CalendarCheck, Megaphone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeeRows, useNotices, usePayments, useTeachers } from "@/lib/data";
import { inr, pendingOf, shortDate, classLabel } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, FeeStatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Rajnish Memorial Public School" },
      { name: "description", content: "School-wide overview of fees, attendance, students and notices." },
      { property: "og:title", content: "Admin Dashboard — Rajnish Memorial Public School" },
      { property: "og:description", content: "Fees collected, pending dues, attendance and notices at a glance." },
    ],
  }),
  component: Dashboard,
});

function useTodayAttendance() {
  return useQuery({
    queryKey: ["attendance-today"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase.from("attendance").select("status").eq("date", today);
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.length,
        present: rows.filter((r) => r.status === "PRESENT").length,
        absent: rows.filter((r) => r.status === "ABSENT").length,
        late: rows.filter((r) => r.status === "LATE").length,
      };
    },
  });
}

function Dashboard() {
  const { role } = useAuth();
  const fees = useFeeRows();
  const payments = usePayments();
  const notices = useNotices();
  const teachers = useTeachers();
  const attendance = useTodayAttendance();

  if (role && role !== "admin") {
    return <ErrorState message="This dashboard is available to administrators only." />;
  }
  if (fees.isLoading || payments.isLoading) return <LoadingRows rows={6} />;
  if (fees.error) return <ErrorState message={(fees.error as Error).message} />;

  const rows = fees.data ?? [];
  const expected = rows.reduce((s, r) => s + Number(r.total_amount) - Number(r.discount) + Number(r.late_fee), 0);
  const collected = rows.reduce((s, r) => s + Number(r.paid_amount), 0);
  const pendingTotal = rows.reduce((s, r) => s + pendingOf(r), 0);
  const pendingStudents = rows.filter((r) => pendingOf(r) > 0).length;

  const monthly = new Map<string, number>();
  for (const p of payments.data ?? []) {
    const key = new Date(p.paid_on).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    monthly.set(key, (monthly.get(key) ?? 0) + Number(p.amount));
  }
  const monthlyData = [...monthly.entries()]
    .map(([month, amount]) => ({ month, amount }))
    .reverse();

  const byClass = new Map<string, number>();
  for (const r of rows) {
    const label = classLabel(r.students?.classes?.grade, r.students?.classes?.section);
    const p = pendingOf(r);
    if (p > 0) byClass.set(label, (byClass.get(label) ?? 0) + p);
  }
  const classData = [...byClass.entries()]
    .map(([name, pending]) => ({ name, pending }))
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 8);

  const att = attendance.data;
  const attData = att
    ? [
        { name: "Present", value: att.present, fill: "var(--success)" },
        { name: "Absent", value: att.absent, fill: "var(--destructive)" },
        { name: "Late", value: att.late, fill: "var(--warning)" },
      ].filter((d) => d.value > 0)
    : [];

  const recentNotices = (notices.data ?? []).slice(0, 5);
  const recentPayments = (payments.data ?? []).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Snapshot of fees, students, attendance and notices for the current session."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/notices">
                <Megaphone className="size-4" /> New notice
              </Link>
            </Button>
            <Button asChild>
              <Link to="/reminders">
                <Send className="size-4" /> Send fee reminders
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value={rows.length} icon={<Users className="size-4" />} tone="brand" />
        <StatCard
          label="Total Teachers"
          value={teachers.data?.length ?? "—"}
          icon={<GraduationCap className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Fee Collected"
          value={inr(collected)}
          hint={`of ${inr(expected)} expected`}
          icon={<IndianRupee className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Fee Pending"
          value={inr(pendingTotal)}
          hint={`${pendingStudents} students with dues`}
          icon={<AlertCircle className="size-4" />}
          tone="danger"
        />
        <StatCard
          label="Students With Pending Fees"
          value={pendingStudents}
          icon={<AlertCircle className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Today's Attendance"
          value={att ? (att.total ? `${Math.round((att.present / att.total) * 100)}%` : "—") : "…"}
          hint={att ? `${att.present} present · ${att.absent} absent · ${att.late} late` : undefined}
          icon={<CalendarCheck className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Active Notices"
          value={notices.data?.length ?? "—"}
          hint={`${(notices.data ?? []).filter((n) => n.is_important).length} marked important`}
          icon={<Megaphone className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Collection Rate"
          value={expected ? `${Math.round((collected / expected) * 100)}%` : "—"}
          icon={<IndianRupee className="size-4" />}
          tone="brand"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="mb-4 font-semibold">Monthly fee collection</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 font-semibold">Pending fees by class</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="pending" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 font-semibold">Today's attendance overview</h2>
          {attData.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {attData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Attendance has not been marked yet today.
            </p>
          )}
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
            <span>Present {att?.present ?? 0}</span>
            <span>Absent {att?.absent ?? 0}</span>
            <span>Late {att?.late ?? 0}</span>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent payments</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/payments">View all</Link>
            </Button>
          </div>
          <ul className="divide-y">
            {recentPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.students?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.receipt_no} · {shortDate(p.paid_on)}
                  </p>
                </div>
                <span className="font-semibold text-success">{inr(p.amount)}</span>
              </li>
            ))}
            {!recentPayments.length ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="card-surface mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent notices</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/notices">Notice board</Link>
          </Button>
        </div>
        <ul className="divide-y">
          {recentNotices.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3">
              {n.is_important ? (
                <span className="mt-0.5 rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-bold text-destructive">
                  IMPORTANT
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="truncate font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{shortDate(n.notice_date)}</p>
              </div>
            </li>
          ))}
          {!recentNotices.length ? (
            <li className="py-6 text-center text-sm text-muted-foreground">No notices published yet.</li>
          ) : null}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {rows
          .filter((r) => pendingOf(r) > 0)
          .slice(0, 3)
          .map((r) => (
            <div key={r.id} className="card-surface flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.students?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Class {classLabel(r.students?.classes?.grade, r.students?.classes?.section)} ·{" "}
                  {inr(pendingOf(r))} due
                </p>
              </div>
              <FeeStatusBadge status={r.status} />
            </div>
          ))}
      </div>
    </>
  );
}
