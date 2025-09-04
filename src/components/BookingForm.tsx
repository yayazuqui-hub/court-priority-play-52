import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppNotifications } from '@/hooks/useWhatsAppNotifications';
import { SystemState, PriorityQueue, Booking } from '@/hooks/useRealtimeData';

interface BookingFormProps {
  systemState: SystemState | null;
  priorityQueue: PriorityQueue[];
  bookings: Booking[];
  onBookingSuccess: () => void;
}

export function BookingForm({ systemState, priorityQueue, bookings, onBookingSuccess }: BookingFormProps) {
  const [player2Name, setPlayer2Name] = useState('');
  const [player2Level, setPlayer2Level] = useState('iniciante');
  const [player2Team, setPlayer2Team] = useState('masculino');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendBookingNotification } = useWhatsAppNotifications();

  // Verificar se usuário já tem marcação ativa
  const userActiveBooking = bookings.find(booking => booking.user_id === user?.id);
  const userHasActiveBooking = !!userActiveBooking;

  // Buscar dados do perfil do usuário e preencher dados da marcação existente
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Preencher campos se já existe marcação ativa (modo aberto)
  useEffect(() => {
    if (systemState?.is_open_for_all && userActiveBooking) {
      setPlayer2Name(userActiveBooking.player2_name || '');
      setPlayer2Level(userActiveBooking.player2_level || 'iniciante');
      setPlayer2Team(userActiveBooking.player2_team || 'masculino');
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [systemState?.is_open_for_all, userActiveBooking]);

  const canMakeBooking = () => {
    if (!systemState || !user) return false;
    
    // If open for all, anyone can book
    if (systemState.is_open_for_all) return true;
    
    // If in priority mode, check if user is in top 12 and timer is active
    if (systemState.is_priority_mode) {
      const userInQueue = priorityQueue.find(item => item.user_id === user.id);
      if (!userInQueue) return false;
      
      // Check if timer is running
      if (systemState.priority_timer_started_at) {
        const startTime = new Date(systemState.priority_timer_started_at).getTime();
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const timeLeft = Math.max(0, systemState.priority_timer_duration - elapsedSeconds);
        
        return timeLeft > 0;
      }
    }
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast({
        title: "Erro",
        description: "Dados do perfil não carregados.",
        variant: "destructive"
      });
      return;
    }

    // Só verificar marcação existente se não estiver aberto para todos
    if (!systemState?.is_open_for_all && userHasActiveBooking) {
      toast({
        title: "Não permitido",
        description: "Você já possui uma marcação ativa.",
        variant: "destructive"
      });
      return;
    }
    
    if (!canMakeBooking()) {
      toast({
        title: "Não permitido",
        description: "Você não pode fazer marcações no momento.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let error;
      
      // Se está editando uma marcação existente (modo aberto), atualizar ao invés de inserir
      if (isEditing && userActiveBooking) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            player2_name: player2Name.trim() || null,
            player2_team: player2Name.trim() ? player2Team : null,
            player2_level: player2Name.trim() ? player2Level : null,
          })
          .eq('id', userActiveBooking.id);
        error = updateError;
      } else {
        // Criar nova marcação
        const { error: insertError } = await supabase
          .from('bookings')
          .insert({
            user_id: user!.id,
            player1_name: userProfile.name,
            player2_name: player2Name.trim() || null,
            player_level: userProfile.level,
            team: userProfile.gender,
            player2_team: player2Name.trim() ? player2Team : null,
            player2_level: player2Name.trim() ? player2Level : null,
          });
        error = insertError;
      }

      if (error) {
        toast({
          title: "Erro",
          description: `Erro ao ${isEditing ? 'atualizar' : 'fazer'} a marcação. Tente novamente.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso! 🎉",
          description: `Marcação ${isEditing ? 'atualizada' : 'realizada'} com sucesso!`,
        });
        
        // Enviar notificação WhatsApp se o usuário tiver telefone
        if (userProfile.phone) {
          try {
            await sendBookingNotification(userProfile.phone, userProfile.name, isEditing);
          } catch (notificationError) {
            console.error('Erro ao enviar notificação WhatsApp:', notificationError);
            // Não falhar a operação se a notificação falhar
          }
        }
        
        if (!isEditing) {
          setPlayer2Name('');
          setPlayer2Level('iniciante');
          setPlayer2Team('masculino');
        }
        onBookingSuccess();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao fazer a marcação.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  if (userHasActiveBooking && !systemState?.is_open_for_all) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fazer Marcação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">
              ✅ Você já possui uma marcação ativa
            </p>
            <p className="text-sm text-muted-foreground">
              Aguarde o final da sessão atual para fazer uma nova marcação.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canMakeBooking()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fazer Marcação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">
              🚫 Marcações não disponíveis no momento
            </p>
            <p className="text-sm text-muted-foreground">
              {!systemState?.is_open_for_all && !systemState?.is_priority_mode
                ? 'Sistema pausado - aguarde liberação do administrador'
                : !priorityQueue.find(item => item.user_id === user?.id)
                ? 'Você não está na fila de prioridade'
                : 'Tempo esgotado para usuários prioritários'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fazer Marcação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">Carregando dados do perfil...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? 'Editar Marcação' : 'Fazer Marcação'}
          {systemState?.is_open_for_all && (
            <span className="ml-2 text-sm font-normal text-green-600">
              {isEditing ? '✏️ Editando parceiro' : '🌟 Modo Aberto'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Label className="text-sm font-medium">Seus Dados (do cadastro)</Label>
            <div className="mt-2 space-y-1">
              <p><strong>Nome:</strong> {userProfile.name}</p>
              <p><strong>Nível:</strong> {userProfile.level}</p>
              <p><strong>Gênero:</strong> {userProfile.gender}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="player2">Segundo Jogador (opcional)</Label>
            <Input
              id="player2"
              type="text"
              placeholder="Nome do segundo jogador"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco se for jogar sozinho
            </p>
          </div>

          {player2Name.trim() && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Nível do Segundo Jogador</Label>
                <RadioGroup value={player2Level} onValueChange={setPlayer2Level}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="iniciante" id="level2-iniciante" />
                    <Label htmlFor="level2-iniciante">Iniciante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediario" id="level2-intermediario" />
                    <Label htmlFor="level2-intermediario">Intermediário</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avancado" id="level2-avancado" />
                    <Label htmlFor="level2-avancado">Avançado</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Gênero do Segundo Jogador</Label>
                <RadioGroup value={player2Team} onValueChange={setPlayer2Team}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="masculino" id="team2-masculino" />
                    <Label htmlFor="team2-masculino">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feminino" id="team2-feminino" />
                    <Label htmlFor="team2-feminino">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
              ? `${isEditing ? 'Atualizando' : 'Fazendo'} marcação...` 
              : `${isEditing ? 'Atualizar' : 'Confirmar'} Marcação`
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}