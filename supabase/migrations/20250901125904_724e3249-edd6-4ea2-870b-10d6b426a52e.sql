-- Add level column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN level text;

-- Add constraint to ensure only valid levels are allowed
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_levels CHECK (level IN ('iniciante', 'intermediario', 'avancado'));