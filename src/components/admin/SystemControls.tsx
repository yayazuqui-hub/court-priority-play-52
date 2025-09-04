import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppNotifications } from '@/hooks/useWhatsAppNotifications';
import { SystemState } from '@/hooks/useRealtimeData';
import { Settings, Clock, Play, Square } from 'lucide-react';

interface SystemControlsProps {
  systemState: SystemState | null;
}

export function SystemControls({ systemState }: SystemControlsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendSystemOpenNotification } = useWhatsAppNotifications();

  const updateSystemState = async (updates: Partial<SystemState>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_state')
        .update(updates)
        .eq('id', systemState?.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar sistema.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Sistema atualizado com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const startPriorityTimer = async () => {
    await updateSystemState({
      is_priority_mode: true,
      is_open_for_all: false,
      priority_timer_started_at: new Date().toISOString()
    });
  };

  const openForAll = async () => {
    const result = await updateSystemState({
      is_priority_mode: false,
      is_open_for_all: true,
      priority_timer_started_at: null
    });

    // Enviar notificações WhatsApp para todos os usuários com telefone
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('phone')
        .not('phone', 'is', null);

      if (profiles && profiles.length > 0) {
        const phones = profiles.map(p => p.phone).filter(Boolean);
        if (phones.length > 0) {
          await sendSystemOpenNotification(phones);
          toast({
            title: "Notificações enviadas",
            description: `${phones.length} notificações WhatsApp enviadas`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      // Não falhar a operação se as notificações falharem
    }
  };

  const pauseSystem = async () => {
    await updateSystemState({
      is_priority_mode: false,
      is_open_for_all: false,
      priority_timer_started_at: null
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Controles do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={startPriorityTimer}
            disabled={loading}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            <Clock className="h-4 w-4 mr-2" />
            Iniciar Timer (24hrs)
          </Button>
          
          <Button
            onClick={openForAll}
            disabled={loading}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <Play className="h-4 w-4 mr-2" />
            Abrir para Todos
          </Button>
          
          <Button
            onClick={pauseSystem}
            disabled={loading}
            variant="outline"
          >
            <Square className="h-4 w-4 mr-2" />
            Pausar Sistema
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Modo Prioridade</p>
            <Badge variant={systemState?.is_priority_mode ? "default" : "secondary"}>
              {systemState?.is_priority_mode ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Aberto para Todos</p>
            <Badge variant={systemState?.is_open_for_all ? "default" : "secondary"}>
              {systemState?.is_open_for_all ? "Sim" : "Não"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}