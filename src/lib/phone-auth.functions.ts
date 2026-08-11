import { createServerFn } from "@tanstack/react-start";

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => ({ phone: String(input?.phone ?? "") }))
  .handler(async ({ data }) => {
    const { normalizePhone, resolveAccount, makeOtp } = await import("./phone-auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phone = normalizePhone(data.phone);
    if (phone.length !== 10) return { ok: false as const, message: "10 digit ka mobile number daalein." };

    const account = await resolveAccount(supabaseAdmin, phone);
    if (!account) {
      return { ok: false as const, message: "Yeh number school records me nahi mila." };
    }

    const code = makeOtp();
    const { error } = await supabaseAdmin.from("login_otps").upsert(
      { phone, code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() },
      { onConflict: "phone" },
    );
    if (error) throw new Error(error.message);

    return {
      ok: true as const,
      otp: code,
      role: account.role,
      name: account.name,
      needsPin: account.role !== "parent",
    };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; code: string; pin?: string }) => ({
    phone: String(input?.phone ?? ""),
    code: String(input?.code ?? "").trim(),
    pin: String(input?.pin ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    const { normalizePhone, resolveAccount, ensureUser, STAFF_PIN } = await import("./phone-auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phone = normalizePhone(data.phone);
    const account = await resolveAccount(supabaseAdmin, phone);
    if (!account) return { ok: false as const, message: "Yeh number school records me nahi mila." };

    const { data: row } = await supabaseAdmin
      .from("login_otps")
      .select("code, expires_at")
      .eq("phone", phone)
      .maybeSingle();

    if (!row || row.code !== data.code) return { ok: false as const, message: "OTP galat hai." };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, message: "OTP expire ho gaya, dobara bhejein." };
    }

    if (account.role !== "parent" && data.pin !== STAFF_PIN) {
      return { ok: false as const, message: "PIN galat hai." };
    }

    await ensureUser(supabaseAdmin, account, phone);
    await supabaseAdmin.from("login_otps").delete().eq("phone", phone);

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: account.email,
    });
    if (error || !link?.properties?.hashed_token) {
      throw new Error(error?.message ?? "Sign in link banane me dikkat aayi.");
    }

    return { ok: true as const, tokenHash: link.properties.hashed_token, role: account.role };
  });
