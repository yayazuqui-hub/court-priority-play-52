-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.has_admin_role(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.auto_add_to_priority_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  queue_count INTEGER;
  next_position INTEGER;
BEGIN
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
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;