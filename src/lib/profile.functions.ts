import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateMyPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => ({ phone: String(input?.phone ?? "") }))
  .handler(async ({ data, context }) => {
    const phone = data.phone.replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) return { ok: false as const, message: "10 digit ka mobile number daalein." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Number should not already belong to a different staff member / parent.
    const [{ data: otherTeacher }, { data: otherStudents }] = await Promise.all([
      supabaseAdmin.from("teachers").select("id, profile_id").ilike("phone", `%${phone}`).limit(1).maybeSingle(),
      supabaseAdmin.from("students").select("id, parent_user_id").ilike("guardian_phone", `%${phone}`).limit(1),
    ]);
    if (otherTeacher && otherTeacher.profile_id && otherTeacher.profile_id !== userId) {
      return { ok: false as const, message: "Yeh number kisi aur account se juda hai." };
    }
    const clash = (otherStudents ?? []).find((s) => s.parent_user_id && s.parent_user_id !== userId);
    if (clash) return { ok: false as const, message: "Yeh number kisi aur account se juda hai." };

    await supabaseAdmin.from("profiles").update({ phone }).eq("id", userId);
    await supabaseAdmin.from("teachers").update({ phone }).eq("profile_id", userId);
    await supabaseAdmin.from("students").update({ guardian_phone: phone }).eq("parent_user_id", userId);

    return { ok: true as const, phone };
  });

export const getMyPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("phone")
      .eq("id", context.userId)
      .maybeSingle();
    return { phone: data?.phone ?? "" };
  });
