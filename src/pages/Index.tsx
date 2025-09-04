import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthForm } from '@/components/AuthForm';
import { PriorityTimer } from '@/components/PriorityTimer';
import { PriorityQueueDisplay } from '@/components/PriorityQueueDisplay';
import { BookingForm } from '@/components/BookingForm';
import { BookingsList } from '@/components/BookingsList';
import GamesScheduleList from '@/components/GamesScheduleList';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Settings, Calendar, User, DollarSign, Menu, X, Trophy } from 'lucide-react';
import volleyballLogo from '@/assets/volleyball-logo.png';
import { UserProgressSummary } from '@/components/UserProgressSummary';
import { VolleyballCourt } from '@/components/VolleyballCourt';

const Index = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const { systemState, priorityQueue, bookings, gamesSchedule, loading: dataLoading } = useRealtimeData();
  const navigate = useNavigate();
  const [savedTeams, setSavedTeams] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('savedTeams');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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

  // Atualiza quando times salvos mudarem em outras abas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'savedTeams') {
        try {
          setSavedTeams(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background court-lines">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img 
              src={volleyballLogo} 
              alt="Volleyball" 
              className="w-12 h-12 volleyball-bounce"
            />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold volleyball-gradient bg-clip-text text-transparent">
                Quadra de Vôlei
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm">Sistema de Reservas</p>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/payments')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pagamentos
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mb-6 volleyball-gradient rounded-lg p-1">
            <div className="bg-background rounded-lg p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/payments');
                  setMobileMenuOpen(false);
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pagamentos
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/admin');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}

        {dataLoading ? (
          <div className="text-center py-8">
            <p>Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="volleyball-gradient rounded-lg p-1">
              <div className="bg-background rounded-lg">
                <PriorityTimer systemState={systemState} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="volleyball-gradient text-white">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    Agenda de Jogos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <GamesScheduleList games={gamesSchedule} />
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="volleyball-gradient text-white">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="h-5 w-5" />
                    Seu Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <UserProgressSummary />
                </CardContent>
              </Card>
            </div>

            {/* Volleyball Court Visual */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Quadra Atual</h2>
                <Badge variant="outline" className="text-xs">
                  {bookings.length} marcações ativas
                </Badge>
              </div>
              <VolleyballCourt bookings={bookings} showTeamGenerator={false} savedTeams={savedTeams} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <PriorityQueueDisplay priorityQueue={priorityQueue} systemState={systemState} />
                <BookingForm
                  systemState={systemState}
                  priorityQueue={priorityQueue}
                  bookings={bookings}
                  onBookingSuccess={() => {}}
                />
              </div>
              
              <div>
                <BookingsList bookings={bookings} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
