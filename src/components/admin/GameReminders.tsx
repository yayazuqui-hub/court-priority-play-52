import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppNotifications } from '@/hooks/useWhatsAppNotifications';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Send, Settings } from 'lucide-react';

export function GameReminders() {
  const [selectedGameId, setSelectedGameId] = useState('');
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [groupChatId, setGroupChatId] = useState('');
  const [idInstance, setIdInstance] = useState('');
  const [apiToken, setApiToken] = useState('');
  const { toast } = useToast();
  const { sendGameReminderNotification, sendGroupGameReminderNotification } = useWhatsAppNotifications();

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

      const gameDate = format(parseISO(selectedGame.game_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const gameTime = selectedGame.game_time;

      // Verificar se é para enviar para grupo ou contatos individuais
      if (groupChatId.trim()) {
        // Enviar para grupo específico
        await sendGroupGameReminderNotification(
          groupChatId.trim(),
          selectedGame.title,
          gameDate,
          gameTime,
          selectedGame.location,
          idInstance.trim() || undefined,
          apiToken.trim() || undefined
        );

        toast({
          title: "Lembrete enviado!",
          description: "Lembrete enviado para o grupo WhatsApp com sucesso",
        });
      } else {
        // Enviar para contatos individuais (comportamento original)
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
      }

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

        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4" />
            <Label className="text-sm font-medium">Configurações WhatsApp</Label>
          </div>
          
          <div>
            <Label htmlFor="group-chat-id" className="text-sm">ID do Grupo WhatsApp (Opcional)</Label>
            <Input
              id="group-chat-id"
              type="text"
              value={groupChatId}
              onChange={(e) => setGroupChatId(e.target.value)}
              placeholder="Ex: 120363123456789012@g.us"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se preenchido, enviará apenas para este grupo. Caso contrário, enviará para todos os usuários individualmente.
            </p>
          </div>

          <div>
            <Label htmlFor="id-instance" className="text-sm">ID Instance Green API (Opcional)</Label>
            <Input
              id="id-instance"
              type="text"
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              placeholder="Ex: 1101234567"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="api-token" className="text-sm">API Token Green API (Opcional)</Label>
            <Input
              id="api-token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Digite o token da API"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se não preenchidos, usará as credenciais padrão configuradas no sistema.
            </p>
          </div>
        </div>

        <Button
          onClick={sendReminders}
          disabled={loading || !selectedGameId}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Enviando lembretes...' : 'Enviar Lembretes WhatsApp'}
        </Button>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>Grupo:</strong> Cole o ID do grupo WhatsApp para enviar apenas para ele</p>
          <p>• <strong>Individual:</strong> Deixe vazio para enviar para todos os usuários cadastrados</p>
          <p>• <strong>Formato telefone:</strong> 5511999999999 (código país + DDD + número)</p>
        </div>
      </CardContent>
    </Card>
  );
}