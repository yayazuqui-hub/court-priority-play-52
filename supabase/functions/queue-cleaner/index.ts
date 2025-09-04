import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      priority_queue: {
        Row: {
          id: string
          user_id: string
          position: number
          created_at: string
          added_at: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          player_level: string | null
          team: string | null
          player2_team: string | null
          player2_level: string | null
          player2_name: string | null
          player1_name: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          level: string | null
          gender: string | null
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
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000)) // 2 hours ago
    
    console.log(`Checking for users in queue longer than 2 hours (since ${twoHoursAgo.toISOString()})`)

    // Get users who have been in the priority queue for more than 2 hours
    const { data: expiredUsers, error: queueError } = await supabaseClient
      .from('priority_queue')
      .select(`
        id,
        user_id,
        position,
        added_at,
        profiles!inner(name, email)
      `)
      .lt('added_at', twoHoursAgo.toISOString())

    if (queueError) {
      console.error('Error fetching expired users from queue:', queueError)
      throw queueError
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('No expired users found in queue')
      return new Response(
        JSON.stringify({ 
          message: 'No expired users found',
          checkedAt: now.toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${expiredUsers.length} expired users in queue`)

    // Check if any of these users have made bookings since being added to queue
    const userIds = expiredUsers.map(user => user.user_id)
    
    const { data: recentBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('user_id, created_at')
      .in('user_id', userIds)

    if (bookingsError) {
      console.error('Error checking recent bookings:', bookingsError)
      throw bookingsError
    }

    // Filter out users who have made bookings since being added to queue
    const usersToRemove = expiredUsers.filter(queueUser => {
      const userBookings = recentBookings?.filter(booking => 
        booking.user_id === queueUser.user_id &&
        new Date(booking.created_at) >= new Date(queueUser.added_at)
      )
      
      // Remove user if they haven't made any bookings since being added to queue
      return !userBookings || userBookings.length === 0
    })

    if (usersToRemove.length === 0) {
      console.log('All expired users have made bookings, no one to remove')
      return new Response(
        JSON.stringify({ 
          message: 'All expired users have made bookings',
          expiredCount: expiredUsers.length,
          checkedAt: now.toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Removing ${usersToRemove.length} users from queue who haven't made bookings`)

    // Remove expired users who haven't made bookings
    const idsToRemove = usersToRemove.map(user => user.id)
    
    const { error: removeError } = await supabaseClient
      .from('priority_queue')
      .delete()
      .in('id', idsToRemove)

    if (removeError) {
      console.error('Error removing expired users:', removeError)
      throw removeError
    }

    // Reorder remaining queue positions
    const { data: remainingQueue, error: remainingError } = await supabaseClient
      .from('priority_queue')
      .select('id, position')
      .order('position', { ascending: true })

    if (remainingError) {
      console.error('Error fetching remaining queue:', remainingError)
      throw remainingError
    }

    // Update positions to be sequential
    if (remainingQueue && remainingQueue.length > 0) {
      const updates = remainingQueue.map((item, index) => ({
        id: item.id,
        position: index + 1
      }))

      for (const update of updates) {
        await supabaseClient
          .from('priority_queue')
          .update({ position: update.position })
          .eq('id', update.id)
      }

      console.log(`Reordered ${remainingQueue.length} remaining queue positions`)
    }

    const removedUsers = usersToRemove.map(user => ({
      user_id: user.user_id,
      name: user.profiles?.name,
      email: user.profiles?.email,
      position: user.position,
      hoursInQueue: Math.round((now.getTime() - new Date(user.added_at).getTime()) / (1000 * 60 * 60) * 10) / 10
    }))

    console.log('Queue cleanup completed successfully')
    console.log('Removed users:', removedUsers)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Queue cleanup completed',
        removedCount: usersToRemove.length,
        removedUsers,
        remainingInQueue: remainingQueue?.length || 0,
        cleanedAt: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in queue cleaner:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to clean expired users from priority queue'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})