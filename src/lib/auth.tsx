import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "teacher" | "parent";

type AuthValue = {
  session: Session | null;
  user: User | null;
  role: Role | null;
  fullName: string;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  role: null,
  fullName: "",
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRole = async (uid: string | undefined) => {
      if (!uid) {
        setRole(null);
        setFullName("");
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      ]);
      if (!active) return;
      const order: Role[] = ["admin", "teacher", "parent"];
      const found = order.find((r) => roles?.some((x) => x.role === r)) ?? null;
      setRole(found);
      setFullName(profile?.full_name ?? "");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void loadRole(next?.user?.id).finally(() => active && setLoading(false));
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void loadRole(data.session?.user?.id).finally(() => active && setLoading(false));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, role, fullName, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function homeForRole(role: Role | null): string {
  if (role === "admin") return "/dashboard";
  if (role === "teacher") return "/teacher";
  return "/parent";
}
