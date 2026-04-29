
-- Email send log table for daily task reminder emails (idempotency + history)
CREATE TABLE public.email_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  send_date DATE NOT NULL,
  task_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT email_send_log_status_check CHECK (status IN ('sent','failed','skipped')),
  CONSTRAINT email_send_log_unique UNIQUE (email_type, recipient_email, send_date)
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email send log"
  ON public.email_send_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_send_log_date ON public.email_send_log (send_date DESC);
