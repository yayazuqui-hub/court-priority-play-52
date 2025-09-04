import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('masculino');
  const [level, setLevel] = useState('iniciante');
  const [loading, setLoading] = useState(false);
  
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim() || !email.trim()) {
          toast({
            title: "Erro",
            description: "Por favor, preencha todos os campos.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(name.trim(), email.trim(), gender, level);
        if (error) {
          if (error.message?.includes('already registered')) {
            toast({
              title: "Usuário já existe",
              description: "Este email já está cadastrado. Tente fazer login.",
              variant: "destructive"
            });
            setIsSignUp(false);
          } else {
            toast({
              title: "Erro no cadastro",
              description: error.message || "Erro ao criar conta.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Você foi cadastrado com sucesso.",
          });
          onSuccess?.();
        }
      } else {
        if (!email.trim()) {
          toast({
            title: "Erro",
            description: "Por favor, digite seu email.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const { error } = await signIn(email.trim());
        if (error) {
          toast({
            title: "Erro no login",
            description: "Email não encontrado. Faça seu cadastro primeiro.",
            variant: "destructive"
          });
          setIsSignUp(true);
        } else {
          toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta!",
          });
          onSuccess?.();
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          🏐 Quadra de Vôlei
        </CardTitle>
        <CardDescription>
          {isSignUp ? 'Faça seu cadastro para entrar na fila' : 'Entre com seu email'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Time</Label>
                <RadioGroup value={gender} onValueChange={setGender}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="masculino" id="masculino" />
                    <Label htmlFor="masculino">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feminino" id="feminino" />
                    <Label htmlFor="feminino">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Nível</Label>
                <RadioGroup value={level} onValueChange={setLevel}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="iniciante" id="iniciante" />
                    <Label htmlFor="iniciante">Iniciante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediario" id="intermediario" />
                    <Label htmlFor="intermediario">Intermediário</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avancado" id="avancado" />
                    <Label htmlFor="avancado">Avançado</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
          <div>
            <Input
              type="email"
              placeholder="Seu email (ex: joao@email.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
          >
            {isSignUp ? 'Já tem cadastro? Clique aqui para entrar' : 'Não tem cadastro? Clique aqui para se cadastrar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}