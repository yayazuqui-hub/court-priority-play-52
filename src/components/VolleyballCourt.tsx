import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shuffle, Users } from 'lucide-react';

interface Booking {
  id: string;
  player1_name: string;
  player2_name?: string;
  team?: string;
  player2_team?: string;
  player_level?: string;
  player2_level?: string;
}

interface GeneratedTeam {
  id: number;
  players: {
    name: string;
    level: string;
    gender: string;
  }[];
}

interface VolleyballCourtProps {
  bookings: Booking[];
  showTeamGenerator?: boolean;
  savedTeams?: GeneratedTeam[];
}

export function VolleyballCourt({ bookings, showTeamGenerator = false, savedTeams }: VolleyballCourtProps) {
  const [generatedTeams, setGeneratedTeams] = useState<GeneratedTeam[]>([]);
  const [useGeneratedTeams, setUseGeneratedTeams] = useState(false);


  // Extract all players from bookings
  const getAllPlayers = () => {
    const players: { name: string; level: string; gender: string }[] = [];
    
    bookings.forEach((booking) => {
      players.push({
        name: booking.player1_name,
        level: booking.player_level || 'não informado',
        gender: booking.team || 'não informado'
      });
      
      if (booking.player2_name) {
        players.push({
          name: booking.player2_name,
          level: booking.player2_level || 'não informado',
          gender: booking.player2_team || 'não informado'
        });
      }
    });
    
    return players;
  };

  const generateBalancedTeams = () => {
    const allPlayers = getAllPlayers();
    
    // Separate players by level and gender
    const playersByLevel = {
      iniciante: { masculino: [], feminino: [], 'não informado': [] },
      intermediario: { masculino: [], feminino: [], 'não informado': [] },
      avancado: { masculino: [], feminino: [], 'não informado': [] },
      'não informado': { masculino: [], feminino: [], 'não informado': [] }
    };

    allPlayers.forEach(player => {
      const level = player.level as keyof typeof playersByLevel;
      const gender = player.gender as keyof typeof playersByLevel['iniciante'];
      if (playersByLevel[level] && playersByLevel[level][gender]) {
        playersByLevel[level][gender].push(player);
      }
    });

    // Create two teams for court visualization
    const teams: GeneratedTeam[] = [
      { id: 1, players: [] },
      { id: 2, players: [] }
    ];

    // Distribute players trying to balance levels and genders
    const levels = ['avancado', 'intermediario', 'iniciante', 'não informado'];
    const genders = ['masculino', 'feminino', 'não informado'];
    
    levels.forEach(level => {
      genders.forEach(gender => {
        const levelKey = level as keyof typeof playersByLevel;
        const genderKey = gender as keyof typeof playersByLevel['iniciante'];
        
        if (playersByLevel[levelKey] && playersByLevel[levelKey][genderKey]) {
          const players = [...playersByLevel[levelKey][genderKey]];
          
          // Shuffle players for randomness
          for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
          }
          
          // Distribute players across teams (alternating)
          players.forEach((player, index) => {
            const teamIndex = index % 2;
            if (teams[teamIndex].players.length < 6) {
              teams[teamIndex].players.push(player);
            }
          });
        }
      });
    });

    setGeneratedTeams(teams);
    setUseGeneratedTeams(true);
  };

  const movePlayerBetweenTeams = (playerName: string, fromTeam: number) => {
    if (!useGeneratedTeams || generatedTeams.length < 2) return;

    const updatedTeams = [...generatedTeams];
    const toTeam = fromTeam === 0 ? 1 : 0;

    // Find and remove player from source team
    const playerIndex = updatedTeams[fromTeam].players.findIndex(p => p.name === playerName);
    if (playerIndex === -1) return;

    const [player] = updatedTeams[fromTeam].players.splice(playerIndex, 1);

    // Add player to destination team (if there's space)
    if (updatedTeams[toTeam].players.length < 6) {
      updatedTeams[toTeam].players.push(player);
    } else {
      // If destination team is full, swap with the last player
      const lastPlayer = updatedTeams[toTeam].players.pop();
      updatedTeams[toTeam].players.push(player);
      if (lastPlayer) {
        updatedTeams[fromTeam].players.push(lastPlayer);
      }
    }

    setGeneratedTeams(updatedTeams);
  };

  const renderPlayer = (player: { name: string; level?: string }, teamIndex: number) => (
    <div className="flex flex-col items-center p-2 bg-white/90 rounded-lg border border-primary/20 min-h-[60px] justify-center">
      <span className="text-xs font-semibold text-primary truncate max-w-[80px]">
        {player.name}
      </span>
      {player.level && player.level !== 'não informado' && (
        <Badge variant="outline" className="text-xs mt-1 px-1 py-0">
          {player.level === 'iniciante' ? 'I' : 
           player.level === 'intermediario' ? 'M' : 
           player.level === 'avancado' ? 'A' : '?'}
        </Badge>
      )}
    </div>
  );

  const renderEmptyPosition = () => (
    <div className="flex items-center justify-center p-2 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 min-h-[60px]">
      <span className="text-xs text-muted-foreground">Vazio</span>
    </div>
  );

  // Determine which teams to display
  let teamAPlayers: Array<{name: string, level?: string}> = [];
  let teamBPlayers: Array<{name: string, level?: string}> = [];

  if (savedTeams && savedTeams.length >= 2) {
    // Use saved teams first priority
    teamAPlayers = savedTeams[0].players.map(p => ({ name: p.name, level: p.level }));
    teamBPlayers = savedTeams[1].players.map(p => ({ name: p.name, level: p.level }));
  } else if (useGeneratedTeams && generatedTeams.length >= 2) {
    // Use generated balanced teams
    teamAPlayers = generatedTeams[0].players.map(p => ({ name: p.name, level: p.level }));
    teamBPlayers = generatedTeams[1].players.map(p => ({ name: p.name, level: p.level }));
  } else {
    // Use original team assignment from bookings - but distribute players evenly
    // Since the bookings use "masculino/feminino" instead of "A/B", we'll distribute players
    const allBookingPlayers: Array<{name: string, level?: string}> = [];
    
    bookings.forEach(booking => {
      allBookingPlayers.push({ name: booking.player1_name, level: booking.player_level });
      if (booking.player2_name) {
        allBookingPlayers.push({ name: booking.player2_name, level: booking.player2_level });
      }
    });

    // Distribute players evenly between teams
    allBookingPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        if (teamAPlayers.length < 6) {
          teamAPlayers.push(player);
        } else if (teamBPlayers.length < 6) {
          teamBPlayers.push(player);
        }
      } else {
        if (teamBPlayers.length < 6) {
          teamBPlayers.push(player);
        } else if (teamAPlayers.length < 6) {
          teamAPlayers.push(player);
        }
      }
    });
  }

  const totalPlayers = getAllPlayers().length;
  const canGenerate = totalPlayers >= 12;

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quadra Atual
            {(savedTeams && savedTeams.length >= 2) && (
              <Badge className="bg-success">Times Salvos</Badge>
            )}
            {useGeneratedTeams && !(savedTeams && savedTeams.length >= 2) && (
              <Badge className="bg-warning">Times Temporários</Badge>
            )}
          </CardTitle>
          {showTeamGenerator && canGenerate && (
            <div className="flex gap-2">
              {useGeneratedTeams && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseGeneratedTeams(false)}
                >
                  Ver Original
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={generateBalancedTeams}
                className="gap-2"
              >
                <Shuffle className="h-4 w-4" />
                {useGeneratedTeams ? 'Regenerar' : 'Balancear Times'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!canGenerate && showTeamGenerator && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-dashed text-center">
            <p className="text-sm text-muted-foreground">
              {totalPlayers}/12 jogadores • Gerador de times será habilitado com 12+ jogadores
            </p>
          </div>
        )}

        <div className="relative">
          {/* Court Background */}
          <div className="volleyball-gradient rounded-lg p-1">
            <div className="bg-background rounded-lg p-4">
              
              {/* Team A Side */}
              <div className="mb-4">
                <div className="text-center mb-2">
                  <Badge className="bg-primary">
                    {useGeneratedTeams ? 'Time 1' : 'Time A'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {/* Front row - positions 4, 3, 2 */}
                  {teamAPlayers[0] ? renderPlayer(teamAPlayers[0], 0) : renderEmptyPosition()}
                  {teamAPlayers[1] ? renderPlayer(teamAPlayers[1], 0) : renderEmptyPosition()}
                  {teamAPlayers[2] ? renderPlayer(teamAPlayers[2], 0) : renderEmptyPosition()}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Back row - positions 5, 6, 1 */}
                  {teamAPlayers[3] ? renderPlayer(teamAPlayers[3], 0) : renderEmptyPosition()}
                  {teamAPlayers[4] ? renderPlayer(teamAPlayers[4], 0) : renderEmptyPosition()}
                  {teamAPlayers[5] ? renderPlayer(teamAPlayers[5], 0) : renderEmptyPosition()}
                </div>
              </div>

              {/* Net */}
              <div className="h-2 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full my-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-accent/50 to-accent/30 rounded-full blur-sm"></div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white bg-primary px-2 py-1 rounded">
                  REDE
                </div>
              </div>

              {/* Team B Side */}
              <div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {/* Back row - positions 1, 6, 5 */}
                  {teamBPlayers[0] ? renderPlayer(teamBPlayers[0], 1) : renderEmptyPosition()}
                  {teamBPlayers[1] ? renderPlayer(teamBPlayers[1], 1) : renderEmptyPosition()}
                  {teamBPlayers[2] ? renderPlayer(teamBPlayers[2], 1) : renderEmptyPosition()}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {/* Front row - positions 2, 3, 4 */}
                  {teamBPlayers[3] ? renderPlayer(teamBPlayers[3], 1) : renderEmptyPosition()}
                  {teamBPlayers[4] ? renderPlayer(teamBPlayers[4], 1) : renderEmptyPosition()}
                  {teamBPlayers[5] ? renderPlayer(teamBPlayers[5], 1) : renderEmptyPosition()}
                </div>
                <div className="text-center mt-2">
                  <Badge className="bg-accent">
                    {useGeneratedTeams ? 'Time 2' : 'Time B'}
                  </Badge>
                </div>
              </div>

            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            <span>{useGeneratedTeams ? 'Time 1' : 'Time A'}: {teamAPlayers.length}/6 jogadores</span>
            <span>{useGeneratedTeams ? 'Time 2' : 'Time B'}: {teamBPlayers.length}/6 jogadores</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}