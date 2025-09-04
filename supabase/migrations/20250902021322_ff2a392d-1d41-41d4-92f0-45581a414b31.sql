-- Update the auto_add_to_priority_queue function to respect system state
CREATE OR REPLACE FUNCTION public.auto_add_to_priority_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  queue_count INTEGER;
  next_position INTEGER;
  system_is_priority BOOLEAN;
  system_is_paused BOOLEAN;
BEGIN
  -- Check if system is in priority mode and not paused
  SELECT is_priority_mode, NOT (is_open_for_all OR is_priority_mode) 
  INTO system_is_priority, system_is_paused
  FROM public.system_state 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Only add to queue if system is in priority mode and not paused
  IF system_is_priority AND NOT system_is_paused THEN
    -- Check current queue size
    SELECT COUNT(*) INTO queue_count FROM public.priority_queue;
    
    -- Only add if queue has less than 12 people
    IF queue_count < 12 THEN
      -- Get next position
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_position FROM public.priority_queue;
      
      -- Add user to priority queue
      INSERT INTO public.priority_queue (user_id, position)
      VALUES (NEW.user_id, next_position);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;