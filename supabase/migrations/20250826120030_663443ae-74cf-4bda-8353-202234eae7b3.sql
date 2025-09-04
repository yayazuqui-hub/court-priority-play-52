-- Create games_schedule table for admin to manage game events
CREATE TABLE public.games_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  game_date DATE NOT NULL,
  game_time TIME NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.games_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view games schedule" 
ON public.games_schedule 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage games schedule" 
ON public.games_schedule 
FOR ALL 
USING (has_admin_role(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_games_schedule_updated_at
BEFORE UPDATE ON public.games_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();