import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemState } from '@/hooks/useRealtimeData';

interface PriorityTimerProps {
  systemState: SystemState | null;
}

export function PriorityTimer({ systemState }: PriorityTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!systemState?.priority_timer_started_at || !systemState.is_priority_mode) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(systemState.priority_timer_started_at!).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const remainingSeconds = Math.max(0, systemState.priority_timer_duration - elapsedSeconds);
      
      setTimeLeft(remainingSeconds);

      if (remainingSeconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [systemState]);

  if (!systemState) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (systemState.is_open_for_all) {
      return <Badge className="bg-success text-success-foreground">Aberto para Todos</Badge>;
    }
    
    if (systemState.is_priority_mode && timeLeft !== null && timeLeft > 0) {
      return <Badge className="bg-warning text-warning-foreground">Modo Prioridade Ativo</Badge>;
    }
    
    if (systemState.is_priority_mode && timeLeft === 0) {
      return <Badge className="bg-destructive text-destructive-foreground">Tempo Esgotado</Badge>;
    }
    
    return <Badge variant="secondary">Aguardando</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Status do Sistema
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {systemState.is_open_for_all ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-success">
              🎯 Sistema liberado para todos!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Qualquer pessoa pode fazer marcações agora
            </p>
          </div>
        ) : systemState.is_priority_mode && timeLeft !== null ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              ⏰ {formatTime(timeLeft)}
            </p>
            <p className="text-sm text-muted-foreground">
              Tempo restante da fila de prioridade (24 horas)
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              ⏸️ Sistema pausado
            </p>
            <p className="text-sm text-muted-foreground">
              Aguardando ativação do administrador
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}