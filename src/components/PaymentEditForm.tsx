import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

interface Payment {
  id: string;
  court_total_value: number;
  individual_value: number;
  game_date: string;
  status: string;
}

interface PaymentEditFormProps {
  payment: Payment;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function PaymentEditForm({ payment, onCancel, onSuccess }: PaymentEditFormProps) {
  const [courtTotalValue, setCourtTotalValue] = useState(payment.court_total_value.toString());
  const [individualValue, setIndividualValue] = useState(payment.individual_value.toString());
  const [gameDate, setGameDate] = useState(payment.game_date);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          court_total_value: parseFloat(courtTotalValue),
          individual_value: parseFloat(individualValue),
          game_date: gameDate,
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 mt-4">
      <CardHeader className="volleyball-gradient text-white">
        <CardTitle className="text-white">Editar Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courtTotal">Valor Total da Quadra (R$)</Label>
              <Input
                id="courtTotal"
                type="number"
                step="0.01"
                value={courtTotalValue}
                onChange={(e) => setCourtTotalValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="individualValue">Valor por Atleta (R$)</Label>
              <Input
                id="individualValue"
                type="number"
                step="0.01"
                value={individualValue}
                onChange={(e) => setIndividualValue(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gameDate">Data do Jogo</Label>
            <Input
              id="gameDate"
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}