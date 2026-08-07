import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useNotices } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/parent/notices")({
  head: () => ({
    meta: [
      { title: "Notices — Rajnish Memorial Public School" },
      { name: "description", content: "School notices and circulars for parents." },
      { property: "og:title", content: "Notices — Rajnish Memorial Public School" },
      { property: "og:description", content: "Announcements from the school office." },
    ],
  }),
  component: ParentNotices,
});

function ParentNotices() {
  const notices = useNotices();
  if (notices.isLoading) return <LoadingRows rows={4} />;
  const rows = notices.data ?? [];
  if (!rows.length) return <EmptyState title="No notices" />;

  return (
    <>
      <PageHeader title="Notices" description="Announcements from the school." />
      <div className="space-y-3">
        {rows.map((n) => (
          <article key={n.id} className={`card-surface p-5 ${n.is_important ? "border-l-4 border-l-destructive" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Megaphone className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold leading-tight">{n.title}</h2>
                <p className="text-xs text-muted-foreground">{shortDate(n.notice_date)}</p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
          </article>
        ))}
      </div>
    </>
  );
}
