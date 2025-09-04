import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { AutoScheduleForm } from '../AutoScheduleForm';
import GamesScheduleForm from '../GamesScheduleForm';

export function ScheduleManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gerenciamento de Horários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AutoScheduleForm />
        <GamesScheduleForm />
      </CardContent>
    </Card>
  );
}