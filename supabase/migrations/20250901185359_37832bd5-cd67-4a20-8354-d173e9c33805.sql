-- Create user_stats table to track user progress and victories
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  victories INTEGER DEFAULT 0 CHECK (victories >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats table
CREATE POLICY "Users can view their own stats" 
ON public.user_stats 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stats" 
ON public.user_stats 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stats" 
ON public.user_stats 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all stats" 
ON public.user_stats 
FOR SELECT 
USING (has_admin_role(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for user_stats
ALTER TABLE public.user_stats REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.user_stats;