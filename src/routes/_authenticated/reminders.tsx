import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeeRows, useSettings } from "@/lib/data";
import { classLabel, dateTime, inr, pendingOf } from "@/lib/format";
import { PageHeader, StatCard, LoadingRows, ErrorState, TableWrap, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendFeeReminders } from "@/lib/reminders.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Fee Reminders — Rajnish Memorial Public School" },
      { name: "description", content: "Send one-click fee reminders to parents with outstanding dues." },
      { property: "og:title", content: "Fee Reminders — Rajnish Memorial Public School" },
      { property: "og:description", content: "Review pending dues and notify parents in a single click." },
    ],
  }),
  component: RemindersPage,
});

function RemindersPage() {
  const { role } = useAuth();
  const fees = useFeeRows();
  const settings = useSettings();
  const qc = useQueryClient();
  const send = useServerFn(sendFeeReminders);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("EMAIL");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const logs = useQuery({
    queryKey: ["communication_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communication_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pendingRows = useMemo(
    () => (fees.data ?? []).filter((r) => pendingOf(r) > 0 && r.students?.active),
    [fees.data],
  );

  if (role && role !== "admin") return <ErrorState message="Fee reminders are available to administrators only." />;
  if (fees.isLoading) return <LoadingRows rows={5} />;
  if (fees.error) return <ErrorState message={(fees.error as Error).message} />;

  const totalDue = pendingRows.reduce((s, r) => s + pendingOf(r), 0);
  const allSelected = pendingRows.length > 0 && selected.size === pendingRows.length;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(pendingRows.map((r) => r.student_id)));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const doSend = async () => {
    setBusy(true);
    try {
      const result = await send({ data: { studentIds: [...selected], channel } });
      toast.success(
        `${result.sent} reminder${result.sent === 1 ? "" : "s"} queued${
          result.skipped ? ` · ${result.skipped} skipped (missing contact)` : ""
        }`,
      );
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ["communication_logs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reminders.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const selectedAmount = pendingRows
    .filter((r) => selected.has(r.student_id))
    .reduce((s, r) => s + pendingOf(r), 0);

  return (
    <>
      <PageHeader
        title="Fee Reminders"
        description="Review outstanding dues, pick recipients and notify parents in one click."
        actions={
          <Button onClick={() => setConfirming(true)} disabled={!selected.size}>
            <Send className="size-4" /> Send {selected.size ? `${selected.size} ` : ""}reminders
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Parents With Dues" value={pendingRows.length} icon={<Bell className="size-4" />} tone="warning" />
        <StatCard label="Total Outstanding" value={inr(totalDue)} tone="danger" />
        <StatCard label="Selected" value={selected.size} tone="brand" />
        <StatCard label="Selected Amount" value={inr(selectedAmount)} tone="brand" />
      </div>

      <div className="card-surface mt-6 flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-medium">Channel</span>
        {([
          { key: "EMAIL", label: "Email", icon: <Mail className="size-4" /> },
          { key: "SMS", label: "SMS", icon: <MessageSquare className="size-4" /> },
          { key: "WHATSAPP", label: "WhatsApp", icon: <MessageSquare className="size-4" /> },
        ] as const).map((c) => (
          <Button
            key={c.key}
            size="sm"
            variant={channel === c.key ? "default" : "outline"}
            onClick={() => setChannel(c.key)}
          >
            {c.icon} {c.label}
          </Button>
        ))}
        <p className="ml-auto text-xs text-muted-foreground">
          Message template is configurable in Settings.
        </p>
      </div>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending dues</TabsTrigger>
          <TabsTrigger value="history">Reminder history</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingRows.length ? (
            <TableWrap>
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                    </th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingRows.map((r) => {
                    const contact = channel === "EMAIL" ? r.students?.guardian_email : r.students?.guardian_phone;
                    return (
                      <tr key={r.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(r.student_id)}
                            onCheckedChange={() => toggle(r.student_id)}
                            aria-label={`Select ${r.students?.full_name}`}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{r.students?.full_name}</td>
                        <td className="px-4 py-3">{classLabel(r.students?.classes?.grade, r.students?.classes?.section)}</td>
                        <td className="px-4 py-3">{r.students?.guardian_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {contact ?? <span className="text-destructive">Not on file</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{inr(pendingOf(r))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <EmptyState title="All fees are cleared" description="No parent currently has an outstanding balance." />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {logs.data?.length ? (
            <TableWrap>
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.data.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 whitespace-nowrap">{dateTime(l.sent_at)}</td>
                      <td className="px-4 py-3 font-medium">{l.student_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.recipient || "—"}</td>
                      <td className="px-4 py-3">{l.channel}</td>
                      <td className="px-4 py-3 text-right">{inr(l.amount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            l.status === "SENT"
                              ? "rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success"
                              : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                          }
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <EmptyState title="No reminders sent yet" description="Reminder history will appear here." />
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send {selected.size} fee reminders?</AlertDialogTitle>
            <AlertDialogDescription>
              Parents of {selected.size} students with {inr(selectedAmount)} outstanding will receive a{" "}
              {channel.toLowerCase()} reminder. Preview:{" "}
              <span className="mt-2 block rounded-md bg-muted p-3 text-xs text-foreground">
                {(settings.data?.reminder_template ?? "")
                  .replace("{{school}}", "Rajnish Memorial Public School")
                  .replace("{{amount}}", "4,500")
                  .replace("{{student}}", "Aarav Sharma")
                  .replace("{{class}}", "5-A")
                  .replace("{{due_date}}", "30/06/2026")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void doSend();
              }}
              disabled={busy}
            >
              {busy ? "Sending…" : "Confirm and send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
