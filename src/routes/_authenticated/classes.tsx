import { createFileRoute } from "@tanstack/react-router";
import { School } from "lucide-react";
import { useClasses, useFeeRows, useStudents, useTeachers } from "@/lib/data";
import { classLabel, inr, pendingOf } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({
    meta: [
      { title: "Classes — Rajnish Memorial Public School" },
      { name: "description", content: "Class-wise strength, class teachers and pending fee totals." },
      { property: "og:title", content: "Classes — Rajnish Memorial Public School" },
      { property: "og:description", content: "Sections, strength and fee position for every class." },
    ],
  }),
  component: ClassesPage,
});

type TeacherRow = { full_name: string; class_teachers: { class_id: string; is_class_teacher?: boolean }[] };

function ClassesPage() {
  const classes = useClasses();
  const students = useStudents();
  const fees = useFeeRows();
  const teachers = useTeachers();

  if (classes.isLoading || students.isLoading) return <LoadingRows rows={5} />;
  if (classes.error) return <ErrorState message={(classes.error as Error).message} />;

  const rows = classes.data ?? [];
  const teacherRows = (teachers.data ?? []) as unknown as TeacherRow[];

  return (
    <>
      <PageHeader title="Classes" description="Strength, class teacher and fee position for each section." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Classes" value={rows.length} icon={<School className="size-4" />} tone="brand" />
        <StatCard label="Total Students" value={students.data?.length ?? 0} tone="brand" />
        <StatCard
          label="Average Strength"
          value={rows.length ? Math.round((students.data?.length ?? 0) / rows.length) : 0}
          tone="default"
        />
        <StatCard label="Academic Year" value={rows[0]?.academic_year ?? "—"} tone="brand" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => {
          const inClass = (students.data ?? []).filter((s) => s.class_id === c.id);
          const pending = (fees.data ?? [])
            .filter((f) => inClass.some((s) => s.id === f.student_id))
            .reduce((sum, f) => sum + pendingOf(f), 0);
          const teacher = teacherRows.find((t) => t.class_teachers?.some((ct) => ct.class_id === c.id));
          return (
            <div key={c.id} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Class {classLabel(c.grade, c.section)}</h2>
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                  {inClass.length} students
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Class teacher: <span className="font-medium text-foreground">{teacher?.full_name ?? "Not assigned"}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pending fees: <span className="font-semibold text-destructive">{inr(pending)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
