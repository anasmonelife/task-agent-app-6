import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, Settings, Eye, Calendar, BarChart3, MessageSquare, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

interface Permission {
  id: string;
  permission_name: string;
  description?: string;
  created_at: string;
}

interface TeamPermission {
  id: string;
  team_id: string;
  permission_id: string;
  granted_by?: string;
  created_at: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'team_management', label: 'Team Management', icon: Users, description: 'Manage team settings and configuration' },
  { key: 'task_management', label: 'Task Management', icon: Calendar, description: 'Create and manage team tasks' },
  { key: 'reports_view', label: 'Reports View', icon: BarChart3, description: 'View team performance reports' },
  { key: 'member_management', label: 'Member Management', icon: Users, description: 'Add and remove team members' },
  { key: 'hierarchy_view', label: 'Hierarchy View', icon: Eye, description: 'View organizational hierarchy' },
  { key: 'panchayath_notes', label: 'Panchayath Notes', icon: FileText, description: 'Manage panchayath notes and documentation' },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'Configure team settings' },
  { key: 'chat', label: 'Team Chat', icon: MessageSquare, description: 'Team communication and chat' },
];

const AdminTeamPermissions = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('management_teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch available permissions
      const { data: availablePermissionsData, error: availablePermissionsError } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('permission_name');

      if (availablePermissionsError) {
        console.error('Error fetching available permissions:', availablePermissionsError);
      } else {
        setAvailablePermissions(availablePermissionsData || []);
      }

      // Fetch team permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('team_permissions')
        .select('*');

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        // Don't throw error, permissions table might not exist yet
      } else {
        setPermissions(permissionsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (teamId: string, permissionId: string) => {
    return permissions.some(p => p.team_id === teamId && p.permission_id === permissionId);
  };

  const togglePermission = async (teamId: string, permissionId: string, hasPermission: boolean) => {
    try {
      const currentUser = localStorage.getItem('adminUser') || localStorage.getItem('admin_user');
      const adminData = currentUser ? JSON.parse(currentUser) : null;
      const grantedBy = adminData?.id || 'admin';

      if (hasPermission) {
        // Remove permission
        const { error } = await supabase
          .from('team_permissions')
          .delete()
          .eq('team_id', teamId)
          .eq('permission_id', permissionId);

        if (error) throw error;
      } else {
        // Add permission
        const { error } = await supabase
          .from('team_permissions')
          .insert({
            team_id: teamId,
            permission_id: permissionId,
            granted_by: grantedBy
          });

        if (error) throw error;
      }

      // Refresh permissions
      await fetchData();
      
      toast({
        title: "Success",
        description: `Permission ${hasPermission ? 'removed' : 'granted'} successfully`,
      });

    } catch (error) {
      console.error('Error toggling permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    }
  };

  const getTeamPermissions = (teamId: string) => {
    return permissions.filter(p => p.team_id === teamId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading team permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Permissions Management
          </CardTitle>
          <CardDescription>
            Manage permissions for each team to control access to different features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Filter by Team:</label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No teams found. Create teams first to manage their permissions.
            </div>
          ) : (
            <div className="space-y-6">
              {teams
                .filter(team => !selectedTeam || selectedTeam === 'all' || team.id === selectedTeam)
                .map((team) => (
                  <Card key={team.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          {team.description && (
                            <CardDescription>{team.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={team.is_active ? "default" : "secondary"}>
                            {team.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {getTeamPermissions(team.id).length} permissions
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availablePermissions.map((permission) => {
                          const teamHasPermission = hasPermission(team.id, permission.id);
                          
                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{permission.permission_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {permission.description || 'No description available'}
                                  </div>
                                </div>
                              </div>
                              <Switch
                                checked={teamHasPermission}
                                onCheckedChange={() => 
                                  togglePermission(team.id, permission.id, teamHasPermission)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Summary</CardTitle>
          <CardDescription>
            Overview of all team permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Active Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      {team.description && (
                        <div className="text-sm text-muted-foreground">
                          {team.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getTeamPermissions(team.id).map((permission) => {
                        const permissionDef = availablePermissions.find(p => p.id === permission.permission_id);
                        return (
                          <Badge key={permission.id} variant="secondary" className="text-xs">
                            {permissionDef?.permission_name || permission.permission_id}
                          </Badge>
                        );
                      })}
                      {getTeamPermissions(team.id).length === 0 && (
                        <span className="text-sm text-muted-foreground">No permissions</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.is_active ? "default" : "secondary"}>
                      {team.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamPermissions;