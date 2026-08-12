import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recordUpiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string; amount: number; reference?: string; app?: string }) => ({
    studentId: String(input?.studentId ?? ""),
    amount: Number(input?.amount ?? 0),
    reference: String(input?.reference ?? "").trim(),
    app: String(input?.app ?? "UPI").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (!data.studentId || !(data.amount > 0)) {
      return { ok: false as const, message: "Amount sahi nahi hai." };
    }

    const { data: student, error: sErr } = await context.supabase
      .from("students")
      .select("id, full_name, admission_no, parent_user_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!student || student.parent_user_id !== context.userId) {
      return { ok: false as const, message: "Yeh student aapke account se linked nahi hai." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: fee, error: fErr } = await supabaseAdmin
      .from("student_fees")
      .select("id")
      .eq("student_id", data.studentId)
      .order("due_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!fee) return { ok: false as const, message: "Fee record nahi mila." };

    const { data: rno, error: rErr } = await supabaseAdmin.rpc("next_receipt_no");
    if (rErr) throw new Error(rErr.message);

    const paidOn = new Date().toISOString().slice(0, 10);
    const { data: pay, error: pErr } = await supabaseAdmin
      .from("payments")
      .insert({
        student_fee_id: fee.id,
        student_id: data.studentId,
        receipt_no: String(rno),
        amount: data.amount,
        method: "UPI",
        reference: data.reference || null,
        note: `Online UPI payment (${data.app})`,
        paid_on: paidOn,
      })
      .select("id, receipt_no, amount, method, paid_on, reference")
      .single();
    if (pErr) throw new Error(pErr.message);

    return {
      ok: true as const,
      receipt: {
        ...pay,
        studentName: student.full_name,
        admissionNo: student.admission_no,
      },
    };
  });
