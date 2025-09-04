import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/hooks/useRealtimeData';
import { Trash2 } from 'lucide-react';
import { ManualBookingForm } from '../ManualBookingForm';

interface BookingsManagementProps {
  bookings: Booking[];
}

export function BookingsManagement({ bookings }: BookingsManagementProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const clearAllBookings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao limpar marcações.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Todas as marcações foram removidas.",
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
            🏐 Gerenciar Marcações
            <Badge variant="outline">{bookings.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={clearAllBookings}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Todas as Marcações
          </Button>
        </CardContent>
      </Card>

      <ManualBookingForm bookings={bookings} />
    </div>
  );
}