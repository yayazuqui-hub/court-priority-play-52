import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';

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
}

export function UserProgressSummary() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;

    try {
      // Get last 3 months for summary
      const months = getLast3Months();
      
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
        };
      });

      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLast3Months = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 3; i++) {
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

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const totalParticipations = monthlyData.reduce((sum, data) => sum + data.participations, 0);
  const totalVictories = monthlyData.reduce((sum, data) => sum + data.victories, 0);
  const winRate = totalParticipations > 0 ? ((totalVictories / totalParticipations) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center mb-1">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">{totalParticipations}</p>
          <p className="text-xs text-muted-foreground">Participações</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center mb-1">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">{totalVictories}</p>
          <p className="text-xs text-muted-foreground">Vitórias</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">{winRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa</p>
        </div>
      </div>

      {/* Recent Months */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Últimos 3 meses:</p>
        {monthlyData.map((data) => (
          <div key={`${data.year}-${data.month}`} className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <span className="text-sm font-medium">{getMonthName(data.month)}</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">{data.participations}P</Badge>
              <Badge className="bg-primary text-xs">{data.victories}V</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}