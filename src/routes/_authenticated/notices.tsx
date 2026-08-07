import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, useNotices, type Notice } from "@/lib/data";
import { classLabel, shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, ErrorState, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({
    meta: [
      { title: "Notice Board — Rajnish Memorial Public School" },
      { name: "description", content: "School notices for parents, teachers and specific classes." },
      { property: "og:title", content: "Notice Board — Rajnish Memorial Public School" },
      { property: "og:description", content: "Announcements, holidays, exams and circulars." },
    ],
  }),
  component: NoticesPage,
});

const AUDIENCES = ["ALL", "PARENTS", "TEACHERS", "CLASS"] as const;

function NoticesPage() {
  const { role } = useAuth();
  const notices = useNotices();
  const classes = useClasses();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "",
    body: "",
    notice_date: new Date().toISOString().slice(0, 10),
    expiry_date: "",
    is_important: false,
    audience: "ALL" as Notice["audience"],
    class_id: "",
    attachment_url: "",
  });

  const isAdmin = role === "admin";

  const create = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    if (form.title.length > 140) {
      toast.error("Keep the title under 140 characters.");
      return;
    }
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("notices").insert({
      title: form.title.trim(),
      body: form.body.trim(),
      notice_date: form.notice_date,
      expiry_date: form.expiry_date || null,
      is_important: form.is_important,
      audience: form.audience,
      class_id: form.audience === "CLASS" ? form.class_id || null : null,
      attachment_url: form.attachment_url.trim() || null,
      created_by: userRes.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notice published");
    setOpen(false);
    setForm({ ...form, title: "", body: "", attachment_url: "", is_important: false });
    void qc.invalidateQueries({ queryKey: ["notices"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Notice removed");
    void qc.invalidateQueries({ queryKey: ["notices"] });
  };

  if (notices.isLoading) return <LoadingRows rows={4} />;
  if (notices.error) return <ErrorState message={(notices.error as Error).message} />;

  const rows = (notices.data ?? []).filter((n) => filter === "all" || n.audience === filter);

  return (
    <>
      <PageHeader
        title="Notice Board"
        description="Announcements targeted to everyone, parents, teachers or a single class."
        actions={
          isAdmin ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New notice
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...AUDIENCES].map((a) => (
          <Button
            key={a}
            size="sm"
            variant={filter === a ? "default" : "outline"}
            onClick={() => setFilter(a)}
          >
            {a === "all" ? "All notices" : a.charAt(0) + a.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((n) => (
            <article
              key={n.id}
              className={`card-surface p-5 ${n.is_important ? "border-l-4 border-l-destructive" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Megaphone className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold leading-tight">{n.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(n.notice_date)} ·{" "}
                      {n.audience === "CLASS"
                        ? `Class ${classLabel(
                            classes.data?.find((c) => c.id === n.class_id)?.grade,
                            classes.data?.find((c) => c.id === n.class_id)?.section,
                          )}`
                        : n.audience.charAt(0) + n.audience.slice(1).toLowerCase()}
                    </p>
                  </div>
                </div>
                {n.is_important ? (
                  <span className="rounded-full bg-destructive/12 px-2.5 py-1 text-[10px] font-bold uppercase text-destructive">
                    Important
                  </span>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-4 flex items-center gap-3">
                {n.attachment_url ? (
                  <a
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={n.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View attachment
                  </a>
                ) : null}
                {isAdmin ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => void remove(n.id)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No notices" description="Published notices will appear here." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish a notice</DialogTitle>
            <DialogDescription>Notices appear instantly on the targeted dashboards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                maxLength={140}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Annual Day celebration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={5}
                maxLength={2000}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Details of the announcement…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notice_date">Notice date</Label>
                <Input
                  id="notice_date"
                  type="date"
                  value={form.notice_date}
                  onChange={(e) => setForm({ ...form, notice_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expires on (optional)</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <select
                  id="audience"
                  className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as Notice["audience"] })}
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {a.charAt(0) + a.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              {form.audience === "CLASS" ? (
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
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment_url">Attachment link (optional)</Label>
              <Input
                id="attachment_url"
                value={form.attachment_url}
                onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Mark as important</p>
                <p className="text-xs text-muted-foreground">Highlighted in red and pinned to the top.</p>
              </div>
              <Switch
                checked={form.is_important}
                onCheckedChange={(v) => setForm({ ...form, is_important: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()} disabled={busy}>
              {busy ? "Publishing…" : "Publish notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
