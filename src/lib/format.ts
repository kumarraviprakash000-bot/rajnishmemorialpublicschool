export const SCHOOL_NAME = "Rajnish Memorial Public School";

export function inr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function shortDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function classLabel(grade?: string | null, section?: string | null): string {
  if (!grade) return "—";
  return section ? `${grade}-${section}` : grade;
}

export type FeeStatus = "PAID" | "PARTIALLY_PAID" | "DUE";

export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  PAID: "Fee Paid",
  PARTIALLY_PAID: "Partially Paid",
  DUE: "Fee Due",
};

type FeeRow = {
  total_amount: number | string;
  discount: number | string;
  late_fee: number | string;
  paid_amount: number | string;
};

export function payableOf(row: Omit<FeeRow, "paid_amount">): number {
  return Math.max(Number(row.total_amount) - Number(row.discount) + Number(row.late_fee), 0);
}

export function pendingOf(row: FeeRow): number {
  return Math.max(payableOf(row) - Number(row.paid_amount), 0);
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
