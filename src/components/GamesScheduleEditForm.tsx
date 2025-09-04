import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira', 
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

interface GameSchedule {
  id: string;
  title: string;
  location: string;
  address?: string;
  game_date?: string;
  game_time: string;
  end_time?: string;
  day_of_week?: number;
  is_recurring?: boolean;
  created_by: string;
  created_at: string;
}

interface GamesScheduleEditFormProps {
  game: GameSchedule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GamesScheduleEditForm = ({ game, open, onOpenChange }: GamesScheduleEditFormProps) => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [gameTime, setGameTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (game && open) {
      setTitle(game.title);
      setLocation(game.location);
      setAddress(game.address || "");
      setIsRecurring(game.is_recurring || false);
      setDayOfWeek(game.day_of_week || 1);
      setGameTime(game.game_time);
      setEndTime(game.end_time || "");
    }
  }, [game, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        .update({
          title,
          location,
          address: address || null,
          is_recurring: isRecurring,
          day_of_week: isRecurring ? dayOfWeek : null,
          game_time: gameTime,
          end_time: endTime || null,
        })
        .eq("id", game.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jogo atualizado com sucesso!"
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating game schedule:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar jogo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Jogo
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título do Jogo *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Jogo de Vôlei - Quinta-feira"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">Local *</Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Quadra da Praia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Endereço/Localização</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua das Palmeiras, 123 - Praia do Forte"
            />
          </div>

          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
            <Switch
              id="edit-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="edit-recurring" className="text-sm">
              Jogo semanal recorrente
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-day">Dia da Semana *</Label>
              <select
                id="edit-day"
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
              <Label htmlFor="edit-time">Horário de Início *</Label>
              <Input
                id="edit-time"
                type="time"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-endTime">Horário de Término</Label>
            <Input
              id="edit-endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GamesScheduleEditForm;