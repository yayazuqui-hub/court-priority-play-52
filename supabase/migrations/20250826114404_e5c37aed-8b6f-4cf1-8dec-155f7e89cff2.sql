-- Update profiles table to use email instead of phone
ALTER TABLE public.profiles DROP COLUMN phone;
ALTER TABLE public.profiles ADD COLUMN email TEXT NOT NULL UNIQUE;

-- Update all existing displays and references
COMMENT ON COLUMN public.profiles.email IS 'User email address for authentication and contact';