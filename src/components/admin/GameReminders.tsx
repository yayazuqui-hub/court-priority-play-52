import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppNotifications } from '@/hooks/useWhatsAppNotifications';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Send } from 'lucide-react';

export function GameReminders() {
  const [selectedGameId, setSelectedGameId] = useState('');
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendGameReminderNotification } = useWhatsAppNotifications();

  // Buscar jogos agendados
  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games_schedule')
      .select('*')
      .gte('game_date', new Date().toISOString().split('T')[0])
      .order('game_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar jogos:', error);
    } else {
      setGames(data || []);
    }
  };

  // Carregar jogos ao montar o componente
  useState(() => {
    fetchGames();
  });

  const sendReminders = async () => {
    if (!selectedGameId) {
      toast({
        title: "Erro",
        description: "Selecione um jogo para enviar lembretes",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar dados do jogo selecionado
      const selectedGame = games.find(g => g.id === selectedGameId);
      if (!selectedGame) {
        throw new Error('Jogo não encontrado');
      }

      // Buscar todos os perfis com telefone
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('phone, name')
        .not('phone', 'is', null);

      if (profilesError) {
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum usuário com telefone cadastrado encontrado",
          variant: "destructive"
        });
        return;
      }

      const phones = profiles.map(p => p.phone).filter(Boolean);
      
      if (phones.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum telefone válido encontrado",
          variant: "destructive"
        });
        return;
      }

      // Formatar dados do jogo
      const gameDate = format(parseISO(selectedGame.game_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const gameTime = selectedGame.game_time;

      // Enviar notificações
      await sendGameReminderNotification(
        phones,
        selectedGame.title,
        gameDate,
        gameTime,
        selectedGame.location
      );

      toast({
        title: "Lembretes enviados!",
        description: `${phones.length} lembretes WhatsApp enviados com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao enviar lembretes:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar lembretes. Tente novamente.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Lembretes de Jogos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="game-select">Selecionar Jogo</Label>
          <select
            id="game-select"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">Selecione um jogo</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title} - {format(parseISO(game.game_date), "dd/MM/yyyy")} às {game.game_time}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={sendReminders}
          disabled={loading || !selectedGameId}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Enviando lembretes...' : 'Enviar Lembretes WhatsApp'}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>• Lembretes serão enviados para todos os usuários com telefone cadastrado</p>
          <p>• Certifique-se de que os números estão no formato correto (ex: 5511999999999)</p>
        </div>
      </CardContent>
    </Card>
  );
}