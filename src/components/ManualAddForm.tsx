import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PriorityQueue } from '@/hooks/useRealtimeData';
import { UserPlus, X } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  gender: string;
  level: string;
}

interface ManualAddFormProps {
  priorityQueue: PriorityQueue[];
}

export function ManualAddForm({ priorityQueue }: ManualAddFormProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const { toast } = useToast();

  // Buscar todos os perfis disponíveis
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name');

        if (error) {
          console.error('Erro ao buscar perfis:', error);
          toast({
            title: "Erro",
            description: "Erro ao carregar lista de usuários.",
            variant: "destructive"
          });
        } else {
          setProfiles(data || []);
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
      }
      setLoadingProfiles(false);
    };

    fetchProfiles();
  }, [toast]);

  // Filtrar usuários que já estão na fila
  const availableProfiles = profiles.filter(
    profile => !priorityQueue.some(queue => queue.user_id === profile.user_id)
  );

  const addToQueue = async () => {
    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário.",
        variant: "destructive"
      });
      return;
    }

    if (priorityQueue.length >= 12) {
      toast({
        title: "Fila cheia",
        description: "A fila de prioridade já está com 12 usuários.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Calcular próxima posição
      const nextPosition = Math.max(...priorityQueue.map(q => q.position), 0) + 1;

      const { error } = await supabase
        .from('priority_queue')
        .insert({
          user_id: selectedUserId,
          position: nextPosition
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao adicionar usuário à fila.",
          variant: "destructive"
        });
      } else {
        const selectedProfile = profiles.find(p => p.user_id === selectedUserId);
        toast({
          title: "Sucesso",
          description: `${selectedProfile?.name} adicionado à fila na posição ${nextPosition}.`,
        });
        setSelectedUserId('');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao adicionar usuário.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const removeFromQueue = async (queueItem: PriorityQueue) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('priority_queue')
        .delete()
        .eq('id', queueItem.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao remover usuário da fila.",
          variant: "destructive"
        });
      } else {
        const profile = profiles.find(p => p.user_id === queueItem.user_id);
        toast({
          title: "Removido",
          description: `${profile?.name || 'Usuário'} removido da fila.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao remover usuário.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const getProfileByUserId = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Pessoa Manualmente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select 
              value={selectedUserId} 
              onValueChange={setSelectedUserId}
              disabled={loadingProfiles || loading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={
                  loadingProfiles 
                    ? "Carregando usuários..." 
                    : availableProfiles.length === 0 
                    ? "Todos os usuários já estão na fila" 
                    : "Selecione um usuário"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableProfiles.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    <div className="flex items-center gap-2">
                      <span>{profile.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {profile.level}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {profile.gender}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={addToQueue}
              disabled={!selectedUserId || loading || priorityQueue.length >= 12}
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Fila atual: {priorityQueue.length}/12 usuários
          </p>
        </CardContent>
      </Card>

      {/* Lista atual da fila */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fila de Prioridade Atual</CardTitle>
        </CardHeader>
        <CardContent>
          {priorityQueue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Fila vazia
            </p>
          ) : (
            <div className="space-y-2">
              {priorityQueue
                .sort((a, b) => a.position - b.position)
                .map((queueItem) => {
                  const profile = getProfileByUserId(queueItem.user_id);
                  return (
                    <div 
                      key={queueItem.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{queueItem.position}</Badge>
                        <div>
                          <p className="font-medium">
                            {profile?.name || 'Nome não encontrado'}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {profile?.level || 'N/A'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {profile?.gender || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => removeFromQueue(queueItem)}
                        disabled={loading}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}