import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Student } from "@/lib/data";

export function useMyChildren() {
  return useQuery({
    queryKey: ["my-children"],
    queryFn: async (): Promise<Student[]> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, admission_no, full_name, roll_no, dob, gender, photo_url, address, guardian_name, guardian_phone, guardian_email, active, class_id, parent_user_id, classes(id, grade, section)",
        )
        .eq("parent_user_id", uid);
      if (error) throw error;
      return (data ?? []) as unknown as Student[];
    },
  });
}
