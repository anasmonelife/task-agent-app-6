import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import TeamAdminDashboard from '@/components/TeamAdminDashboard';

const TeamAllView = () => {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToTeamDashboard = async () => {
      try {
        const memberUser = localStorage.getItem('member_user');
        if (!memberUser) {
          navigate('/members');
          return;
        }

        const user = JSON.parse(memberUser);
        
        // Get agent data
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('phone', user.mobileNumber)
          .single();

        if (!agentData) {
          navigate('/team');
          return;
        }

        // Get team membership
        const { data: membershipData } = await supabase
          .from('management_team_members')
          .select('team_id')
          .eq('agent_id', agentData.id)
          .single();

        if (membershipData) {
          setTeamId(membershipData.team_id);
        } else {
          navigate('/team');
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        navigate('/team');
      } finally {
        setLoading(false);
      }
    };

    redirectToTeamDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting to team dashboard...</p>
        </div>
      </div>
    );
  }

  return teamId ? <TeamAdminDashboard teamId={teamId} /> : null;
};

export default TeamAllView;