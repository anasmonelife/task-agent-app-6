-- Enable Row Level Security on team_leader_id table only (panchayath_locations already has RLS enabled)
ALTER TABLE public.team_leader_id ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for team_leader_id (admin only access)
CREATE POLICY "Enable all access for team_leader_id" 
ON public.team_leader_id 
FOR ALL 
USING (true) 
WITH CHECK (true);