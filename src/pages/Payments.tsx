import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, DollarSign, Users, Clock, CheckCircle, Copy, Smartphone, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import volleyballLogo from '@/assets/volleyball-logo.png';
import PixCodeForm from '@/components/PixCodeForm';
import UserExpensesForm from '@/components/UserExpensesForm';
import PaymentEditForm from '@/components/PaymentEditForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Payment {
  id: string;
  court_total_value: number;
  individual_value: number;
  game_date: string;
  status: string;
  created_at: string;
}

interface PaymentUser {
  id: string;
  payment_id: string;
  user_id: string;
  payment_method: string | null;
  payment_status: string;
  paid_at: string | null;
}

interface PixCode {
  id: string;
  payment_id: string;
  pix_code: string;
  pix_key: string | null;
  created_by: string;
  created_at: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentUsers, setPaymentUsers] = useState<PaymentUser[]>([]);
  const [pixCodes, setPixCodes] = useState<PixCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveBookings, setHasActiveBookings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchPayments();
  }, [user, navigate]);

  const fetchPayments = async () => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const { data: paymentUsersData, error: paymentUsersError } = await supabase
        .from('payment_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentUsersError) throw paymentUsersError;

      const { data: pixCodesData, error: pixCodesError } = await supabase
        .from('pix_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (pixCodesError) throw pixCodesError;

      // Check if user has active bookings
      if (user) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', user.id);

        if (!bookingsError) {
          setHasActiveBookings((bookingsData || []).length > 0);
        }

        // Check if user is admin
        const { data: adminCheck } = await supabase.rpc('has_admin_role', {
          check_user_id: user.id
        });
        setIsAdmin(adminCheck || false);
      }

      setPayments(paymentsData || []);
      setPaymentUsers(paymentUsersData || []);
      setPixCodes(pixCodesData || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentUserId: string, method: 'pix' | 'cash') => {
    try {
      const { error } = await supabase
        .from('payment_users')
        .update({
          payment_method: method,
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentUserId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Pagamento confirmado via ${method === 'pix' ? 'PIX' : 'dinheiro'}!`,
      });

      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento",
        variant: "destructive",
      });
    }
  };

  const getUserPayment = (paymentId: string) => {
    return paymentUsers.find(pu => pu.payment_id === paymentId && pu.user_id === user?.id);
  };

  const getPaymentUsersByPaymentId = (paymentId: string) => {
    return paymentUsers.filter(pu => pu.payment_id === paymentId);
  };

  const getPixCodesByPaymentId = (paymentId: string) => {
    return pixCodes.filter(pc => pc.payment_id === paymentId);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  const deletePayment = async (paymentId: string) => {
    try {
      console.log('Attempting to delete payment:', paymentId);
      console.log('Current user:', user?.id);
      console.log('Is admin:', isAdmin);

      // First check if user is admin
      if (!isAdmin) {
        throw new Error('Você não tem permissão para excluir pagamentos');
      }

      const { error } = await supabase
        .from('payments')
        .update({ status: 'deleted' })
        .eq('id', paymentId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso!",
      });

      fetchPayments();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o pagamento",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setEditingPaymentId(null);
    fetchPayments();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Carregando...</p>
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
                Pagamentos da Quadra
              </h1>
              <p className="text-muted-foreground text-sm">Gerencie seus pagamentos</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {payments.length === 0 ? (
            <Card className="border-primary/20">
              <CardContent className="p-8 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum pagamento ativo no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => {
              const userPayment = getUserPayment(payment.id);
              const allPaymentUsers = getPaymentUsersByPaymentId(payment.id);
              const paidUsers = allPaymentUsers.filter(pu => pu.payment_status === 'paid');
              const paymentPixCodes = getPixCodesByPaymentId(payment.id);

              return (
                <div key={payment.id} className="space-y-4">
                  <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="volleyball-gradient text-white">
                      <CardTitle className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Pagamento - {new Date(payment.game_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {paidUsers.length}/{allPaymentUsers.length} pagos
                          </Badge>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPaymentId(payment.id)}
                                className="text-white hover:bg-white/20"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deletePayment(payment.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            R$ {payment.court_total_value.toFixed(2)}
                          </div>
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            R$ {payment.individual_value.toFixed(2)}
                          </div>
                          <p className="text-sm text-muted-foreground">Valor por Atleta</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {allPaymentUsers.length}
                          </div>
                          <p className="text-sm text-muted-foreground">Atletas</p>
                        </div>
                      </div>

                      {/* PIX Codes Section */}
                      {paymentPixCodes.length > 0 && (
                        <div className="border-t pt-4 mb-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            PIX Copia e Cola
                          </h3>
                          <div className="space-y-3">
                            {paymentPixCodes.map((pixCode) => (
                              <div key={pixCode.id} className="p-3 bg-muted rounded-lg">
                                {pixCode.pix_key && (
                                  <p className="text-sm font-medium mb-2">
                                    Chave: {pixCode.pix_key}
                                  </p>
                                )}
                                <div className="flex items-start gap-2">
                                  <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                                    {pixCode.pix_code}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(pixCode.pix_code)}
                                    className="shrink-0"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {userPayment ? (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Seu Pagamento
                          </h3>
                          {userPayment.payment_status === 'paid' ? (
                            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Pagamento Confirmado</p>
                                <p className="text-sm text-green-600">
                                  Via {userPayment.payment_method === 'pix' ? 'PIX' : 'Dinheiro'} em{' '}
                                  {new Date(userPayment.paid_at!).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <Clock className="h-5 w-5 text-yellow-600" />
                                <div>
                                  <p className="font-medium text-yellow-800">Pagamento Pendente</p>
                                  <p className="text-sm text-yellow-600">
                                    Valor: R$ {payment.individual_value.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => markAsPaid(userPayment.id, 'pix')}
                                  className="flex-1"
                                >
                                  Paguei via PIX
                                </Button>
                                <Button
                                  onClick={() => markAsPaid(userPayment.id, 'cash')}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Paguei em Dinheiro
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border-t pt-4">
                          <p className="text-muted-foreground text-center">
                            Você não está incluído neste pagamento.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Edit Payment Form - only for admins */}
                  {isAdmin && editingPaymentId === payment.id && (
                    <PaymentEditForm 
                      payment={payment} 
                      onCancel={() => setEditingPaymentId(null)}
                      onSuccess={handleEditSuccess}
                    />
                  )}

                  {/* User Expenses Form - only for users with active bookings */}
                  {hasActiveBookings && (
                    <UserExpensesForm paymentId={payment.id} />
                  )}

                  {/* PIX Code Form - only for admins */}
                  {isAdmin && (
                    <PixCodeForm paymentId={payment.id} onPixCodeAdded={fetchPayments} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}