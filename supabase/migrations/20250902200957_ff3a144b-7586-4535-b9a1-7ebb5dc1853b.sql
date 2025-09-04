-- Create the update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for automatic schedule configuration
CREATE TABLE public.auto_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.auto_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage auto schedule" 
ON public.auto_schedule 
FOR ALL 
USING (has_admin_role(auth.uid()));

CREATE POLICY "Everyone can view auto schedule" 
ON public.auto_schedule 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_auto_schedule_updated_at
BEFORE UPDATE ON public.auto_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_auto_schedule_day_time ON public.auto_schedule(day_of_week, start_time) WHERE is_active = true;