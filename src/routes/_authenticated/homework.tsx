import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClasses } from "@/lib/data";
import { classLabel, shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, ErrorState, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/homework")({
  head: () => ({
    meta: [
      { title: "Homework — Rajnish Memorial Public School" },
      { name: "description", content: "Homework assigned to each class with due dates." },
      { property: "og:title", content: "Homework — Rajnish Memorial Public School" },
      { property: "og:description", content: "Daily homework for students and parents." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const { role } = useAuth();
  const classes = useClasses();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    class_id: "",
    subject: "",
    title: "",
    description: "",
    due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  });

  const hw = useQuery({
    queryKey: ["homework"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework")
        .select("*, classes(grade, section)")
        .order("assigned_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (hw.isLoading) return <LoadingRows rows={5} />;
  if (hw.error) return <ErrorState message={(hw.error as Error).message} />;

  const create = async () => {
    if (!form.class_id || !form.title.trim() || !form.subject.trim()) {
      toast.error("Class, subject and title are required.");
      return;
    }
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("homework").insert({
      class_id: form.class_id,
      subject: form.subject.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigned_date: new Date().toISOString().slice(0, 10),
      due_date: form.due_date,
      created_by: userRes.user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Homework assigned");
    setOpen(false);
    setForm({ ...form, title: "", description: "" });
    void qc.invalidateQueries({ queryKey: ["homework"] });
  };

  return (
    <>
      <PageHeader
        title="Homework"
        description="Assignments given to each class, newest first."
        actions={
          role !== "parent" ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Assign homework
            </Button>
          ) : undefined
        }
      />

      {hw.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hw.data.map((h) => {
            const c = h.classes as { grade: string; section: string } | null;
            return (
              <article key={h.id} className="card-surface p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <BookOpen className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{h.subject}</p>
                    <p className="text-xs text-muted-foreground">Class {classLabel(c?.grade, c?.section)}</p>
                  </div>
                </div>
                <h2 className="mt-3 font-semibold">{h.title}</h2>
                {h.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Assigned {shortDate(h.assigned_date)} · Due{" "}
                  <span className="font-medium text-foreground">{shortDate(h.due_date)}</span>
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No homework yet" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class_id">Class</Label>
              <select
                id="class_id"
                className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              >
                <option value="">Select class</option>
                {(classes.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {classLabel(c.grade, c.section)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Details</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()} disabled={busy}>
              {busy ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
