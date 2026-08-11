import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, homeForRole } from "@/lib/auth";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/phone-auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL_NAME } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Rajnish Memorial Public School" },
      { name: "description", content: "Phone number aur OTP se school portal me sign in karein." },
      { property: "og:title", content: "Sign in — Rajnish Memorial Public School" },
      { property: "og:description", content: "Phone + OTP sign in for administrators, teachers and parents." },
    ],
  }),
  component: AuthPage,
});

const SAMPLE = [
  { label: "Admin", phone: "8750776677" },
  { label: "Teacher", phone: "9812345602" },
  { label: "Parent", phone: "9811000137" },
];

function AuthPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const askOtp = useServerFn(requestPhoneOtp);
  const checkOtp = useServerFn(verifyPhoneOtp);

  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState<{ otp: string; name: string; needsPin: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: homeForRole(role), replace: true });
  }, [loading, session, role, navigate]);

  const sendOtp = async (value: string) => {
    setBusy(true);
    try {
      const res = await askOtp({ data: { phone: value } });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setSent({ otp: res.otp, name: res.name, needsPin: res.needsPin });
      setCode("");
      setPin("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "OTP bhejne me dikkat aayi.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      const res = await checkOtp({ data: { phone, code, pin } });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: res.tokenHash });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in nahi ho paya.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="brand-gradient mb-4 flex size-14 items-center justify-center rounded-2xl text-base font-bold text-primary-foreground">
            RM
          </span>
          <h1 className="text-xl font-bold">{SCHOOL_NAME}</h1>
          <p className="text-sm text-muted-foreground">Phone number se login karein</p>
        </div>

        <form
          className="card-surface space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!sent) {
              if (phone.replace(/\D/g, "").length < 10) {
                toast.error("10 digit ka mobile number daalein.");
                return;
              }
              void sendOtp(phone);
              return;
            }
            if (code.length !== 6) {
              toast.error("6 digit ka OTP daalein.");
              return;
            }
            if (sent.needsPin && pin.length !== 4) {
              toast.error("4 digit ka PIN daalein.");
              return;
            }
            void verify();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              disabled={!!sent}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98XXXXXXXX"
            />
          </div>

          {sent && (
            <>
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {sent.name} — aapka OTP
                </p>
                <p className="mt-1 text-2xl font-bold tracking-[0.4em] text-primary">{sent.otp}</p>
                <p className="mt-1 text-xs text-muted-foreground">Yahi OTP neeche box me daalein</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 digit OTP"
                />
              </div>

              {sent.needsPin && (
                <div className="space-y-2">
                  <Label htmlFor="pin">Staff PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="4 digit PIN"
                  />
                  <p className="text-xs text-muted-foreground">
                    Admin aur teacher ke liye PIN zaroori hai.
                  </p>
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : sent ? "Login" : "OTP bhejein"}
          </Button>

          {sent && (
            <div className="flex justify-between text-xs">
              <button
                type="button"
                className="text-muted-foreground underline"
                onClick={() => {
                  setSent(null);
                  setCode("");
                  setPin("");
                }}
              >
                Number badlein
              </button>
              <button
                type="button"
                className="text-primary underline"
                disabled={busy}
                onClick={() => void sendOtp(phone)}
              >
                OTP dobara bhejein
              </button>
            </div>
          )}
        </form>

        <div className="card-surface mt-4 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Demo numbers
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {SAMPLE.map((d) => (
              <Button
                key={d.phone}
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !!sent}
                onClick={() => {
                  setPhone(d.phone);
                  void sendOtp(d.phone);
                }}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Admin/Teacher PIN: 9455 · Parent ko sirf OTP chahiye
          </p>
        </div>
      </div>
    </div>
  );
}
