
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','teacher','parent');
CREATE TYPE public.fee_status AS ENUM ('PAID','PARTIALLY_PAID','DUE');
CREATE TYPE public.attendance_status AS ENUM ('PRESENT','ABSENT','LATE');
CREATE TYPE public.notice_audience AS ENUM ('ALL','PARENTS','TEACHERS','CLASS');
CREATE TYPE public.comm_channel AS ENUM ('EMAIL','SMS','WHATSAPP');
CREATE TYPE public.comm_status AS ENUM ('SENT','FAILED','SKIPPED','PENDING');

-- ============ UTIL ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- ============ ACADEMIC STRUCTURE ============
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL DEFAULT '2025-26',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade, section, academic_year)
);
GRANT SELECT ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_read_all" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_admin_write" ON public.classes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.classes TO authenticated;

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read_all" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid,
  employee_no text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  subject text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  is_class_teacher boolean NOT NULL DEFAULT false,
  UNIQUE (class_id, teacher_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_teachers TO authenticated;
GRANT ALL ON public.class_teachers TO service_role;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.teaches_class(_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_teachers ct
    JOIN public.teachers t ON t.id = ct.teacher_id
    WHERE ct.class_id = _class_id AND t.profile_id = auth.uid()
  );
$$;

CREATE POLICY "teachers_read" ON public.teachers FOR SELECT TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid() OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "teachers_admin_write" ON public.teachers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "class_teachers_read" ON public.class_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "class_teachers_admin_write" ON public.class_teachers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ STUDENTS ============
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no text NOT NULL UNIQUE,
  full_name text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  roll_no int,
  dob date,
  gender text,
  photo_url text,
  address text,
  guardian_name text NOT NULL DEFAULT '',
  guardian_phone text,
  guardian_email text,
  parent_user_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_students_parent ON public.students(parent_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.can_view_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = _student_id
      AND (
        public.has_role(auth.uid(),'admin')
        OR s.parent_user_id = auth.uid()
        OR public.teaches_class(s.class_id)
      )
  );
$$;

CREATE POLICY "students_read_scoped" ON public.students FOR SELECT TO authenticated
  USING (public.is_admin() OR parent_user_id = auth.uid() OR public.teaches_class(class_id));
CREATE POLICY "students_admin_write" ON public.students FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ FEES ============
CREATE TABLE public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year text NOT NULL DEFAULT '2025-26',
  tuition_fee numeric(12,2) NOT NULL DEFAULT 0,
  annual_fee numeric(12,2) NOT NULL DEFAULT 0,
  transport_fee numeric(12,2) NOT NULL DEFAULT 0,
  other_fee numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  late_fee_per_month numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, academic_year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_structures TO authenticated;
GRANT ALL ON public.fee_structures TO service_role;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee_structures_read" ON public.fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "fee_structures_admin_write" ON public.fee_structures FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_fs_updated BEFORE UPDATE ON public.fee_structures
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.student_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id uuid REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  academic_year text NOT NULL DEFAULT '2025-26',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  late_fee numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status public.fee_status NOT NULL DEFAULT 'DUE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year)
);
CREATE INDEX idx_student_fees_student ON public.student_fees(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_fees TO authenticated;
GRANT ALL ON public.student_fees TO service_role;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_fees_read_scoped" ON public.student_fees FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "student_fees_admin_write" ON public.student_fees FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_sf_updated BEFORE UPDATE ON public.student_fees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_id uuid NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receipt_no text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'CASH',
  reference text,
  note text,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_student ON public.payments(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_read_scoped" ON public.payments FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "payments_admin_write" ON public.payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- receipt number generator
CREATE SEQUENCE IF NOT EXISTS public.receipt_seq START 1001;
CREATE OR REPLACE FUNCTION public.next_receipt_no() RETURNS text
LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'RMPS/' || to_char(now(),'YYYY') || '/' || lpad(nextval('public.receipt_seq')::text, 5, '0');
$$;

-- keep student_fees in sync with payments
CREATE OR REPLACE FUNCTION public.recalc_student_fee(_student_fee_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_paid numeric; v_row public.student_fees%ROWTYPE; v_payable numeric;
BEGIN
  SELECT * INTO v_row FROM public.student_fees WHERE id = _student_fee_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM public.payments WHERE student_fee_id = _student_fee_id;
  v_payable := GREATEST(v_row.total_amount - v_row.discount + v_row.late_fee, 0);
  UPDATE public.student_fees SET
    paid_amount = v_paid,
    status = CASE
      WHEN v_paid >= v_payable AND v_payable > 0 THEN 'PAID'::public.fee_status
      WHEN v_paid > 0 THEN 'PARTIALLY_PAID'::public.fee_status
      ELSE 'DUE'::public.fee_status END,
    updated_at = now()
  WHERE id = _student_fee_id;
END; $$;

CREATE OR REPLACE FUNCTION public.payments_after_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM public.recalc_student_fee(OLD.student_fee_id); RETURN OLD; END IF;
  PERFORM public.recalc_student_fee(NEW.student_fee_id);
  IF TG_OP = 'UPDATE' AND OLD.student_fee_id <> NEW.student_fee_id THEN
    PERFORM public.recalc_student_fee(OLD.student_fee_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_payments_sync AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_after_change();

CREATE OR REPLACE FUNCTION public.student_fees_before_write() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_payable numeric;
BEGIN
  v_payable := GREATEST(NEW.total_amount - NEW.discount + NEW.late_fee, 0);
  NEW.status := CASE
    WHEN NEW.paid_amount >= v_payable AND v_payable > 0 THEN 'PAID'::public.fee_status
    WHEN NEW.paid_amount > 0 THEN 'PARTIALLY_PAID'::public.fee_status
    ELSE 'DUE'::public.fee_status END;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_sf_status BEFORE INSERT OR UPDATE ON public.student_fees
FOR EACH ROW EXECUTE FUNCTION public.student_fees_before_write();

-- ============ NOTICES ============
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  notice_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  is_important boolean NOT NULL DEFAULT false,
  audience public.notice_audience NOT NULL DEFAULT 'ALL',
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  attachment_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_read" ON public.notices FOR SELECT TO authenticated USING (
  public.is_admin()
  OR audience = 'ALL'
  OR (audience = 'TEACHERS' AND public.has_role(auth.uid(),'teacher'))
  OR (audience = 'PARENTS' AND public.has_role(auth.uid(),'parent'))
  OR (audience = 'CLASS' AND (
        public.teaches_class(class_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = notices.class_id AND s.parent_user_id = auth.uid())
     ))
);
CREATE POLICY "notices_admin_write" ON public.notices FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_notices_updated BEFORE UPDATE ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'PRESENT',
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
CREATE INDEX idx_attendance_date ON public.attendance(date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_read_scoped" ON public.attendance FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "attendance_write" ON public.attendance FOR ALL TO authenticated
  USING (public.is_admin() OR public.teaches_class(class_id))
  WITH CHECK (public.is_admin() OR public.teaches_class(class_id));

-- ============ HOMEWORK ============
CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  attachment_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homework_read_scoped" ON public.homework FOR SELECT TO authenticated USING (
  public.is_admin() OR public.teaches_class(class_id)
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = homework.class_id AND s.parent_user_id = auth.uid())
);
CREATE POLICY "homework_write" ON public.homework FOR ALL TO authenticated
  USING (public.is_admin() OR public.teaches_class(class_id))
  WITH CHECK (public.is_admin() OR public.teaches_class(class_id));

-- ============ EXAMS / MARKS ============
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams_read" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_write" ON public.exams FOR ALL TO authenticated
  USING (public.is_admin() OR public.teaches_class(class_id))
  WITH CHECK (public.is_admin() OR public.teaches_class(class_id));

CREATE TABLE public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name text NOT NULL,
  marks_obtained numeric(6,2) NOT NULL DEFAULT 0,
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id, subject_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marks TO authenticated;
GRANT ALL ON public.marks TO service_role;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marks_read_scoped" ON public.marks FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "marks_write" ON public.marks FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = marks.student_id AND public.teaches_class(s.class_id)))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = marks.student_id AND public.teaches_class(s.class_id)));

-- ============ CALENDAR ============
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  end_date date,
  event_type text NOT NULL DEFAULT 'EVENT',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_read" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_admin_write" ON public.calendar_events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'GENERAL',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_admin_write" ON public.notifications FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ COMMUNICATION LOGS ============
CREATE TABLE public.communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  student_name text,
  parent_name text,
  recipient text,
  channel public.comm_channel NOT NULL DEFAULT 'EMAIL',
  message text NOT NULL DEFAULT '',
  status public.comm_status NOT NULL DEFAULT 'PENDING',
  error text,
  amount numeric(12,2),
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT ON public.communication_logs TO authenticated;
GRANT ALL ON public.communication_logs TO service_role;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_logs_admin_read" ON public.communication_logs FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============ SETTINGS ============
CREATE TABLE public.school_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  school_name text NOT NULL DEFAULT 'Rajnish Memorial Public School',
  logo_url text,
  address text,
  phone text,
  email text,
  academic_year text NOT NULL DEFAULT '2025-26',
  late_fee_per_month numeric(12,2) NOT NULL DEFAULT 200,
  late_fee_grace_days int NOT NULL DEFAULT 7,
  payment_link text,
  reminder_template text NOT NULL DEFAULT '{{school}}: Dear Parent, ₹{{amount}} fee is pending for {{student}}, Class {{class}}. Please clear the outstanding fee by {{due_date}}. Thank you.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.school_settings TO authenticated;
GRANT ALL ON public.school_settings TO service_role;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read" ON public.school_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.school_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.school_settings (id, address, phone, email)
VALUES (1, 'Station Road, Muzaffarpur, Bihar 842001', '+91 98765 43210', 'office@rmps.edu.in');
