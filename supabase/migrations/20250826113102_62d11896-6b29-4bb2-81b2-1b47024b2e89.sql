-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_state table to control the booking system
CREATE TABLE public.system_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_priority_mode BOOLEAN NOT NULL DEFAULT true,
  is_open_for_all BOOLEAN NOT NULL DEFAULT false,
  priority_timer_started_at TIMESTAMP WITH TIME ZONE,
  priority_timer_duration INTEGER NOT NULL DEFAULT 600, -- 10 minutes in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial system state
INSERT INTO public.system_state (is_priority_mode, is_open_for_all) VALUES (true, false);

-- Create priority_queue table to track first 12 users
CREATE TABLE public.priority_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(position)
);

-- Create bookings table for court reservations
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  player1_name TEXT NOT NULL,
  player2_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for system_state (read-only for regular users)
CREATE POLICY "Everyone can view system state" ON public.system_state FOR SELECT USING (true);

-- RLS Policies for priority_queue
CREATE POLICY "Everyone can view priority queue" ON public.priority_queue FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves into priority queue" ON public.priority_queue FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete themselves from priority queue" ON public.priority_queue FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Everyone can view bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own bookings" ON public.bookings FOR DELETE USING (user_id = auth.uid());

-- Create user roles table for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = 'admin'
  )
$$;

-- Admin policies for system_state
CREATE POLICY "Admins can update system state" ON public.system_state 
FOR UPDATE USING (public.has_admin_role(auth.uid()));

-- Admin policies for priority_queue
CREATE POLICY "Admins can manage priority queue" ON public.priority_queue 
FOR ALL USING (public.has_admin_role(auth.uid()));

-- Admin policies for bookings
CREATE POLICY "Admins can manage all bookings" ON public.bookings 
FOR ALL USING (public.has_admin_role(auth.uid()));

-- Admin policies for user_roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles 
FOR SELECT USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage user roles" ON public.user_roles 
FOR ALL USING (public.has_admin_role(auth.uid()));

-- Function to automatically add user to priority queue if under 12
CREATE OR REPLACE FUNCTION public.auto_add_to_priority_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_count INTEGER;
  next_position INTEGER;
BEGIN
  -- Check current queue size
  SELECT COUNT(*) INTO queue_count FROM public.priority_queue;
  
  -- Only add if queue has less than 12 people
  IF queue_count < 12 THEN
    -- Get next position
    SELECT COALESCE(MAX(position), 0) + 1 INTO next_position FROM public.priority_queue;
    
    -- Add user to priority queue
    INSERT INTO public.priority_queue (user_id, position)
    VALUES (NEW.user_id, next_position);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-add users to priority queue
CREATE TRIGGER auto_add_to_priority_queue_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_to_priority_queue();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_system_state_updated_at
  BEFORE UPDATE ON public.system_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.system_state REPLICA IDENTITY FULL;
ALTER TABLE public.priority_queue REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.profiles;
ALTER publication supabase_realtime ADD TABLE public.system_state;
ALTER publication supabase_realtime ADD TABLE public.priority_queue;
ALTER publication supabase_realtime ADD TABLE public.bookings;
ALTER publication supabase_realtime ADD TABLE public.user_roles;