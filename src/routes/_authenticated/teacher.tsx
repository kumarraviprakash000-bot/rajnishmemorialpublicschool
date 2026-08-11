import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, BookOpen, Users, Megaphone } from "lucide-react";
import { useClasses, useNotices, useStudents } from "@/lib/data";
import { classLabel, shortDate } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { MyPhoneCard } from "@/components/my-phone-card";

export const Route = createFileRoute("/_authenticated/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — Rajnish Memorial Public School" },
      { name: "description", content: "Class roster, attendance and homework shortcuts for teachers." },
      { property: "og:title", content: "Teacher Dashboard — Rajnish Memorial Public School" },
      { property: "og:description", content: "Everything a teacher needs for the day." },
    ],
  }),
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const { fullName } = useAuth();
  const students = useStudents();
  const classes = useClasses();
  const notices = useNotices();

  if (students.isLoading) return <LoadingRows rows={5} />;

  return (
    <>
      <PageHeader
        title={`Welcome${fullName ? `, ${fullName}` : ""}`}
        description="Your classes, students and quick actions for today."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/homework">
                <BookOpen className="size-4" /> Assign homework
              </Link>
            </Button>
            <Button asChild>
              <Link to="/attendance">
                <CalendarCheck className="size-4" /> Mark attendance
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Students Visible" value={students.data?.length ?? 0} icon={<Users className="size-4" />} tone="brand" />
        <StatCard label="Classes" value={classes.data?.length ?? 0} tone="brand" />
        <StatCard label="Notices" value={notices.data?.length ?? 0} icon={<Megaphone className="size-4" />} tone="brand" />
        <StatCard label="Today" value={shortDate(new Date().toISOString())} tone="default" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MyPhoneCard />
        <div className="card-surface p-5">
          <h2 className="mb-3 font-semibold">Your classes</h2>
          <ul className="divide-y">
            {(classes.data ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium">Class {classLabel(c.grade, c.section)}</span>
                <span className="text-muted-foreground">
                  {(students.data ?? []).filter((s) => s.class_id === c.id).length} students
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-surface p-5">
          <h2 className="mb-3 font-semibold">Latest notices</h2>
          <ul className="divide-y">
            {(notices.data ?? []).slice(0, 6).map((n) => (
              <li key={n.id} className="py-2.5">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{shortDate(n.notice_date)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
