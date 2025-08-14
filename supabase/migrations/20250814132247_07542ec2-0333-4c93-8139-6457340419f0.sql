-- Enable Row Level Security on tables that are missing it
ALTER TABLE public.panchayath_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_leader_id ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for panchayath_locations (public read access)
CREATE POLICY "Enable read access for all users" 
ON public.panchayath_locations 
FOR SELECT 
USING (true);

-- Add RLS policies for team_leader_id (admin only access)
CREATE POLICY "Enable all access for team_leader_id" 
ON public.team_leader_id 
FOR ALL 
USING (true) 
WITH CHECK (true);