import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  phone?: string;
  groupChatId?: string;
  message: string;
  type: 'booking' | 'system_open' | 'game_reminder';
  idInstance?: string;
  apiToken?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, groupChatId, message, type, idInstance, apiToken }: WhatsAppMessage = await req.json();
    
    // Use provided credentials or fallback to environment variables
    const greenApiIdInstance = idInstance || Deno.env.get('GREEN_API_ID_INSTANCE');
    const greenApiAccessToken = apiToken || Deno.env.get('GREEN_API_ACCESS_TOKEN');
    
    if (!greenApiIdInstance || !greenApiAccessToken) {
      console.error('Green API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Green API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let chatId: string;
    let targetDescription: string;

    if (groupChatId) {
      // For groups, use the provided group chat ID
      chatId = groupChatId;
      targetDescription = `group ${groupChatId}`;
    } else if (phone) {
      // For individual phones, clean and format
      const cleanPhone = phone.replace(/\D/g, '');
      chatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;
      targetDescription = chatId;
    } else {
      throw new Error('Either phone or groupChatId must be provided');
    }

    console.log(`Sending ${type} notification to ${targetDescription}`);

    // Send message via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiAccessToken}`;
    
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Green API error:', errorText);
      throw new Error(`Green API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);

    // Log the notification in database for tracking
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        phone: groupChatId ? `GROUP:${groupChatId}` : chatId,
        message,
        type,
        status: 'sent',
        green_api_response: result,
      });

    if (logError) {
      console.error('Error logging notification:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.idMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});