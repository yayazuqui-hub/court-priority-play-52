import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, TrendingUp, Calendar, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserStat {
  id: string;
  user_id: string;
  month: number;
  year: number;
  victories: number;
}

interface MonthlyStats {
  month: number;
  year: number;
  victories: number;
  participations: number;
}

const formSchema = z.object({
  victories: z.string().min(1, 'Número de vitórias é obrigatório'),
  month: z.string().min(1, 'Mês é obrigatório'),
  year: z.string().min(1, 'Ano é obrigatório'),
});

const months = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function UserProgressCard() {
  const [stats, setStats] = useState<MonthlyStats[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      victories: '',
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
    },
  });

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch user victories stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (statsError) throw statsError;

      // Fetch user participations from bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('created_at')
        .eq('user_id', user.id);

      if (bookingsError) throw bookingsError;

      // Calculate participations per month
      const participationsByMonth: { [key: string]: number } = {};
      
      bookings?.forEach(booking => {
        const date = new Date(booking.created_at);
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
        participationsByMonth[monthYear] = (participationsByMonth[monthYear] || 0) + 1;
      });

      // Combine stats and participations
      const combinedStats: MonthlyStats[] = [];
      const currentDate = new Date();
      
      // Add stats for last 6 months
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthYear = `${month}-${year}`;
        
        const userStat = userStats?.find(s => s.month === month && s.year === year);
        const participations = participationsByMonth[monthYear] || 0;
        
        combinedStats.push({
          month,
          year,
          victories: userStat?.victories || 0,
          participations,
        });
      }

      setStats(combinedStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas estatísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const month = parseInt(values.month);
      const year = parseInt(values.year);
      const victories = parseInt(values.victories);

      const { data, error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          month,
          year,
          victories,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vitórias atualizadas com sucesso!",
      });

      form.reset();
      fetchUserStats();
    } catch (error) {
      console.error('Error updating victories:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as vitórias",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonthName = (month: number) => {
    return months.find(m => parseInt(m.value) === month)?.label || '';
  };

  if (loading) {
    return (
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <p className="text-center">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = stats.find(s => s.month === new Date().getMonth() + 1 && s.year === new Date().getFullYear());
  const totalVictories = stats.reduce((sum, stat) => sum + stat.victories, 0);
  const totalParticipations = stats.reduce((sum, stat) => sum + stat.participations, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="volleyball-gradient text-white">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Meu Progresso
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentMonth?.participations || 0}
              </div>
              <p className="text-sm text-muted-foreground">Participações este mês</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentMonth?.victories || 0}
              </div>
              <p className="text-sm text-muted-foreground">Vitórias este mês</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {totalVictories}
              </div>
              <p className="text-sm text-muted-foreground">Total de vitórias</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold mb-3">Histórico dos Últimos 6 Meses</h3>
            {stats.map((stat, index) => (
              <div key={`${stat.month}-${stat.year}`} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {getMonthName(stat.month)} {stat.year}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {stat.participations} participações
                  </Badge>
                  <Badge variant="default" className="bg-primary">
                    <Trophy className="h-3 w-3 mr-1" />
                    {stat.victories} vitórias
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Victories Form */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="volleyball-gradient text-white">
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5" />
            Adicionar Vitórias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="victories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Vitórias</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mês</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o mês" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Atualizando...' : 'Atualizar Vitórias'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}