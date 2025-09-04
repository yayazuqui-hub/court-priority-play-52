import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserExpense {
  id: string;
  description: string;
  amount: number;
}

interface UserExpensesFormProps {
  paymentId: string;
}

export default function UserExpensesForm({ paymentId }: UserExpensesFormProps) {
  const [expenses, setExpenses] = useState<UserExpense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, [paymentId, user]);

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_expenses')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newExpense.description.trim() || !newExpense.amount) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_expenses')
        .insert({
          user_id: user.id,
          payment_id: paymentId,
          description: newExpense.description.trim(),
          amount: parseFloat(newExpense.amount)
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Gasto adicionado com sucesso!",
      });

      setNewExpense({ description: '', amount: '' });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o gasto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('user_expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Gasto removido com sucesso!",
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error removing expense:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o gasto",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando gastos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Meus Gastos Extras
          </div>
          {totalExpenses > 0 && (
            <span className="text-lg font-bold text-primary">
              Total: R$ {totalExpenses.toFixed(2)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Gastos Registrados:</h4>
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-primary font-semibold">R$ {expense.amount.toFixed(2)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpense(expense.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addExpense} className="space-y-3 pt-4 border-t">
          <div>
            <Label htmlFor="description">Descrição do Gasto</Label>
            <Input
              id="description"
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Camiseta, joelheira, tênis..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0,00"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !newExpense.description.trim() || !newExpense.amount} 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Adicionando..." : "Adicionar Gasto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}