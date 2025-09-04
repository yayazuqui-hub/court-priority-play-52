-- Create payments table to track court payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_total_value DECIMAL(10,2) NOT NULL,
  individual_value DECIMAL(10,2) NOT NULL,
  created_by UUID NOT NULL,
  game_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_users table to track individual payments
CREATE TABLE public.payment_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pix', 'cash', null)),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_users ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Everyone can view payments" 
ON public.payments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage payments" 
ON public.payments 
FOR ALL 
USING (has_admin_role(auth.uid()));

-- Policies for payment_users table
CREATE POLICY "Everyone can view payment users" 
ON public.payment_users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own payment status" 
ON public.payment_users 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage payment users" 
ON public.payment_users 
FOR ALL 
USING (has_admin_role(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_users_updated_at
BEFORE UPDATE ON public.payment_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();