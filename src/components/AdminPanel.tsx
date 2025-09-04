import { SystemState, PriorityQueue, Booking } from '@/hooks/useRealtimeData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemControls } from './admin/SystemControls';
import { QueueManagement } from './admin/QueueManagement';
import { BookingsManagement } from './admin/BookingsManagement';
import { ScheduleManagement } from './admin/ScheduleManagement';
import { GameReminders } from './admin/GameReminders';
import { Settings, Users, Calendar, Trophy, MessageSquare } from 'lucide-react';

interface AdminPanelProps {
  systemState: SystemState | null;
  priorityQueue: PriorityQueue[];
  bookings: Booking[];
}

export function AdminPanel({ systemState, priorityQueue, bookings }: AdminPanelProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fila
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Marcações
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-6">
          <SystemControls systemState={systemState} />
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <QueueManagement priorityQueue={priorityQueue} />
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <BookingsManagement bookings={bookings} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <ScheduleManagement />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <GameReminders />
        </TabsContent>
      </Tabs>
    </div>
  );
}