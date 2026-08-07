import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, homeForRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL_NAME } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Rajnish Memorial Public School" },
      { name: "description", content: "Secure sign in for school administrators, teachers and parents." },
      { property: "og:title", content: "Sign in — Rajnish Memorial Public School" },
      { property: "og:description", content: "Secure sign in for administrators, teachers and parents." },
    ],
  }),
  component: AuthPage,
});

const DEMOS = [
  { label: "Admin", email: "admin@rmps.edu.in" },
  { label: "Teacher", email: "teacher@rmps.edu.in" },
  { label: "Parent", email: "parent@rmps.edu.in" },
];

function AuthPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: homeForRole(role), replace: true });
  }, [loading, session, role, navigate]);

  const signIn = async (mail: string, pass: string) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
  };

  const useDemo = async (mail: string) => {
    setEmail(mail);
    setPassword("demo1234");
    await signIn(mail, "demo1234");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="brand-gradient mb-4 flex size-14 items-center justify-center rounded-2xl text-base font-bold text-primary-foreground">
            RM
          </span>
          <h1 className="text-xl font-bold">{SCHOOL_NAME}</h1>
          <p className="text-sm text-muted-foreground">School Management Portal</p>
        </div>

        <form
          className="card-surface space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim() || password.length < 6) {
              toast.error("Enter a valid email and a password of at least 6 characters.");
              return;
            }
            void signIn(email.trim(), password);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu.in"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="card-surface mt-4 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Demo accounts
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {DEMOS.map((d) => (
              <Button
                key={d.email}
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void useDemo(d.email)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Password for all demo accounts: demo1234</p>
        </div>
      </div>
    </div>
  );
}
