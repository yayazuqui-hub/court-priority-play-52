import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  court_total_value: z.string().min(1, 'Valor total é obrigatório'),
  game_date: z.date({
    required_error: 'Data do jogo é obrigatória',
  }),
});

interface PaymentFormProps {
  onPaymentCreated: () => void;
}

export function PaymentForm({ onPaymentCreated }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      court_total_value: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const courtTotal = parseFloat(values.court_total_value);
      const individualValue = courtTotal / 12; // Dividido por 12 atletas

      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          court_total_value: courtTotal,
          individual_value: individualValue,
          created_by: user.id,
          game_date: format(values.game_date, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Get all users with bookings for this date or recent bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('user_id')
        .limit(12)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Create payment_users entries for each user
      if (bookings && bookings.length > 0) {
        const uniqueUserIds = [...new Set(bookings.map(b => b.user_id))];
        const paymentUsers = uniqueUserIds.slice(0, 12).map(userId => ({
          payment_id: payment.id,
          user_id: userId,
        }));

        const { error: paymentUsersError } = await supabase
          .from('payment_users')
          .insert(paymentUsers);

        if (paymentUsersError) throw paymentUsersError;
      }

      toast({
        title: "Sucesso",
        description: `Pagamento criado! Valor por atleta: R$ ${individualValue.toFixed(2)}`,
      });

      form.reset();
      onPaymentCreated();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pagamento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="volleyball-gradient text-white">
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5" />
          Criar Novo Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="court_total_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total da Quadra (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="120.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="game_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Jogo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                O valor será automaticamente dividido entre 12 atletas.
                {form.watch('court_total_value') && (
                  <span className="block font-medium text-primary mt-1">
                    Valor por atleta: R$ {(parseFloat(form.watch('court_total_value') || '0') / 12).toFixed(2)}
                  </span>
                )}
              </p>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Criando...' : 'Criar Pagamento'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}