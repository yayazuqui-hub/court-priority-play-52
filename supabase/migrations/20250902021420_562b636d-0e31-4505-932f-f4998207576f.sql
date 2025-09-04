-- Create helper function to check if priority mode is active
CREATE OR REPLACE FUNCTION public.is_priority_mode_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT is_priority_mode
      FROM public.system_state
      ORDER BY created_at DESC
      LIMIT 1
    ), false
  );
$$;

-- Update RLS policy to block inserts when system is paused (i.e., not in priority mode)
DROP POLICY IF EXISTS "Users can insert themselves into priority queue" ON public.priority_queue;

CREATE POLICY "Users can insert into priority queue when active"
ON public.priority_queue
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_priority_mode_active()
);
