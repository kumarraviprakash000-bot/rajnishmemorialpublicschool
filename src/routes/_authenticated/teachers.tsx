import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Mail, Phone } from "lucide-react";
import { useTeachers } from "@/lib/data";
import { classLabel } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — Rajnish Memorial Public School" },
      { name: "description", content: "Teaching staff directory with subjects and assigned classes." },
      { property: "og:title", content: "Teachers — Rajnish Memorial Public School" },
      { property: "og:description", content: "Staff contact details and class assignments." },
    ],
  }),
  component: TeachersPage,
});

type TeacherRow = {
  id: string;
  employee_no: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  active: boolean;
  class_teachers: { classes: { grade: string; section: string } | null }[];
};

function TeachersPage() {
  const teachers = useTeachers();
  if (teachers.isLoading) return <LoadingRows rows={5} />;
  if (teachers.error) return <ErrorState message={(teachers.error as Error).message} />;

  const rows = (teachers.data ?? []) as unknown as TeacherRow[];

  return (
    <>
      <PageHeader title="Teachers" description="Teaching staff, subjects and class assignments." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Teachers" value={rows.length} icon={<GraduationCap className="size-4" />} tone="brand" />
        <StatCard label="Active" value={rows.filter((t) => t.active).length} tone="success" />
        <StatCard label="Subjects Covered" value={new Set(rows.map((t) => t.subject)).size} tone="brand" />
        <StatCard
          label="Class Teachers"
          value={rows.filter((t) => t.class_teachers?.length).length}
          tone="brand"
        />
      </div>

      {rows.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <div key={t.id} className="card-surface p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                  {t.full_name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.employee_no} · {t.subject ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Mail className="size-4" /> <span className="truncate">{t.email ?? "—"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4" /> {t.phone ?? "—"}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(t.class_teachers ?? []).map((ct, i) => (
                  <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    Class {classLabel(ct.classes?.grade, ct.classes?.section)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No teachers yet" />
      )}
    </>
  );
}
