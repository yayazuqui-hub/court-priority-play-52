import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

interface AutoSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira', 
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export function AutoScheduleForm() {
  const [schedules, setSchedules] = useState<AutoSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1, // Monday by default
    start_time: '18:00',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_schedule')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar horários automáticos.",
        variant: "destructive"
      });
    }
  };

  const handleAddSchedule = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('auto_schedule')
        .insert({
          day_of_week: newSchedule.day_of_week,
          start_time: newSchedule.start_time,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Horário automático adicionado com sucesso.",
      });

      await loadSchedules();
      setNewSchedule({ day_of_week: 1, start_time: '18:00' });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar horário automático.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('auto_schedule')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Horário ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });

      await loadSchedules();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar horário.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('auto_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Horário removido com sucesso.",
      });

      await loadSchedules();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover horário.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Horários Automáticos para Liberar Fila de Prioridade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new schedule form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
          <div>
            <Label htmlFor="day">Dia da Semana</Label>
            <select
              id="day"
              value={newSchedule.day_of_week}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
              className="w-full mt-1 p-2 border rounded-md"
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={newSchedule.start_time}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={handleAddSchedule}
              disabled={loading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Existing schedules */}
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum horário automático configurado
            </p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {DAYS_OF_WEEK[schedule.day_of_week]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.start_time}
                    </p>
                  </div>
                  <Badge 
                    variant={schedule.is_active ? "default" : "secondary"}
                  >
                    {schedule.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.is_active}
                    onCheckedChange={(checked) => handleToggleActive(schedule.id, checked)}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium">ℹ️ Como funciona:</p>
          <p>• Nos horários configurados, o sistema automaticamente iniciará o período de prioridade de 24 horas</p>
          <p>• Durante essas 24 horas, apenas os primeiros 12 usuários da fila podem fazer marcações</p>
          <p>• Cada usuário tem 2 horas para fazer sua marcação, após isso é removido da fila</p>
          <p>• Após as 24 horas, o sistema permanece fechado até o próximo horário agendado</p>
        </div>
      </CardContent>
    </Card>
  );
}
