import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ArrowLeft, Settings, Users, FileText, Calendar, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  permission_name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface TeamPermission {
  id: string;
  team_id: string;
  permission_id: string;
  permission?: Permission;
}

interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  management_teams?: {
    name: string;
    description?: string;
  };
}

const TeamAllView = () => {
  const [teamPermissions, setTeamPermissions] = useState<TeamPermission[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMember[]>([]);
  const [memberUser, setMemberUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in as member
    const storedUser = localStorage.getItem('member_user');
    if (!storedUser) {
      navigate('/members');
      return;
    }

    const user = JSON.parse(storedUser);
    setMemberUser(user);
    checkTeamMembershipAndPermissions(user);
  }, [navigate]);

  const checkTeamMembershipAndPermissions = async (user: any) => {
    try {
      setIsLoading(true);

      // Get agent data
      let agentData = null;
      const { data: exactMatch, error: exactError } = await supabase
        .from('agents')
        .select('id, name, phone, role, panchayath_id')
        .eq('phone', user.mobileNumber)
        .maybeSingle();

      if (exactMatch && !exactError) {
        agentData = exactMatch;
      } else {
        const { data: nameMatch, error: nameError } = await supabase
          .from('agents')
          .select('id, name, phone, role, panchayath_id')
          .eq('name', user.name)
          .eq('panchayath_id', user.panchayath_id)
          .maybeSingle();

        if (nameMatch && !nameError) {
          agentData = nameMatch;
        }
      }

      if (!agentData) {
        navigate('/team');
        return;
      }

      // Check team memberships
      const { data: teamMemberData, error: teamMemberError } = await supabase
        .from('management_team_members')
        .select(`
          *,
          management_teams(name, description)
        `)
        .eq('agent_id', agentData.id);

      if (teamMemberError) throw teamMemberError;

      if (teamMemberData && teamMemberData.length > 0) {
        setTeamMemberships(teamMemberData);
        
        // Get team permissions for all teams user belongs to
        const teamIds = teamMemberData.map(tm => tm.team_id);
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('team_permissions')
          .select(`
            *,
            permission:admin_permissions(*)
          `)
          .in('team_id', teamIds);

        if (permissionsError) throw permissionsError;
        setTeamPermissions(permissionsData || []);
      } else {
        navigate('/team');
      }
    } catch (error) {
      console.error('Error checking team permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load team permissions",
        variant: "destructive",
      });
      navigate('/team');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'user_management':
        return <Users className="h-4 w-4" />;
      case 'task_management':
        return <Calendar className="h-4 w-4" />;
      case 'reporting':
        return <BarChart3 className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPermissionLink = (permissionName: string) => {
    // Map permission names to actual page routes
    const permissionRoutes: Record<string, string> = {
      'view_users': '/admin/users',
      'manage_tasks': '/team-task-management',
      'view_reports': '/team-reports',
      'manage_teams': '/team-dashboard',
      'agent_management': '/add-agents',
      'view_hierarchy': '/view-hierarchy',
      'panchayath_notes': '/panchayath-notes'
    };

    return permissionRoutes[permissionName] || '#';
  };

  const groupedPermissions = teamPermissions.reduce((acc, teamPerm) => {
    if (teamPerm.permission) {
      const category = teamPerm.permission.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(teamPerm);
    }
    return acc;
  }, {} as Record<string, TeamPermission[]>);

  const categories = Object.keys(groupedPermissions);
  const filteredPermissions = selectedCategory === 'all' 
    ? teamPermissions 
    : groupedPermissions[selectedCategory] || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading team permissions...</p>
        </div>
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
              <h1 className="text-2xl font-bold text-foreground">Team Access View</h1>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {teamMemberships[0]?.management_teams?.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Category Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Available Permissions
              </CardTitle>
              <CardDescription>
                View and access features available to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Permissions ({teamPermissions.length})
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    {getCategoryIcon(category)}
                    {category.replace('_', ' ').toUpperCase()} ({groupedPermissions[category].length})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory === 'all' 
                  ? 'All Team Permissions' 
                  : `${selectedCategory.replace('_', ' ').toUpperCase()} Permissions`
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPermissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No permissions found for the selected category.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPermissions.map((teamPerm) => (
                        <TableRow key={teamPerm.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {teamPerm.permission && getCategoryIcon(teamPerm.permission.category)}
                              <span className="font-medium">
                                {teamPerm.permission?.permission_name.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {teamPerm.permission?.description || 'No description available'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {teamPerm.permission?.category.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={teamPerm.permission?.is_active ? "default" : "destructive"}
                            >
                              {teamPerm.permission?.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {teamPerm.permission?.is_active && (
                              <Link 
                                to={getPermissionLink(teamPerm.permission?.permission_name || '')}
                                className="inline-block"
                              >
                                <Button size="sm" variant="outline">
                                  Access
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{teamPermissions.length}</div>
                  <div className="text-sm text-muted-foreground">Total Permissions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {teamPermissions.filter(tp => tp.permission?.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Permissions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeamAllView;