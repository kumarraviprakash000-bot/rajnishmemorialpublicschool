import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type LoginRole = "admin" | "teacher" | "parent";

export const ADMIN_PHONE = "9455000000";
export const STAFF_PIN = "9455";

export type Account = {
  role: LoginRole;
  email: string;
  name: string;
  teacherId?: string;
  studentIds?: string[];
};

export function normalizePhone(input: string): string {
  return (input || "").replace(/\D/g, "").slice(-10);
}

type Admin = SupabaseClient<Database>;

export async function resolveAccount(admin: Admin, phone: string): Promise<Account | null> {
  if (phone === ADMIN_PHONE) {
    return { role: "admin", email: "admin@rmps.edu.in", name: "School Admin" };
  }

  const { data: teacher } = await admin
    .from("teachers")
    .select("id, full_name, email, employee_no, phone")
    .ilike("phone", `%${phone}`)
    .limit(1)
    .maybeSingle();
  if (teacher) {
    return {
      role: "teacher",
      email: teacher.email ?? `${teacher.employee_no.toLowerCase()}@rmps.edu.in`,
      name: teacher.full_name,
      teacherId: teacher.id,
    };
  }

  const { data: students } = await admin
    .from("students")
    .select("id, guardian_name, guardian_email, guardian_phone")
    .ilike("guardian_phone", `%${phone}`);
  if (students && students.length > 0) {
    const first = students[0]!;
    return {
      role: "parent",
      email: first.guardian_email ?? `parent${phone}@rmps.edu.in`,
      name: first.guardian_name,
      studentIds: students.map((s) => s.id),
    };
  }

  return null;
}

export async function ensureUser(admin: Admin, account: Account, phone: string): Promise<string> {
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", account.email)
    .maybeSingle();

  let userId = existing?.id ?? null;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: account.name, phone },
    });
    if (error || !created?.user) {
      throw new Error(error?.message ?? "Could not create the account.");
    }
    userId = created.user.id;
  }

  await admin
    .from("profiles")
    .upsert({ id: userId, full_name: account.name, email: account.email, phone }, { onConflict: "id" });

  await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: account.role }, { onConflict: "user_id,role" });

  if (account.role === "teacher" && account.teacherId) {
    await admin.from("teachers").update({ profile_id: userId }).eq("id", account.teacherId);
  }
  if (account.role === "parent" && account.studentIds?.length) {
    await admin.from("students").update({ parent_user_id: userId }).in("id", account.studentIds);
  }

  return userId;
}

export function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
