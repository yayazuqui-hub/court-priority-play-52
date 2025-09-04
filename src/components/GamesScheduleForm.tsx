import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira', 
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

const GamesScheduleForm = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState(1); // Segunda-feira por padrão
  const [gameTime, setGameTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!title || !location || !gameTime) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("games_schedule")
        .insert({
          title,
          location,
          address: address || null,
          is_recurring: isRecurring,
          day_of_week: isRecurring ? dayOfWeek : null,
          game_date: null, // Para jogos recorrentes, não usamos data específica
          game_time: gameTime,
          end_time: endTime || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: isRecurring ? "Jogo recorrente criado com sucesso!" : "Jogo agendado com sucesso!"
      });

      // Reset form
      setTitle("");
      setLocation("");
      setAddress("");
      setDayOfWeek(1);
      setGameTime("");
      setEndTime("");
    } catch (error) {
      console.error("Error creating game schedule:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar jogo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Agendar Jogo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Jogo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Jogo de Vôlei - Quinta-feira"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Quadra da Praia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço/Localização</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua das Palmeiras, 123 - Praia do Forte"
            />
          </div>

          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="recurring" className="text-sm">
              Jogo semanal recorrente (recomendado)
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Dia da Semana *</Label>
              <select
                id="day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário de Início *</Label>
              <Input
                id="time"
                type="time"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Horário de Término</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-lg">
            <p className="font-medium">💡 Jogos Recorrentes:</p>
            <p>• O jogo acontecerá toda semana no dia e horário escolhidos</p>
            <p>• Ideal para estabelecer uma rotina fixa de jogos</p>
            <p>• Ex: Todas as segundas às 19:00, quintas às 19:00, sábados às 16:00</p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Criando..." : "Criar Jogo Recorrente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GamesScheduleForm;