import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNotices } from "@/lib/data";
import { dateTime, inr, shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, ErrorState, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Rajnish Memorial Public School" },
      { name: "description", content: "Recent school activity: reminders sent, notices published and payments received." },
      { property: "og:title", content: "Notifications — Rajnish Memorial Public School" },
      { property: "og:description", content: "A single activity feed for school administrators." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const notices = useNotices();
  const activity = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const [{ data: logs }, { data: pays }] = await Promise.all([
        supabase.from("communication_logs").select("*").order("sent_at", { ascending: false }).limit(30),
        supabase
          .from("payments")
          .select("id, amount, receipt_no, created_at, students(full_name)")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      return { logs: logs ?? [], pays: pays ?? [] };
    },
  });

  if (activity.isLoading) return <LoadingRows rows={6} />;
  if (activity.error) return <ErrorState message={(activity.error as Error).message} />;

  type Item = { id: string; at: string; title: string; detail: string; tone: string };
  const items: Item[] = [
    ...(activity.data?.logs ?? []).map((l) => ({
      id: `log-${l.id}`,
      at: l.sent_at as string,
      title: `Fee reminder ${String(l.status).toLowerCase()} · ${l.student_name}`,
      detail: `${l.channel} to ${l.recipient || "no contact"} · ${inr(l.amount)} outstanding`,
      tone: l.status === "SENT" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
    })),
    ...(activity.data?.pays ?? []).map((p) => ({
      id: `pay-${p.id}`,
      at: p.created_at as string,
      title: `Payment received · ${(p.students as { full_name: string } | null)?.full_name ?? ""}`,
      detail: `Receipt ${p.receipt_no} · ${inr(p.amount)}`,
      tone: "bg-success/12 text-success",
    })),
    ...(notices.data ?? []).slice(0, 15).map((n) => ({
      id: `notice-${n.id}`,
      at: n.created_at,
      title: `Notice published · ${n.title}`,
      detail: `Audience ${n.audience.toLowerCase()} · ${shortDate(n.notice_date)}`,
      tone: n.is_important ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground",
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <>
      <PageHeader title="Notifications" description="Everything that happened across the school, newest first." />
      {items.length ? (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="card-surface flex items-start gap-3 p-4">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${i.tone}`}>
                <Bell className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{i.title}</p>
                <p className="text-xs text-muted-foreground">{i.detail}</p>
              </div>
              <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{dateTime(i.at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing yet" description="Activity will show up here as the school uses the portal." />
      )}
    </>
  );
}
