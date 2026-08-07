import { createFileRoute, Link } from "@tanstack/react-router";
import { IndianRupee, CalendarCheck, BookOpen, Megaphone } from "lucide-react";
import { useFeeRows, useNotices } from "@/lib/data";
import { useMyChildren } from "@/lib/parent";
import { classLabel, inr, pendingOf, shortDate } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, EmptyState, FeeStatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/parent/")({
  head: () => ({
    meta: [
      { title: "Parent Home — Rajnish Memorial Public School" },
      { name: "description", content: "Your child's fees, attendance, homework and school notices." },
      { property: "og:title", content: "Parent Home — Rajnish Memorial Public School" },
      { property: "og:description", content: "A quick daily summary for parents." },
    ],
  }),
  component: ParentHome,
});

function ParentHome() {
  const children = useMyChildren();
  const fees = useFeeRows();
  const notices = useNotices();

  if (children.isLoading) return <LoadingRows rows={4} />;
  const kids = children.data ?? [];
  if (!kids.length) {
    return <EmptyState title="No student linked" description="Please contact the school office to link your child." />;
  }

  return (
    <>
      <PageHeader title="Home" description="Your child's school summary at a glance." />
      {kids.map((child) => {
        const fee = (fees.data ?? []).find((f) => f.student_id === child.id);
        return (
          <div key={child.id} className="card-surface mb-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                {child.full_name.slice(0, 1)}
              </span>
              <div>
                <p className="font-semibold">{child.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Class {classLabel(child.classes?.grade, child.classes?.section)} · Roll {child.roll_no ?? "—"}
                </p>
              </div>
              {fee ? <span className="ml-auto"><FeeStatusBadge status={fee.status} /></span> : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Fee Pending" value={fee ? inr(pendingOf(fee)) : "—"} tone="danger" icon={<IndianRupee className="size-4" />} />
              <StatCard label="Fee Paid" value={fee ? inr(fee.paid_amount) : "—"} tone="success" />
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline"><Link to="/parent/attendance"><CalendarCheck className="size-4" /> Attendance</Link></Button>
        <Button asChild variant="outline"><Link to="/parent/homework"><BookOpen className="size-4" /> Homework</Link></Button>
      </div>

      <div className="card-surface mt-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Megaphone className="size-4 text-primary" /> Latest notices
        </h2>
        <ul className="divide-y">
          {(notices.data ?? []).slice(0, 5).map((n) => (
            <li key={n.id} className="py-2.5">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{shortDate(n.notice_date)}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
