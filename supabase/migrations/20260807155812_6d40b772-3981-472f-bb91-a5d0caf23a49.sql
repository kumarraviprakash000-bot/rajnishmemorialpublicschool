
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.teaches_class(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalc_student_fee(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payments_after_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_receipt_no() FROM anon;

UPDATE public.school_settings SET academic_year = '2026-27' WHERE id = 1;

-- ============ CLASSES ============
INSERT INTO public.classes (grade, section, academic_year)
SELECT g::text, s, '2026-27'
FROM generate_series(1,8) g
CROSS JOIN unnest(ARRAY['A','B']) s
WHERE NOT (g > 5 AND s = 'B');

INSERT INTO public.subjects (name) VALUES
 ('English'),('Hindi'),('Mathematics'),('Science'),('Social Science'),('Computer'),('Drawing');

-- ============ TEACHERS ============
INSERT INTO public.teachers (employee_no, full_name, email, phone, subject) VALUES
 ('EMP001','Sunita Sharma','sunita.sharma@rmps.edu.in','+919812345601','Mathematics'),
 ('EMP002','Ramesh Verma','teacher@rmps.edu.in','+919812345602','Science'),
 ('EMP003','Anita Singh','anita.singh@rmps.edu.in','+919812345603','English'),
 ('EMP004','Pankaj Mishra','pankaj.mishra@rmps.edu.in','+919812345604','Hindi'),
 ('EMP005','Kavita Rani','kavita.rani@rmps.edu.in','+919812345605','Social Science'),
 ('EMP006','Deepak Kumar','deepak.kumar@rmps.edu.in','+919812345606','Computer');

-- assign each class a teacher round-robin; Ramesh (demo teacher) gets 5-A and 5-B
INSERT INTO public.class_teachers (class_id, teacher_id, is_class_teacher)
SELECT c.id, t.id, true
FROM (SELECT id, row_number() OVER (ORDER BY grade::int, section) rn FROM public.classes) c
JOIN (SELECT id, row_number() OVER (ORDER BY employee_no) rn FROM public.teachers) t
  ON t.rn = ((c.rn - 1) % 6) + 1;

INSERT INTO public.class_teachers (class_id, teacher_id, is_class_teacher)
SELECT c.id, (SELECT id FROM public.teachers WHERE employee_no='EMP002'), false
FROM public.classes c WHERE c.grade IN ('5') 
ON CONFLICT (class_id, teacher_id) DO NOTHING;

-- ============ FEE STRUCTURES ============
INSERT INTO public.fee_structures (class_id, academic_year, tuition_fee, annual_fee, transport_fee, other_fee, due_date, late_fee_per_month)
SELECT id, '2026-27',
  18000 + (grade::int * 1500),
  6000, 8000, 1500,
  DATE '2026-08-15', 200
FROM public.classes;

-- ============ STUDENTS ============
DO $$
DECLARE
  names text[] := ARRAY['Rahul Kumar','Priya Sharma','Aman Verma','Sneha Gupta','Rohit Singh','Ananya Mishra',
    'Karan Yadav','Ishita Jha','Vikas Ranjan','Neha Kumari','Aditya Raj','Pooja Devi','Sourav Das','Riya Sinha',
    'Manish Tiwari','Kajal Kumari','Nitin Pandey','Shreya Roy','Abhishek Jha','Divya Singh','Harsh Gupta',
    'Simran Kaur','Ravi Shankar','Meera Nair','Arjun Prasad','Tanya Bhatt','Gaurav Kumar','Nisha Rani',
    'Sanjay Thakur','Payal Agarwal','Vivek Chauhan','Ritika Sahu','Mohit Anand','Swati Dubey','Akash Bose',
    'Preeti Yadav','Rajat Kapoor','Sonal Mehta','Amit Ranjan','Kritika Rao'];
  guardians text[] := ARRAY['Suresh Kumar','Rakesh Sharma','Mahesh Verma','Dinesh Gupta','Umesh Singh','Naresh Mishra'];
  cls record; i int := 1; n int; sid uuid; g int;
BEGIN
  FOR cls IN SELECT id, grade, section FROM public.classes ORDER BY grade::int, section LOOP
    FOR n IN 1..4 LOOP
      EXIT WHEN i > array_length(names,1);
      g := ((i - 1) % 6) + 1;
      INSERT INTO public.students (admission_no, full_name, class_id, roll_no, dob, gender, address,
        guardian_name, guardian_phone, guardian_email, active)
      VALUES (
        'RMPS' || lpad(i::text, 4, '0'),
        names[i], cls.id, n,
        DATE '2012-01-01' + ((i * 37) % 1400),
        CASE WHEN i % 2 = 0 THEN 'Female' ELSE 'Male' END,
        'House No. ' || (10 + i) || ', Ward ' || (1 + (i % 12)) || ', Muzaffarpur, Bihar',
        guardians[g],
        '+9198' || lpad((11000000 + i * 137)::text, 8, '0'),
        CASE WHEN i = 1 THEN 'parent@rmps.edu.in'
             ELSE lower(replace(split_part(names[i],' ',1),'''','')) || i || '@example.com' END,
        true
      ) RETURNING id INTO sid;
      i := i + 1;
    END LOOP;
  END LOOP;
END $$;

-- ============ STUDENT FEES ============
INSERT INTO public.student_fees (student_id, fee_structure_id, academic_year, total_amount, discount, late_fee, due_date)
SELECT s.id, fs.id, '2026-27',
  fs.tuition_fee + fs.annual_fee + fs.transport_fee + fs.other_fee,
  CASE WHEN (s.roll_no = 1) THEN 2000 ELSE 0 END,
  0, fs.due_date
FROM public.students s
JOIN public.fee_structures fs ON fs.class_id = s.class_id AND fs.academic_year = '2026-27';

-- Rahul Kumar demo figures: total 35,000 / paid 25,000
UPDATE public.student_fees sf SET total_amount = 35000, discount = 0
FROM public.students s WHERE s.id = sf.student_id AND s.admission_no = 'RMPS0001';

-- ============ PAYMENTS ============
DO $$
DECLARE r record; payable numeric; amt numeric; k int := 0;
BEGIN
  FOR r IN
    SELECT sf.id, sf.student_id, sf.total_amount, sf.discount, s.admission_no
    FROM public.student_fees sf JOIN public.students s ON s.id = sf.student_id
    ORDER BY s.admission_no
  LOOP
    k := k + 1;
    payable := r.total_amount - r.discount;
    IF r.admission_no = 'RMPS0001' THEN
      INSERT INTO public.payments (student_fee_id, student_id, receipt_no, amount, method, paid_on, note)
      VALUES (r.id, r.student_id, public.next_receipt_no(), 15000, 'UPI', DATE '2026-05-12', 'First instalment'),
             (r.id, r.student_id, public.next_receipt_no(), 10000, 'CASH', DATE '2026-07-04', 'Second instalment');
    ELSIF k % 3 = 0 THEN
      INSERT INTO public.payments (student_fee_id, student_id, receipt_no, amount, method, paid_on, note)
      VALUES (r.id, r.student_id, public.next_receipt_no(), payable, 
        (ARRAY['CASH','UPI','BANK_TRANSFER','CHEQUE'])[1 + (k % 4)],
        DATE '2026-04-10' + (k * 3), 'Full session fee');
    ELSIF k % 3 = 1 THEN
      amt := round(payable * 0.5);
      INSERT INTO public.payments (student_fee_id, student_id, receipt_no, amount, method, paid_on, note)
      VALUES (r.id, r.student_id, public.next_receipt_no(), amt,
        (ARRAY['CASH','UPI','BANK_TRANSFER','CHEQUE'])[1 + (k % 4)],
        DATE '2026-05-05' + (k * 2), 'Part payment');
    END IF;
  END LOOP;
END $$;

-- ============ ATTENDANCE (last 20 weekdays) ============
DO $$
DECLARE d date; s record; i int; st public.attendance_status;
BEGIN
  FOR i IN 0..27 LOOP
    d := CURRENT_DATE - i;
    CONTINUE WHEN extract(dow from d) IN (0);
    FOR s IN SELECT id, class_id, roll_no FROM public.students LOOP
      st := CASE
        WHEN ((i * 7 + s.roll_no * 13 + extract(day from d)::int) % 11) = 0 THEN 'ABSENT'
        WHEN ((i * 5 + s.roll_no * 3 + extract(day from d)::int) % 17) = 0 THEN 'LATE'
        ELSE 'PRESENT' END::public.attendance_status;
      INSERT INTO public.attendance (student_id, class_id, date, status)
      VALUES (s.id, s.class_id, d, st) ON CONFLICT (student_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============ NOTICES ============
INSERT INTO public.notices (title, body, notice_date, expiry_date, is_important, audience) VALUES
 ('School closed due to heavy rain','Due to heavy rain, the school will remain closed on 15 August. School will reopen on 16 August. Parents are requested to ensure the safety of their children.', CURRENT_DATE, CURRENT_DATE + 20, true, 'ALL'),
 ('Fee payment deadline — 15 August','All parents are requested to clear the pending session fee before 15 August 2026. A late fee of ₹200 per month will apply after the due date.', CURRENT_DATE - 2, CURRENT_DATE + 30, true, 'PARENTS'),
 ('Annual Sports Day','The Annual Sports Day will be held on 12 September in the school ground. All students must report by 8:00 AM in sports uniform.', CURRENT_DATE - 5, CURRENT_DATE + 45, false, 'ALL'),
 ('Staff meeting on Saturday','All teaching staff are required to attend the monthly review meeting on Saturday at 2:00 PM in the conference hall.', CURRENT_DATE - 3, CURRENT_DATE + 10, false, 'TEACHERS'),
 ('Half-Yearly Exam datesheet released','The half-yearly examination datesheet has been published. Please check the school calendar for subject-wise schedule.', CURRENT_DATE - 7, CURRENT_DATE + 40, false, 'ALL');

-- ============ HOMEWORK ============
INSERT INTO public.homework (class_id, subject, title, description, assigned_date, due_date)
SELECT c.id, s.subject, s.title, s.descr, CURRENT_DATE - s.off, CURRENT_DATE - s.off + 3
FROM public.classes c
CROSS JOIN (VALUES
  ('Mathematics','Chapter 4 — Fractions','Solve exercise 4.2, questions 1 to 12 in the classwork notebook.',1),
  ('English','Essay writing','Write a 200-word essay on "My Favourite Festival".',2),
  ('Science','Plants and photosynthesis','Read chapter 6 and draw a labelled diagram of a leaf.',3)
) AS s(subject, title, descr, off);

-- ============ EXAMS & MARKS ============
INSERT INTO public.exams (name, class_id, start_date, end_date, published)
SELECT 'Half-Yearly Examination 2026', id, DATE '2026-07-06', DATE '2026-07-15', true FROM public.classes;

INSERT INTO public.marks (exam_id, student_id, subject_name, marks_obtained, max_marks, grade)
SELECT e.id, s.id, sub.name,
  m.score, 100,
  CASE WHEN m.score >= 90 THEN 'A+' WHEN m.score >= 80 THEN 'A' WHEN m.score >= 70 THEN 'B+'
       WHEN m.score >= 60 THEN 'B' WHEN m.score >= 50 THEN 'C' WHEN m.score >= 33 THEN 'D' ELSE 'E' END
FROM public.students s
JOIN public.exams e ON e.class_id = s.class_id
CROSS JOIN (SELECT name, row_number() OVER (ORDER BY name) rn FROM public.subjects WHERE name <> 'Drawing') sub
CROSS JOIN LATERAL (SELECT 45 + ((abs(hashtext(s.admission_no || sub.name)) % 51))::numeric AS score) m;

-- ============ CALENDAR ============
INSERT INTO public.calendar_events (title, description, event_date, end_date, event_type) VALUES
 ('Independence Day','Flag hoisting at 8:00 AM followed by cultural programme.', DATE '2026-08-15', NULL, 'HOLIDAY'),
 ('Parent-Teacher Meeting','Class-wise PTM from 10:00 AM to 1:00 PM.', DATE '2026-08-22', NULL, 'MEETING'),
 ('Annual Sports Day','Inter-house athletics meet at the school ground.', DATE '2026-09-12', NULL, 'EVENT'),
 ('Unit Test II','Unit test for all classes.', DATE '2026-09-21', DATE '2026-09-25', 'EXAM'),
 ('Dussehra Break','School remains closed for Dussehra vacation.', DATE '2026-10-17', DATE '2026-10-23', 'HOLIDAY'),
 ('Diwali Break','School remains closed for Diwali.', DATE '2026-11-07', DATE '2026-11-11', 'HOLIDAY');
