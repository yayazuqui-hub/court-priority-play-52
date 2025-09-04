import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PixCodeFormProps {
  paymentId: string;
  onPixCodeAdded: () => void;
}

export default function PixCodeForm({ paymentId, onPixCodeAdded }: PixCodeFormProps) {
  const [pixKey, setPixKey] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pixCode.trim()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pix_codes')
        .insert({
          payment_id: paymentId,
          pix_code: pixCode.trim(),
          pix_key: pixKey.trim() || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Código PIX adicionado com sucesso!",
      });

      setPixKey('');
      setPixCode('');
      onPixCodeAdded();
    } catch (error) {
      console.error('Error adding PIX code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o código PIX",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Código copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar PIX Copia e Cola
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pixKey">Chave PIX (opcional)</Label>
            <Input
              id="pixKey"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </div>
          
          <div>
            <Label htmlFor="pixCode">Código PIX Copia e Cola</Label>
            <div className="flex gap-2">
              <Textarea
                id="pixCode"
                value={pixCode}
                onChange={(e) => setPixCode(e.target.value)}
                placeholder="Cole aqui o código PIX..."
                required
                className="min-h-[100px]"
              />
              {pixCode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(pixCode)}
                  className="shrink-0 self-start"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <Button type="submit" disabled={isSubmitting || !pixCode.trim()} className="w-full">
            {isSubmitting ? "Adicionando..." : "Adicionar PIX"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}