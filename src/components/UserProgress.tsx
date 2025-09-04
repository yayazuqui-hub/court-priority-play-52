import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Calendar, TrendingUp, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  id: string;
  user_id: string;
  month: number;
  year: number;
  victories: number;
}

interface MonthlyData {
  month: number;
  year: number;
  participations: number;
  victories: number;
  statsId?: string;
}

export function UserProgress() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingVictories, setAddingVictories] = useState<string | null>(null);
  const [victoriesToAdd, setVictoriesToAdd] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;

    try {
      // Get last 6 months
      const months = getLast6Months();
      
      // Get user participations (bookings) by month
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('created_at')
        .eq('user_id', user.id);

      if (bookingsError) throw bookingsError;

      // Get user stats by month
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      // Calculate monthly data
      const data = months.map(({ month, year }) => {
        const participations = bookings?.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() + 1 === month && bookingDate.getFullYear() === year;
        }).length || 0;

        const userStat = stats?.find(s => s.month === month && s.year === year);
        
        return {
          month,
          year,
          participations,
          victories: userStat?.victories || 0,
          statsId: userStat?.id,
        };
      });

      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading user progress:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu progresso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }
    
    return months;
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return months[month - 1];
  };

  const updateVictories = async (month: number, year: number, newVictories: number, statsId?: string) => {
    if (!user || newVictories < 0) return;

    try {
      if (statsId) {
        // Update existing record
        const { error } = await supabase
          .from('user_stats')
          .update({ victories: newVictories })
          .eq('id', statsId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            month,
            year,
            victories: newVictories,
          });

        if (error) throw error;
      }

      loadUserProgress();
      toast({
        title: "Sucesso",
        description: "Vitórias atualizadas com sucesso!",
      });
    } catch (error) {
      console.error('Error updating victories:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as vitórias",
        variant: "destructive",
      });
    }
  };

  const handleAddVictories = (monthKey: string, currentVictories: number, month: number, year: number, statsId?: string) => {
    if (addingVictories === monthKey) {
      updateVictories(month, year, currentVictories + victoriesToAdd, statsId);
      setAddingVictories(null);
      setVictoriesToAdd(0);
    } else {
      setAddingVictories(monthKey);
      setVictoriesToAdd(0);
    }
  };

  const handleRemoveVictory = (month: number, year: number, currentVictories: number, statsId?: string) => {
    if (currentVictories > 0) {
      updateVictories(month, year, currentVictories - 1, statsId);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 text-center">
          <p>Carregando progresso...</p>
        </CardContent>
      </Card>
    );
  }

  const totalParticipations = monthlyData.reduce((sum, data) => sum + data.participations, 0);
  const totalVictories = monthlyData.reduce((sum, data) => sum + data.victories, 0);
  const winRate = totalParticipations > 0 ? ((totalVictories / totalParticipations) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">Participações (6 meses)</span>
            </div>
            <p className="text-2xl font-bold text-primary">{totalParticipations}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">Vitórias</span>
            </div>
            <p className="text-2xl font-bold text-primary">{totalVictories}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">Taxa de Vitória</span>
            </div>
            <p className="text-2xl font-bold text-primary">{winRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="volleyball-gradient text-white">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5" />
            Progresso Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {monthlyData.map((data) => {
              const monthKey = `${data.year}-${data.month}`;
              const isEditing = addingVictories === monthKey;
              
              return (
                <div key={monthKey} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-semibold">{getMonthName(data.month)}</p>
                      <p className="text-sm text-muted-foreground">{data.year}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Participações</p>
                        <Badge variant="outline">{data.participations}</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Vitórias</p>
                        <Badge className="bg-primary">{data.victories}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={victoriesToAdd}
                          onChange={(e) => setVictoriesToAdd(parseInt(e.target.value) || 0)}
                          className="w-20"
                          placeholder="0"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddVictories(monthKey, data.victories, data.month, data.year, data.statsId)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAddingVictories(null);
                            setVictoriesToAdd(0);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveVictory(data.month, data.year, data.victories, data.statsId)}
                          disabled={data.victories === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddVictories(monthKey, data.victories, data.month, data.year, data.statsId)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}