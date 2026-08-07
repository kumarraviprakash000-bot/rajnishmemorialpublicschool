export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      class_teachers: {
        Row: {
          class_id: string
          id: string
          is_class_teacher: boolean
          teacher_id: string
        }
        Insert: {
          class_id: string
          id?: string
          is_class_teacher?: boolean
          teacher_id: string
        }
        Update: {
          class_id?: string
          id?: string
          is_class_teacher?: boolean
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string
          grade: string
          id: string
          section: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          grade: string
          id?: string
          section: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          grade?: string
          id?: string
          section?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          amount: number | null
          channel: Database["public"]["Enums"]["comm_channel"]
          created_by: string | null
          error: string | null
          id: string
          message: string
          parent_name: string | null
          recipient: string | null
          sent_at: string
          status: Database["public"]["Enums"]["comm_status"]
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          amount?: number | null
          channel?: Database["public"]["Enums"]["comm_channel"]
          created_by?: string | null
          error?: string | null
          id?: string
          message?: string
          parent_name?: string | null
          recipient?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["comm_status"]
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          amount?: number | null
          channel?: Database["public"]["Enums"]["comm_channel"]
          created_by?: string | null
          error?: string | null
          id?: string
          message?: string
          parent_name?: string | null
          recipient?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["comm_status"]
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          published: boolean
          start_date: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          published?: boolean
          start_date?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          published?: boolean
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          annual_fee: number
          class_id: string
          created_at: string
          due_date: string
          id: string
          late_fee_per_month: number
          other_fee: number
          transport_fee: number
          tuition_fee: number
          updated_at: string
        }
        Insert: {
          academic_year?: string
          annual_fee?: number
          class_id: string
          created_at?: string
          due_date: string
          id?: string
          late_fee_per_month?: number
          other_fee?: number
          transport_fee?: number
          tuition_fee?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          annual_fee?: number
          class_id?: string
          created_at?: string
          due_date?: string
          id?: string
          late_fee_per_month?: number
          other_fee?: number
          transport_fee?: number
          tuition_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_date: string
          attachment_url: string | null
          class_id: string
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          subject: string
          title: string
        }
        Insert: {
          assigned_date?: string
          attachment_url?: string | null
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          subject: string
          title: string
        }
        Update: {
          assigned_date?: string
          attachment_url?: string | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number
          max_marks: number
          student_id: string
          subject_id: string | null
          subject_name: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained?: number
          max_marks?: number
          student_id: string
          subject_id?: string | null
          subject_name: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number
          max_marks?: number
          student_id?: string
          subject_id?: string | null
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachment_url: string | null
          audience: Database["public"]["Enums"]["notice_audience"]
          body: string
          class_id: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          is_important: boolean
          notice_date: string
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          audience?: Database["public"]["Enums"]["notice_audience"]
          body?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          is_important?: boolean
          notice_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          audience?: Database["public"]["Enums"]["notice_audience"]
          body?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          is_important?: boolean
          notice_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          note: string | null
          paid_on: string
          receipt_no: string
          recorded_by: string | null
          reference: string | null
          student_fee_id: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          paid_on?: string
          receipt_no: string
          recorded_by?: string | null
          reference?: string | null
          student_fee_id: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          paid_on?: string
          receipt_no?: string
          recorded_by?: string | null
          reference?: string | null
          student_fee_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          academic_year: string
          address: string | null
          email: string | null
          id: number
          late_fee_grace_days: number
          late_fee_per_month: number
          logo_url: string | null
          payment_link: string | null
          phone: string | null
          reminder_template: string
          school_name: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          address?: string | null
          email?: string | null
          id?: number
          late_fee_grace_days?: number
          late_fee_per_month?: number
          logo_url?: string | null
          payment_link?: string | null
          phone?: string | null
          reminder_template?: string
          school_name?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          address?: string | null
          email?: string | null
          id?: number
          late_fee_grace_days?: number
          late_fee_per_month?: number
          logo_url?: string | null
          payment_link?: string | null
          phone?: string | null
          reminder_template?: string
          school_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_fees: {
        Row: {
          academic_year: string
          created_at: string
          discount: number
          due_date: string
          fee_structure_id: string | null
          id: string
          late_fee: number
          paid_amount: number
          status: Database["public"]["Enums"]["fee_status"]
          student_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          discount?: number
          due_date: string
          fee_structure_id?: string | null
          id?: string
          late_fee?: number
          paid_amount?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          discount?: number
          due_date?: string
          fee_structure_id?: string | null
          id?: string
          late_fee?: number
          paid_amount?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active: boolean
          address: string | null
          admission_no: string
          class_id: string | null
          created_at: string
          dob: string | null
          full_name: string
          gender: string | null
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string | null
          id: string
          parent_user_id: string | null
          photo_url: string | null
          roll_no: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          admission_no: string
          class_id?: string | null
          created_at?: string
          dob?: string | null
          full_name: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          parent_user_id?: string | null
          photo_url?: string | null
          roll_no?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          admission_no?: string
          class_id?: string | null
          created_at?: string
          dob?: string | null
          full_name?: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          parent_user_id?: string | null
          photo_url?: string | null
          roll_no?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          employee_no: string
          full_name: string
          id: string
          phone: string | null
          profile_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          employee_no: string
          full_name: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          employee_no?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_student: { Args: { _student_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      next_receipt_no: { Args: never; Returns: string }
      recalc_student_fee: {
        Args: { _student_fee_id: string }
        Returns: undefined
      }
      teaches_class: { Args: { _class_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent"
      attendance_status: "PRESENT" | "ABSENT" | "LATE"
      comm_channel: "EMAIL" | "SMS" | "WHATSAPP"
      comm_status: "SENT" | "FAILED" | "SKIPPED" | "PENDING"
      fee_status: "PAID" | "PARTIALLY_PAID" | "DUE"
      notice_audience: "ALL" | "PARENTS" | "TEACHERS" | "CLASS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "parent"],
      attendance_status: ["PRESENT", "ABSENT", "LATE"],
      comm_channel: ["EMAIL", "SMS", "WHATSAPP"],
      comm_status: ["SENT", "FAILED", "SKIPPED", "PENDING"],
      fee_status: ["PAID", "PARTIALLY_PAID", "DUE"],
      notice_audience: ["ALL", "PARENTS", "TEACHERS", "CLASS"],
    },
  },
} as const
