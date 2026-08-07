import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useMyChildren } from "@/lib/parent";
import { classLabel, shortDate } from "@/lib/format";
import { PageHeader, LoadingRows, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/parent/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Rajnish Memorial Public School" },
      { name: "description", content: "Your contact details and linked students." },
      { property: "og:title", content: "My Profile — Rajnish Memorial Public School" },
      { property: "og:description", content: "Parent account details." },
    ],
  }),
  component: ParentProfile,
});

function ParentProfile() {
  const { fullName, user, signOut } = useAuth();
  const children = useMyChildren();

  if (children.isLoading) return <LoadingRows rows={3} />;
  const kids = children.data ?? [];

  return (
    <>
      <PageHeader title="My Profile" description="Your account and linked students." />
      <div className="card-surface p-5">
        <p className="font-semibold">{fullName || "Parent"}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4" /> {user?.email ?? "—"}
        </p>
      </div>

      <h2 className="mb-3 mt-6 font-semibold">Linked students</h2>
      {kids.length ? (
        <div className="space-y-3">
          {kids.map((c) => (
            <div key={c.id} className="card-surface p-5">
              <p className="font-semibold">{c.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {c.admission_no} · Class {classLabel(c.classes?.grade, c.classes?.section)} · DOB {shortDate(c.dob)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4" /> {c.guardian_phone ?? "—"}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {c.address ?? "—"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No student linked" />
      )}

      <Button className="mt-6" variant="outline" onClick={() => void signOut()}>
        Sign out
      </Button>
    </>
  );
}
