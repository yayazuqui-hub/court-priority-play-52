-- Add separate fields for second player's team and level
ALTER TABLE public.bookings 
ADD COLUMN player2_team text,
ADD COLUMN player2_level text;