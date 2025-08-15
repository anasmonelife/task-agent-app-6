import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, BarChart3, Calendar, MessageSquare, Settings, FileText, Eye, Shield } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  team_password?: string;
  created_at: string;
}

interface TeamPermission {
  id: string;
  team_id: string;
  permission_id: string;
  granted_by?: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  agents?: {
    name: string;
    phone?: string;
    role?: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'normal';
  due_date?: string;
  allocated_to_team?: string;
  created_at: string;
}

interface TeamAdminDashboardProps {
  teamId?: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'team_management', label: 'Team Management', icon: Users },
  { key: 'task_management', label: 'Task Management', icon: Calendar },
  { key: 'reports_view', label: 'Reports View', icon: BarChart3 },
  { key: 'member_management', label: 'Member Management', icon: Users },
  { key: 'hierarchy_view', label: 'Hierarchy View', icon: Eye },
  { key: 'panchayath_notes', label: 'Panchayath Notes', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'chat', label: 'Team Chat', icon: MessageSquare },
];

const TeamAdminDashboard: React.FC<TeamAdminDashboardProps> = ({ teamId }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  
  const currentTeamId = teamId || params.teamId;

  useEffect(() => {
    if (currentTeamId) {
      fetchTeamData();
    } else {
      // If no team ID provided, get from user's team membership
      fetchUserTeam();
    }
  }, [currentTeamId]);

  const fetchUserTeam = async () => {
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
        toast({
          title: "Error",
          description: "Agent not found",
          variant: "destructive",
        });
        return;
      }

      // Get team membership
      const { data: membershipData } = await supabase
        .from('management_team_members')
        .select('team_id')
        .eq('agent_id', agentData.id)
        .single();

      if (membershipData) {
        fetchTeamData(membershipData.team_id);
      }
    } catch (error) {
      console.error('Error fetching user team:', error);
    }
  };

  const fetchTeamData = async (teamIdParam?: string) => {
    try {
      setLoading(true);
      const targetTeamId = teamIdParam || currentTeamId;

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from('management_teams')
        .select('*')
        .eq('id', targetTeamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch team permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('team_permissions')
        .select('*')
        .eq('team_id', targetTeamId);

      if (!permissionsError) {
        setPermissions(permissionsData || []);
      }

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('management_team_members')
        .select(`
          *,
          agents(name, phone, role)
        `)
        .eq('team_id', targetTeamId);

      if (!membersError) {
        setTeamMembers(membersData || []);
      }

      // Fetch team tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('allocated_to_team', targetTeamId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!tasksError) {
        setTeamTasks(tasksData || []);
      }

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionKey: string) => {
    return permissions.some(p => p.permission_id === permissionKey);
  };

  const getEnabledTabs = () => {
    const tabs = [{ key: 'overview', label: 'Overview', icon: BarChart3 }];
    
    AVAILABLE_PERMISSIONS.forEach(permission => {
      if (hasPermission(permission.key)) {
        tabs.push({
          key: permission.key,
          label: permission.label,
          icon: permission.icon
        });
      }
    });

    return tabs;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Team Not Found</CardTitle>
            <CardDescription>
              The requested team could not be found
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/team">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link to="/team">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Team
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
                <p className="text-sm text-muted-foreground">Team Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={team.is_active ? "default" : "secondary"}>
                {team.is_active ? "Active" : "Inactive"}
              </Badge>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-auto gap-2">
            {getEnabledTabs().map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamMembers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active team members
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {teamTasks.filter(t => t.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pending tasks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{permissions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Granted permissions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest team tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {teamTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamTasks.slice(0, 5).map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Current team members</CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No team members found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="font-medium">{member.agents?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{member.agents?.phone}</div>
                        <Badge variant="outline" className="mt-2">
                          {member.agents?.role || 'Unknown Role'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dynamic permission-based tabs would be rendered here */}
          {getEnabledTabs().slice(1).map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>
                    {tab.key === 'team_management' && 'Manage team settings and configuration'}
                    {tab.key === 'task_management' && 'Create and manage team tasks'}
                    {tab.key === 'reports_view' && 'View team performance reports'}
                    {tab.key === 'member_management' && 'Add and remove team members'}
                    {tab.key === 'hierarchy_view' && 'View organizational hierarchy'}
                    {tab.key === 'panchayath_notes' && 'Manage panchayath notes and documentation'}
                    {tab.key === 'settings' && 'Configure team settings'}
                    {tab.key === 'chat' && 'Team communication and chat'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    {tab.label} functionality will be implemented based on your specific requirements.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default TeamAdminDashboard;