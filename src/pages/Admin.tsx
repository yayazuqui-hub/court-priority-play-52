import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AdminPanel } from '@/components/AdminPanel';
import { PaymentForm } from '@/components/PaymentForm';
import { BookingsList } from '@/components/BookingsList';
import { PriorityQueueDisplay } from '@/components/PriorityQueueDisplay';
import { TeamGenerator } from '@/components/TeamGenerator';
import { VolleyballCourt } from '@/components/VolleyballCourt';
import GamesScheduleList from '@/components/GamesScheduleList';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, ArrowLeft, Calendar, Shield } from 'lucide-react';
import volleyballLogo from '@/assets/volleyball-logo.png';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [savedTeams, setSavedTeams] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('savedTeams');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const { user, signOut } = useAuth();
  const { systemState, priorityQueue, bookings, gamesSchedule, loading } = useRealtimeData();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data);
    };

    checkAdminStatus();
  }, [user]);


  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleTeamsSaved = (teams: any[]) => {
    setSavedTeams(teams);
    try {
      localStorage.setItem('savedTeams', JSON.stringify(teams));
    } catch {}
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background court-lines">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <img 
              src={volleyballLogo} 
              alt="Volleyball" 
              className="w-10 h-10 volleyball-bounce"
            />
            <div>
              <h1 className="text-3xl font-bold volleyball-gradient bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Área Restrita</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="space-y-6">
          <AdminPanel
            systemState={systemState}
            priorityQueue={priorityQueue}
            bookings={bookings}
          />
          
          <PaymentForm onPaymentCreated={() => window.location.reload()} />
          
          <VolleyballCourt bookings={bookings} showTeamGenerator={false} savedTeams={savedTeams} />
          
          <TeamGenerator bookings={bookings} onTeamsSaved={handleTeamsSaved} savedTeams={savedTeams} />
          
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="volleyball-gradient text-white">
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                Agenda de Jogos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <GamesScheduleList games={gamesSchedule} isAdmin={true} />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriorityQueueDisplay priorityQueue={priorityQueue} systemState={systemState} />
            <BookingsList bookings={bookings} isAdmin={true} />
          </div>
        </div>
      </div>
    </div>
  );
}