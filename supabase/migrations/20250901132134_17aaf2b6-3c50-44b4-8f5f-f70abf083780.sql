-- Add level and team columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN player_level text,
ADD COLUMN team text;

-- Add constraints to ensure only valid values are allowed
ALTER TABLE public.bookings 
ADD CONSTRAINT valid_player_levels CHECK (player_level IN ('iniciante', 'intermediario', 'avancado')),
ADD CONSTRAINT valid_teams CHECK (team IN ('feminino', 'masculino'));