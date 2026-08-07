import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ReminderInput = { studentIds: string[]; channel: "EMAIL" | "SMS" | "WHATSAPP" };

export const sendFeeReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ReminderInput) => {
    if (!input || !Array.isArray(input.studentIds) || input.studentIds.length === 0) {
      throw new Error("Select at least one parent to remind.");
    }
    if (input.studentIds.length > 500) throw new Error("Too many recipients in one batch.");
    if (!["EMAIL", "SMS", "WHATSAPP"].includes(input.channel)) throw new Error("Unsupported channel.");
    return { studentIds: input.studentIds.slice(0, 500), channel: input.channel };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Only administrators can send fee reminders.");

    const { data: settings } = await supabase
      .from("school_settings")
      .select("school_name, reminder_template, payment_link")
      .eq("id", 1)
      .maybeSingle();

    const template =
      settings?.reminder_template ??
      "{{school}}: ₹{{amount}} fee is pending for {{student}}, Class {{class}}. Please pay by {{due_date}}.";

    const { data: fees, error: feeError } = await supabase
      .from("student_fees")
      .select(
        "total_amount, discount, late_fee, paid_amount, due_date, students!inner(id, full_name, guardian_name, guardian_phone, guardian_email, classes(grade, section))",
      )
      .in("student_id", data.studentIds);
    if (feeError) throw new Error(feeError.message);

    const logs = [];
    for (const row of fees ?? []) {
      const student = row.students as unknown as {
        id: string;
        full_name: string;
        guardian_name: string;
        guardian_phone: string | null;
        guardian_email: string | null;
        classes: { grade: string; section: string } | null;
      } | null;
      if (!student) continue;

      const pending =
        Number(row.total_amount) - Number(row.discount) + Number(row.late_fee) - Number(row.paid_amount);
      if (pending <= 0) continue;

      const recipient =
        data.channel === "EMAIL" ? student.guardian_email : student.guardian_phone;

      const message = template
        .replace(/{{school}}/g, settings?.school_name ?? "Rajnish Memorial Public School")
        .replace(/{{student}}/g, student.full_name)
        .replace(/{{parent}}/g, student.guardian_name)
        .replace(/{{amount}}/g, Math.round(pending).toLocaleString("en-IN"))
        .replace(
          /{{class}}/g,
          student.classes ? `${student.classes.grade}-${student.classes.section}` : "—",
        )
        .replace(/{{due_date}}/g, new Date(row.due_date).toLocaleDateString("en-IN"))
        .concat(settings?.payment_link ? ` Pay online: ${settings.payment_link}` : "");

      logs.push({
        student_id: student.id,
        student_name: student.full_name,
        parent_name: student.guardian_name,
        recipient: recipient ?? "",
        channel: data.channel,
        message,
        amount: Math.round(pending),
        status: recipient ? ("SENT" as const) : ("SKIPPED" as const),
        error: recipient ? null : `No ${data.channel.toLowerCase()} contact on file`,
        created_by: userId,
      });
    }

    if (!logs.length) {
      return { sent: 0, skipped: 0, total: 0 };
    }

    const { error: insertError } = await supabase.from("communication_logs").insert(logs);
    if (insertError) throw new Error(insertError.message);

    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === "SENT").length,
      skipped: logs.filter((l) => l.status === "SKIPPED").length,
    };
  });
