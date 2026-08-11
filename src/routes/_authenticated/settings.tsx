import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/data";
import { PageHeader, LoadingRows, ErrorState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "School Settings — Rajnish Memorial Public School" },
      { name: "description", content: "School profile, late fee rules and the fee reminder message template." },
      { property: "og:title", content: "School Settings — Rajnish Memorial Public School" },
      { property: "og:description", content: "Configure school details and reminder templates." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { role } = useAuth();
  const settings = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings.data) {
      const s = settings.data as Record<string, unknown>;
      setForm({
        school_name: String(s["school_name"] ?? ""),
        address: String(s["address"] ?? ""),
        phone: String(s["phone"] ?? ""),
        email: String(s["email"] ?? ""),
        academic_year: String(s["academic_year"] ?? ""),
        late_fee_per_month: String(s["late_fee_per_month"] ?? 0),
        late_fee_grace_days: String(s["late_fee_grace_days"] ?? 0),
        payment_link: String(s["payment_link"] ?? ""),
        payment_qr_url: String(s["payment_qr_url"] ?? ""),
        reminder_template: String(s["reminder_template"] ?? ""),
      });
    }
  }, [settings.data]);

  if (role && role !== "admin") return <ErrorState message="Settings are available to administrators only." />;
  if (settings.isLoading) return <LoadingRows rows={4} />;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("school_settings")
      .update({
        school_name: (form["school_name"] ?? ""),
        address: (form["address"] ?? ""),
        phone: (form["phone"] ?? ""),
        email: (form["email"] ?? ""),
        academic_year: (form["academic_year"] ?? ""),
        late_fee_per_month: Number((form["late_fee_per_month"] ?? "") || 0),
        late_fee_grace_days: Number((form["late_fee_grace_days"] ?? "") || 0),
        payment_link: (form["payment_link"] ?? "") || null,
        payment_qr_url: (form["payment_qr_url"] ?? "") || null,
        reminder_template: (form["reminder_template"] ?? ""),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    void qc.invalidateQueries({ queryKey: ["settings"] });
  };

  const field = (key: string, label: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} type={type} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <>
      <PageHeader title="School Settings" description="School profile, fee rules and reminder message template." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface space-y-4 p-5">
          <h2 className="font-semibold">School profile</h2>
          {field("school_name", "School name")}
          {field("address", "Address")}
          {field("phone", "Phone")}
          {field("email", "Email", "email")}
          {field("academic_year", "Academic year")}
        </div>
        <div className="card-surface space-y-4 p-5">
          <h2 className="font-semibold">Fees & reminders</h2>
          {field("late_fee_per_month", "Late fee per month (₹)", "number")}
          {field("late_fee_grace_days", "Grace period (days)", "number")}
          {field("payment_link", "Online payment link")}
          <div className="space-y-2">
            <Label htmlFor="qr">Payment QR code (gallery se upload karein)</Label>
            {form["payment_qr_url"] ? (
              <img
                src={form["payment_qr_url"]}
                alt="School payment QR code"
                loading="lazy"
                className="h-40 w-40 rounded-lg border object-contain p-2"
              />
            ) : (
              <p className="text-xs text-muted-foreground">Abhi koi QR upload nahi hua hai.</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="qr"
                type="file"
                accept="image/*"
                className="max-w-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 3 * 1024 * 1024) {
                    toast.error("Image 3MB se choti honi chahiye.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setForm((f) => ({ ...f, payment_qr_url: String(reader.result ?? "") }));
                  reader.readAsDataURL(file);
                }}
              />
              {form["payment_qr_url"] ? (
                <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, payment_qr_url: "" }))}>
                  Remove QR
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload ke baad “Save settings” dabayein — parents ko fees page par yeh QR dikhega.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder_template">Reminder message template</Label>
            <Textarea
              id="reminder_template"
              rows={5}
              value={form["reminder_template"] ?? ""}
              onChange={(e) => setForm({ ...form, reminder_template: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Placeholders: {"{{school}}"}, {"{{student}}"}, {"{{parent}}"}, {"{{class}}"}, {"{{amount}}"},{" "}
              {"{{due_date}}"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </>
  );
}
