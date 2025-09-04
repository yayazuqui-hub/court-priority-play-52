import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  phone: string;
  message: string;
  type: 'booking' | 'system_open' | 'game_reminder';
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
    const { phone, message, type }: WhatsAppMessage = await req.json();
    
    const greenApiIdInstance = Deno.env.get('GREEN_API_ID_INSTANCE');
    const greenApiAccessToken = Deno.env.get('GREEN_API_ACCESS_TOKEN');
    
    if (!greenApiIdInstance || !greenApiAccessToken) {
      console.error('Green API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Green API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

    console.log(`Sending ${type} notification to ${formattedPhone}`);

    // Send message via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiAccessToken}`;
    
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: formattedPhone,
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
        phone: formattedPhone,
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