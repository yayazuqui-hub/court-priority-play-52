-- Create admin user profile if it doesn't exist
-- Using a fixed UUID for this admin user
INSERT INTO public.profiles (id, user_id, name, email)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001', 
  'Administrador',
  'ptairone95@gmail.com'
) ON CONFLICT (email) DO NOTHING;

-- Add admin role for the user
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'ptairone95@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;