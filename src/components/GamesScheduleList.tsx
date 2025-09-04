import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, MapPin, Trash2, Edit, Repeat } from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import GamesScheduleEditForm from "./GamesScheduleEditForm";

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

interface GamesScheduleListProps {
  games: GameSchedule[];
  isAdmin?: boolean;
}

const GamesScheduleList = ({ games, isAdmin = false }: GamesScheduleListProps) => {
  const { toast } = useToast();
  const [editingGame, setEditingGame] = useState<GameSchedule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDelete = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from("games_schedule")
        .delete()
        .eq("id", gameId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jogo removido da agenda"
      });
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover jogo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (game: GameSchedule) => {
    setEditingGame(game);
    setEditDialogOpen(true);
  };

  const isGameUpcoming = (game: GameSchedule) => {
    if (game.is_recurring) {
      return true; // Jogos recorrentes são sempre considerados ativos
    }
    if (game.game_date) {
      const gameDateTime = new Date(`${game.game_date}T${game.game_time}`);
      return isAfter(gameDateTime, new Date());
    }
    return false;
  };

  const sortedGames = [...games].sort((a, b) => {
    // Jogos recorrentes primeiro, depois por dia da semana ou data
    if (a.is_recurring && !b.is_recurring) return -1;
    if (!a.is_recurring && b.is_recurring) return 1;
    
    if (a.is_recurring && b.is_recurring) {
      // Ordenar por dia da semana
      return (a.day_of_week || 0) - (b.day_of_week || 0);
    }
    
    // Para jogos não recorrentes, ordenar por data
    if (a.game_date && b.game_date) {
      const dateA = new Date(`${a.game_date}T${a.game_time}`);
      const dateB = new Date(`${b.game_date}T${b.game_time}`);
      return dateA.getTime() - dateB.getTime();
    }
    
    return 0;
  });

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum jogo agendado no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sortedGames.map((game) => {
        const isUpcoming = isGameUpcoming(game);
        
        return (
          <Card key={game.id} className={cn(
            "transition-all duration-200",
            game.is_recurring && "border-primary/20 bg-primary/5",
            !isUpcoming && !game.is_recurring && "opacity-60"
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {game.title}
                    {game.is_recurring && <Repeat className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    {game.is_recurring ? (
                      <Badge variant="default" className="bg-primary">Recorrente</Badge>
                    ) : isUpcoming ? (
                      <Badge variant="default">Próximo</Badge>
                    ) : (
                      <Badge variant="secondary">Passado</Badge>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(game)}
                      className="text-primary hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(game.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {game.is_recurring && game.day_of_week !== undefined
                    ? `Toda ${DAYS_OF_WEEK[game.day_of_week]}`
                    : game.game_date 
                      ? format(parseISO(game.game_date), "EEEE, dd/MM/yyyy", { locale: ptBR })
                      : "Data não definida"
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {game.game_time}
                  {game.end_time && ` - ${game.end_time}`}
                </span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{game.location}</div>
                  {game.address && (
                    <div className="text-muted-foreground">{game.address}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
      
      {editingGame && (
        <GamesScheduleEditForm
          game={editingGame}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setEditingGame(null);
            }
          }}
        />
      )}
    </>
  );
};

export default GamesScheduleList;