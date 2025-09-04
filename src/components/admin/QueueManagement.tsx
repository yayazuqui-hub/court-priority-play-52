import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PriorityQueue } from '@/hooks/useRealtimeData';
import { Users, Trash2 } from 'lucide-react';
import { ManualAddForm } from '../ManualAddForm';

interface QueueManagementProps {
  priorityQueue: PriorityQueue[];
}

export function QueueManagement({ priorityQueue }: QueueManagementProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const clearPriorityQueue = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('priority_queue')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao limpar fila.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Fila de prioridade limpa.",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Fila
            <Badge variant="outline">{priorityQueue.length}/12</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={clearPriorityQueue}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Fila de Prioridade
          </Button>
        </CardContent>
      </Card>

      <ManualAddForm priorityQueue={priorityQueue} />
    </div>
  );
}