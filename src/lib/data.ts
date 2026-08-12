import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClassRow = { id: string; grade: string; section: string; academic_year: string };

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<ClassRow[]> => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, grade, section, academic_year")
        .order("grade")
        .order("section");
      if (error) throw error;
      return (data ?? []).sort(
        (a, b) => Number(a.grade) - Number(b.grade) || a.section.localeCompare(b.section),
      );
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

const STUDENT_SELECT =
  "id, admission_no, full_name, roll_no, dob, gender, photo_url, address, guardian_name, guardian_phone, guardian_email, active, class_id, parent_user_id, classes(id, grade, section)";

export type Student = {
  id: string;
  admission_no: string;
  full_name: string;
  roll_no: number | null;
  dob: string | null;
  gender: string | null;
  photo_url: string | null;
  address: string | null;
  guardian_name: string;
  guardian_phone: string | null;
  guardian_email: string | null;
  active: boolean;
  class_id: string | null;
  parent_user_id: string | null;
  classes: { id: string; grade: string; section: string } | null;
};

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase
        .from("students")
        .select(STUDENT_SELECT)
        .order("admission_no");
      if (error) throw error;
      return (data ?? []) as unknown as Student[];
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: async (): Promise<Student | null> => {
      const { data, error } = await supabase
        .from("students")
        .select(STUDENT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Student | null;
    },
  });
}

export type FeeRow = {
  id: string;
  student_id: string;
  academic_year: string;
  total_amount: number;
  discount: number;
  late_fee: number;
  previous_pending_fee: number;
  paid_amount: number;
  due_date: string;
  status: "PAID" | "PARTIALLY_PAID" | "DUE";
  students: {
    id: string;
    full_name: string;
    admission_no: string;
    guardian_name: string;
    guardian_phone: string | null;
    guardian_email: string | null;
    active: boolean;
    classes: { grade: string; section: string } | null;
  } | null;
};

export function useFeeRows() {
  return useQuery({
    queryKey: ["student_fees"],
    queryFn: async (): Promise<FeeRow[]> => {
      const { data, error } = await supabase
        .from("student_fees")
        .select(
          "id, student_id, academic_year, total_amount, discount, late_fee, previous_pending_fee, paid_amount, due_date, status, students(id, full_name, admission_no, guardian_name, guardian_phone, guardian_email, active, classes(grade, section))",
        );
      if (error) throw error;
      return (data ?? []) as unknown as FeeRow[];
    },
  });
}

export type PaymentRow = {
  id: string;
  receipt_no: string;
  amount: number;
  method: string;
  paid_on: string;
  note: string | null;
  student_id: string;
  student_fee_id: string;
  created_at: string;
  students: { full_name: string; admission_no: string; classes: { grade: string; section: string } | null } | null;
};

export function usePayments(studentId?: string) {
  return useQuery({
    queryKey: ["payments", studentId ?? "all"],
    queryFn: async (): Promise<PaymentRow[]> => {
      let q = supabase
        .from("payments")
        .select(
          "id, receipt_no, amount, method, paid_on, note, student_id, student_fee_id, created_at, students(full_name, admission_no, classes(grade, section))",
        )
        .order("paid_on", { ascending: false });
      if (studentId) q = q.eq("student_id", studentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PaymentRow[];
    },
  });
}

export type Notice = {
  id: string;
  title: string;
  body: string;
  notice_date: string;
  expiry_date: string | null;
  is_important: boolean;
  audience: "ALL" | "PARENTS" | "TEACHERS" | "CLASS";
  class_id: string | null;
  attachment_url: string | null;
  created_at: string;
};

export function useNotices() {
  return useQuery({
    queryKey: ["notices"],
    queryFn: async (): Promise<Notice[]> => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("is_important", { ascending: false })
        .order("notice_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Notice[];
    },
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*, class_teachers(class_id, classes(grade, section))")
        .order("employee_no");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCalendarEvents() {
  return useQuery({
    queryKey: ["calendar_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("event_date");
      if (error) throw error;
      return data ?? [];
    },
  });
}
