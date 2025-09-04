-- Adicionar suporte a jogos recorrentes por dia da semana
ALTER TABLE public.games_schedule 
ADD COLUMN day_of_week integer,
ADD COLUMN is_recurring boolean DEFAULT false;

-- Permitir que game_date seja nullable para jogos recorrentes
ALTER TABLE public.games_schedule 
ALTER COLUMN game_date DROP NOT NULL;

-- Comentário para explicar a estrutura
COMMENT ON COLUMN public.games_schedule.day_of_week IS 'Dia da semana para jogos recorrentes (0=Domingo, 1=Segunda, etc.)';
COMMENT ON COLUMN public.games_schedule.is_recurring IS 'Se true, o jogo acontece toda semana no day_of_week especificado';
COMMENT ON COLUMN public.games_schedule.game_date IS 'Data específica do jogo (para jogos únicos) ou null para jogos recorrentes';