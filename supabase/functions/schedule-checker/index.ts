import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      auto_schedule: {
        Row: {
          id: string
          day_of_week: number
          start_time: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
      }
      system_state: {
        Row: {
          id: string
          is_priority_mode: boolean
          is_open_for_all: boolean
          priority_timer_started_at: string | null
          priority_timer_duration: number
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date()
    const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5) // Format: HH:MM
    
    console.log(`Checking schedules for day ${currentDayOfWeek} at ${currentTime}`)

    // Get active schedules for current day
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('auto_schedule')
      .select('*')
      .eq('day_of_week', currentDayOfWeek)
      .eq('is_active', true)

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      throw schedulesError
    }

    console.log(`Found ${schedules?.length || 0} active schedules for today`)

    // Check if any schedule matches current time (within 1 minute tolerance)
    const matchingSchedules = schedules?.filter(schedule => {
      const scheduleTime = schedule.start_time.slice(0, 5) // Ensure HH:MM format
      const timeDiff = Math.abs(
        new Date(`1970-01-01T${currentTime}:00`).getTime() - 
        new Date(`1970-01-01T${scheduleTime}:00`).getTime()
      )
      // Allow 1 minute tolerance (60000 ms)
      return timeDiff <= 60000
    })

    if (!matchingSchedules || matchingSchedules.length === 0) {
      console.log('No matching schedules found for current time')
      return new Response(
        JSON.stringify({ 
          message: 'No matching schedules', 
          currentTime, 
          currentDay: currentDayOfWeek 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${matchingSchedules.length} matching schedules`)

    // Get current system state
    const { data: systemState, error: systemError } = await supabaseClient
      .from('system_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (systemError) {
      console.error('Error fetching system state:', systemError)
      throw systemError
    }

    // Check if system is already in priority mode or open for all
    if (systemState.is_priority_mode || systemState.is_open_for_all) {
      console.log('System is already active, skipping automatic start')
      return new Response(
        JSON.stringify({ 
          message: 'System already active', 
          systemState 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Check if priority timer was recently started (within last 24 hours to prevent duplicates)
    if (systemState.priority_timer_started_at) {
      const lastStartTime = new Date(systemState.priority_timer_started_at)
      const hoursSinceLastStart = (now.getTime() - lastStartTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastStart < 24) {
        console.log('Priority timer was started recently, skipping')
        return new Response(
          JSON.stringify({ 
            message: 'Timer recently started', 
            lastStartTime: systemState.priority_timer_started_at 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    // Start priority timer automatically
    const { error: updateError } = await supabaseClient
      .from('system_state')
      .update({
        is_priority_mode: true,
        is_open_for_all: false,
        priority_timer_started_at: now.toISOString()
      })
      .eq('id', systemState.id)

    if (updateError) {
      console.error('Error updating system state:', updateError)
      throw updateError
    }

    console.log('Priority timer started automatically!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Priority timer started automatically',
        triggeredBy: matchingSchedules,
        startedAt: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in schedule checker:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to check and execute scheduled tasks'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})