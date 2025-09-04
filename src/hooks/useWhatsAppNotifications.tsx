import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  phone: string;
  message: string;
  type: 'booking' | 'system_open' | 'game_reminder';
}

export function useWhatsAppNotifications() {
  const { toast } = useToast();

  const sendNotification = useCallback(async (data: NotificationData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-notifications', {
        body: data
      });

      if (error) {
        console.error('Error sending WhatsApp notification:', error);
        throw error;
      }

      console.log('WhatsApp notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      toast({
        title: "Erro na notificação",
        description: "Não foi possível enviar a notificação via WhatsApp",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const sendBookingNotification = useCallback(async (phone: string, playerName: string, isEdit = false) => {
    const action = isEdit ? 'editada' : 'criada';
    const message = `🏐 *Marcação ${action}!*\n\nOlá ${playerName}!\n\nSua marcação foi ${action} com sucesso no sistema de vôlei.\n\nAguarde as próximas instruções sobre os jogos!`;
    
    return sendNotification({
      phone,
      message,
      type: 'booking'
    });
  }, [sendNotification]);

  const sendSystemOpenNotification = useCallback(async (phones: string[]) => {
    const message = `🏐 *Sistema Aberto para Todos!*\n\nO sistema de marcações está agora aberto para todos os jogadores!\n\nAcesse agora e faça sua marcação: [Link do Sistema]\n\nCorra que as vagas são limitadas! 🏃‍♂️⚡`;

    const promises = phones.map(phone => 
      sendNotification({
        phone,
        message,
        type: 'system_open'
      })
    );

    return Promise.allSettled(promises);
  }, [sendNotification]);

  const sendGameReminderNotification = useCallback(async (phones: string[], gameTitle: string, gameDate: string, gameTime: string, location: string) => {
    const message = `🏐 *Lembrete de Jogo!*\n\n📅 *${gameTitle}*\n\n🗓️ **Data:** ${gameDate}\n⏰ **Horário:** ${gameTime}\n📍 **Local:** ${location}\n\nNão esqueça! Nos vemos lá! 🤝`;

    const promises = phones.map(phone => 
      sendNotification({
        phone,
        message,
        type: 'game_reminder'
      })
    );

    return Promise.allSettled(promises);
  }, [sendNotification]);

  return {
    sendBookingNotification,
    sendSystemOpenNotification,
    sendGameReminderNotification
  };
}