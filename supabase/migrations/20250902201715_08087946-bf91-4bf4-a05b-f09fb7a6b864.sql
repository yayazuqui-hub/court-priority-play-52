-- Update system state to use 24 hours (86400 seconds) instead of 10 minutes
UPDATE public.system_state 
SET priority_timer_duration = 86400 
WHERE priority_timer_duration = 600;

-- Add timestamp column to priority queue to track when user was added
ALTER TABLE public.priority_queue 
ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to have added_at as created_at
UPDATE public.priority_queue 
SET added_at = created_at 
WHERE added_at IS NULL;