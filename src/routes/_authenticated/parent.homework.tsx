import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "@/lib/parent";
import { shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/parent/homework")({
  head: () => ({
    meta: [
      { title: "Homework — Rajnish Memorial Public School" },
      { name: "description", content: "Homework assigned to your child's class." },
      { property: "og:title", content: "Homework — Rajnish Memorial Public School" },
      { property: "og:description", content: "Daily assignments and due dates." },
    ],
  }),
  component: ParentHomework,
});

function ParentHomework() {
  const children = useMyChildren();
  const classIds = (children.data ?? []).map((c) => c.class_id).filter(Boolean) as string[];

  const hw = useQuery({
    queryKey: ["parent-homework", classIds.join(",")],
    enabled: classIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .in("class_id", classIds)
        .order("assigned_date", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (children.isLoading || hw.isLoading) return <LoadingRows rows={4} />;
  if (!hw.data?.length) return <EmptyState title="No homework posted" />;

  return (
    <>
      <PageHeader title="Homework" description="Assignments for your child's class." />
      <div className="grid gap-4 sm:grid-cols-2">
        {hw.data.map((h) => (
          <article key={h.id} className="card-surface p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <BookOpen className="size-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{h.subject}</p>
            </div>
            <h2 className="mt-3 font-semibold">{h.title}</h2>
            {h.description ? <p className="mt-1 text-sm text-muted-foreground">{h.description}</p> : null}
            <p className="mt-3 text-xs text-muted-foreground">Due {shortDate(h.due_date)}</p>
          </article>
        ))}
      </div>
    </>
  );
}
