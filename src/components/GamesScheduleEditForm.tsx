import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GameSchedule {
  id: string;
  title: string;
  location: string;
  address?: string;
  game_date: string;
  game_time: string;
  end_time?: string;
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
  const [gameDate, setGameDate] = useState<Date>();
  const [gameTime, setGameTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (game && open) {
      setTitle(game.title);
      setLocation(game.location);
      setAddress(game.address || "");
      setGameDate(parseISO(game.game_date));
      setGameTime(game.game_time);
      setEndTime(game.end_time || "");
    }
  }, [game, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !location || !gameDate || !gameTime) {
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
          game_date: format(gameDate, "yyyy-MM-dd"),
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Jogo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !gameDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {gameDate ? format(gameDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={gameDate}
                    onSelect={setGameDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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