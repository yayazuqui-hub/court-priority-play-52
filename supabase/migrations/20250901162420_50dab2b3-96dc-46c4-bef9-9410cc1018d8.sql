-- Add end_time column to games_schedule table
ALTER TABLE public.games_schedule 
ADD COLUMN end_time time without time zone;