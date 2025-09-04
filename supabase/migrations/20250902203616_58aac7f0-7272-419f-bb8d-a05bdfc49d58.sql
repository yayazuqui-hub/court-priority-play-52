-- Create table for PIX copy-paste codes
CREATE TABLE public.pix_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL,
  pix_code TEXT NOT NULL,
  pix_key TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual expenses (accessories, shirts, etc.)
CREATE TABLE public.user_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pix_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for pix_codes
CREATE POLICY "Everyone can view pix codes" 
ON public.pix_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage pix codes" 
ON public.pix_codes 
FOR ALL 
USING (has_admin_role(auth.uid()));

-- Create policies for user_expenses
CREATE POLICY "Users can view their own expenses" 
ON public.user_expenses 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own expenses" 
ON public.user_expenses 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own expenses" 
ON public.user_expenses 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own expenses" 
ON public.user_expenses 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pix_codes_updated_at
BEFORE UPDATE ON public.pix_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_expenses_updated_at
BEFORE UPDATE ON public.user_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();