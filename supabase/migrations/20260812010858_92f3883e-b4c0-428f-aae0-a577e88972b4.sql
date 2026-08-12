ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS previous_pending_fee numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.student_fees_before_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_payable numeric;
BEGIN
  v_payable := GREATEST(NEW.total_amount - NEW.discount + NEW.late_fee + COALESCE(NEW.previous_pending_fee,0), 0);
  NEW.status := CASE
    WHEN NEW.paid_amount >= v_payable AND v_payable > 0 THEN 'PAID'::public.fee_status
    WHEN NEW.paid_amount > 0 THEN 'PARTIALLY_PAID'::public.fee_status
    ELSE 'DUE'::public.fee_status END;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.recalc_student_fee(_student_fee_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_paid numeric; v_row public.student_fees%ROWTYPE; v_payable numeric;
BEGIN
  SELECT * INTO v_row FROM public.student_fees WHERE id = _student_fee_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM public.payments WHERE student_fee_id = _student_fee_id;
  v_payable := GREATEST(v_row.total_amount - v_row.discount + v_row.late_fee + COALESCE(v_row.previous_pending_fee,0), 0);
  UPDATE public.student_fees SET
    paid_amount = v_paid,
    status = CASE
      WHEN v_paid >= v_payable AND v_payable > 0 THEN 'PAID'::public.fee_status
      WHEN v_paid > 0 THEN 'PARTIALLY_PAID'::public.fee_status
      ELSE 'DUE'::public.fee_status END,
    updated_at = now()
  WHERE id = _student_fee_id;
END; $function$;