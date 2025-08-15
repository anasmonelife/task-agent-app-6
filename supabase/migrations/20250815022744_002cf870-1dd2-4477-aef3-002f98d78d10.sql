-- Create team_permissions table for team permission management
CREATE TABLE public.team_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.management_teams(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES public.admin_users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, permission_id)
);

-- Enable Row Level Security
ALTER TABLE public.team_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_permissions
CREATE POLICY "Admins can view all team permissions" 
ON public.team_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create team permissions" 
ON public.team_permissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update team permissions" 
ON public.team_permissions 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete team permissions" 
ON public.team_permissions 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_team_permissions_updated_at
BEFORE UPDATE ON public.team_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();