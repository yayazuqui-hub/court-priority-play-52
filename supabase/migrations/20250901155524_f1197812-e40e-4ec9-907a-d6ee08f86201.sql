-- Permitir que user_id seja null na tabela bookings para marcações manuais
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;