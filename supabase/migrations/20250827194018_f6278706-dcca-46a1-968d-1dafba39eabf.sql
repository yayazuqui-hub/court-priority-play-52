-- Add gender column to profiles table
ALTER TABLE public.profiles ADD COLUMN gender text CHECK (gender IN ('masculino', 'feminino'));

-- Update system_state default timer to 24 hours (86400 seconds)
UPDATE public.system_state SET priority_timer_duration = 86400;