import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/hooks/useRealtimeData';
import { Trash2 } from 'lucide-react';

interface BookingsListProps {
  bookings: Booking[];
  isAdmin?: boolean;
}

type PlayerEntry = {
  id: string;
  bookingId: string;
  playerName: string;
  team: string;
  level: string;
  bookedBy: string;
  email: string;
  createdAt: string;
  userId: string;
  isOptional: boolean;
};

export function BookingsList({ bookings, isAdmin = false }: BookingsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDeleteBooking = async (bookingId: string, bookingUserId: string) => {
    // Check if user can delete (owner or admin)
    if (!isAdmin && bookingUserId !== user?.id) {
      toast({
        title: "Não autorizado",
        description: "Você só pode excluir suas próprias marcações.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir marcação.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Marcação excluída com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir marcação.",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Create individual player entries from bookings
  const playerEntries: PlayerEntry[] = bookings.flatMap(booking => {
    const entries: PlayerEntry[] = [];
    
    // Main player
    entries.push({
      id: `${booking.id}-player1`,
      bookingId: booking.id,
      playerName: booking.player1_name,
      team: booking.team || 'não informado',
      level: booking.player_level || 'não informado',
      bookedBy: booking.profiles?.name || 'Administrador',
      email: booking.profiles?.email || 'admin@sistema.com',
      createdAt: booking.created_at,
      userId: booking.user_id || '',
      isOptional: false
    });
    
    // Optional second player
    if (booking.player2_name) {
      entries.push({
        id: `${booking.id}-player2`,
        bookingId: booking.id,
        playerName: booking.player2_name,
        team: booking.player2_team || 'não informado',
        level: booking.player2_level || 'não informado',
        bookedBy: booking.profiles?.name || 'Administrador',
        email: booking.profiles?.email || 'admin@sistema.com',
        createdAt: booking.created_at,
        userId: booking.user_id || '',
        isOptional: true
      });
    }
    
    return entries;
  });

  // Sort entries by creation date (most recent first)
  const sortedEntries = playerEntries.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Marcações Ativas
          <Badge variant="outline">{playerEntries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Nenhuma marcação ativa no momento
          </p>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${
                  entry.userId === user?.id
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">🏐 {entry.playerName}</p>
                      {entry.isOptional && (
                        <Badge variant="outline" className="text-xs">
                          Opcional
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Data: {formatDateTime(entry.createdAt)}</p>
                    </div>
                    
                    {entry.userId === user?.id && (
                    <Badge className="mt-2 bg-success text-success-foreground">
                      Sua marcação
                    </Badge>
                    )}
                  </div>
                  
                  {(entry.userId === user?.id || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBooking(entry.bookingId, entry.userId)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}