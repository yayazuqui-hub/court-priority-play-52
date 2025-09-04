-- Add current authenticated user as admin
INSERT INTO user_roles (user_id, role) 
SELECT auth.uid(), 'admin'::app_role 
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
);