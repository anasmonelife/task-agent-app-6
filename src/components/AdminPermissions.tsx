import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, Edit, Trash2, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Permission {
  id: string;
  permission_name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
}

interface UserPermission {
  id: string;
  admin_user_id: string;
  permission_id: string;
  granted_by: string | null;
  created_at: string;
  permission?: Permission;
  admin_user?: AdminUser;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  panchayath_id: string;
  created_at: string;
  updated_at: string;
}

interface TeamPermission {
  id: string;
  agent_id: string;
  permission_id: string;
  granted_by: string | null;
  created_at: string;
  permission?: Permission;
  agent?: TeamMember;
}

const AdminPermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamPermissions, setTeamPermissions] = useState<TeamPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'permissions' | 'user-permissions' | 'team-permissions'>('permissions');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserPermissionDialogOpen, setIsUserPermissionDialogOpen] = useState(false);
  const [isTeamPermissionDialogOpen, setIsTeamPermissionDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    permission_name: '',
    description: '',
    category: '',
    is_active: true
  });
  const [userPermissionForm, setUserPermissionForm] = useState({
    admin_user_id: '',
    permission_id: ''
  });
  const [teamPermissionForm, setTeamPermissionForm] = useState({
    agent_id: '',
    permission_ids: [] as string[]
  });
  const [teamMemberSearch, setTeamMemberSearch] = useState('');
  const { toast } = useToast();

  const categories = [
    'User Management',
    'Team Management', 
    'Task Management',
    'Points Management',
    'Panchayath Management',
    'Reports',
    'Notifications',
    'System Settings',
    'Permissions'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('permission_name', { ascending: true });

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

      // Fetch admin users
      const { data: usersData, error: usersError } = await supabase
        .from('admin_users')
        .select('*')
        .order('username', { ascending: true });

      if (usersError) throw usersError;
      setAdminUsers(usersData || []);

      // Fetch user permissions with joins - specify the relationship
      const { data: userPermissionsData, error: userPermissionsError } = await supabase
        .from('admin_role_permissions')
        .select(`
          *,
          permission:admin_permissions(*),
          admin_user:admin_users!admin_role_permissions_admin_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (userPermissionsError) throw userPermissionsError;
      setUserPermissions((userPermissionsData as any) || []);

      // Fetch team members (only agents that are part of management teams)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('management_team_members')
        .select(`
          agent_id,
          agents!inner (
            id,
            name,
            phone,
            email,
            role,
            panchayath_id,
            created_at,
            updated_at
          )
        `)
        .order('agents(name)', { ascending: true });

      if (teamMembersError) throw teamMembersError;
      
      // Transform the data to match TeamMember interface
      const transformedTeamMembers = teamMembersData?.map(item => ({
        id: item.agents.id,
        name: item.agents.name,
        role: item.agents.role,
        email: item.agents.email || '',
        phone: item.agents.phone || '',
        panchayath_id: item.agents.panchayath_id,
        created_at: item.agents.created_at,
        updated_at: item.agents.updated_at
      })) || [];
      
      setTeamMembers(transformedTeamMembers);

      // Note: Team permissions feature requires agent_permissions table to be created
      // For now, we'll keep team permissions as an empty array
      setTeamPermissions([]);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch permissions data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPermission) {
        // Update existing permission
        const { error } = await supabase
          .from('admin_permissions')
          .update(formData)
          .eq('id', editingPermission.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Permission updated successfully"
        });
      } else {
        // Create new permission
        const { error } = await supabase
          .from('admin_permissions')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Permission created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingPermission(null);
      setFormData({
        permission_name: '',
        description: '',
        category: '',
        is_active: true
      });
      fetchData();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast({
        title: "Error",
        description: "Failed to save permission",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      permission_name: permission.permission_name,
      description: permission.description,
      category: permission.category,
      is_active: permission.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Permission deleted successfully"
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive"
      });
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('admin_role_permissions')
        .insert([{
          admin_user_id: userPermissionForm.admin_user_id,
          permission_id: userPermissionForm.permission_id,
          granted_by: null // You can set this to the current admin user ID
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Permission granted successfully"
      });
      
      setIsUserPermissionDialogOpen(false);
      setUserPermissionForm({
        admin_user_id: '',
        permission_id: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error granting permission:', error);
      toast({
        title: "Error",
        description: "Failed to grant permission",
        variant: "destructive"
      });
    }
  };

  const handleRevokePermission = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this permission?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_role_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Permission revoked successfully"
      });
      fetchData();
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast({
        title: "Error",
        description: "Failed to revoke permission",
        variant: "destructive"
      });
    }
  };

  const handleGrantTeamPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (teamPermissionForm.permission_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one permission",
        variant: "destructive"
      });
      return;
    }
    
    // Since agent_permissions table doesn't exist yet, show a setup message
    toast({
      title: "Setup Required",
      description: "Team permissions feature needs to be set up in the database. Please contact your system administrator.",
      variant: "destructive"
    });
  };

  const handleRevokeTeamPermission = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this team permission?')) return;
    
    // Since agent_permissions table doesn't exist yet, show a setup message
    toast({
      title: "Setup Required",
      description: "Team permissions feature needs to be set up in the database. Please contact your system administrator.",
      variant: "destructive"
    });
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">Loading permissions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Permissions Management
          </CardTitle>
          <CardDescription>
            Manage system permissions and user access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b mb-6">
            <Button
              variant={selectedTab === 'permissions' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('permissions')}
              className="rounded-b-none"
            >
              <Settings className="h-4 w-4 mr-2" />
              Permissions
            </Button>
            <Button
              variant={selectedTab === 'user-permissions' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('user-permissions')}
              className="rounded-b-none"
            >
              <Users className="h-4 w-4 mr-2" />
              User Permissions
            </Button>
            <Button
              variant={selectedTab === 'team-permissions' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('team-permissions')}
              className="rounded-b-none"
            >
              <Users className="h-4 w-4 mr-2" />
              Team Permissions
            </Button>
          </div>

          {/* Permissions Tab */}
          {selectedTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">System Permissions</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPermission ? 'Edit Permission' : 'Add New Permission'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPermission ? 'Update permission details' : 'Create a new system permission'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="permission_name">Permission Name</Label>
                          <Input
                            id="permission_name"
                            value={formData.permission_name}
                            onChange={(e) => setFormData({ ...formData, permission_name: e.target.value })}
                            placeholder="e.g., users.create"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what this permission allows"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                          <Label htmlFor="is_active">Active</Label>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit">
                          {editingPermission ? 'Update' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-base">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Permission</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryPermissions.map((permission) => (
                            <TableRow key={permission.id}>
                              <TableCell className="font-mono text-sm">
                                {permission.permission_name}
                              </TableCell>
                              <TableCell>{permission.description}</TableCell>
                              <TableCell>
                                <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                                  {permission.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(permission)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(permission.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* User Permissions Tab */}
          {selectedTab === 'user-permissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">User Permission Assignments</h3>
                <Dialog open={isUserPermissionDialogOpen} onOpenChange={setIsUserPermissionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Grant Permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Grant Permission to User</DialogTitle>
                      <DialogDescription>
                        Assign a specific permission to an admin user
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGrantPermission}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="admin_user">Admin User</Label>
                          <Select 
                            value={userPermissionForm.admin_user_id} 
                            onValueChange={(value) => setUserPermissionForm({ ...userPermissionForm, admin_user_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select admin user" />
                            </SelectTrigger>
                            <SelectContent>
                              {adminUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.username} ({user.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="permission">Permission</Label>
                          <Select 
                            value={userPermissionForm.permission_id} 
                            onValueChange={(value) => setUserPermissionForm({ ...userPermissionForm, permission_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select permission" />
                            </SelectTrigger>
                            <SelectContent>
                              {permissions.filter(p => p.is_active).map((permission) => (
                                <SelectItem key={permission.id} value={permission.id}>
                                  {permission.permission_name} - {permission.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit">Grant Permission</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Granted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userPermissions.map((userPermission) => (
                        <TableRow key={userPermission.id}>
                          <TableCell>{userPermission.admin_user?.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {userPermission.admin_user?.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {userPermission.permission?.permission_name}
                          </TableCell>
                          <TableCell>{userPermission.permission?.category}</TableCell>
                          <TableCell>
                            {new Date(userPermission.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokePermission(userPermission.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {userPermissions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No permission assignments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Permissions Tab */}
          {selectedTab === 'team-permissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Team Permission Assignments</h3>
                 <Dialog open={isTeamPermissionDialogOpen} onOpenChange={(open) => {
                   setIsTeamPermissionDialogOpen(open);
                   if (!open) {
                     setTeamPermissionForm({
                       agent_id: '',
                       permission_ids: []
                     });
                     setTeamMemberSearch('');
                   }
                 }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Grant Permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Grant Permission to Team Member</DialogTitle>
                      <DialogDescription>
                        Assign a specific permission to a team member
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGrantTeamPermission}>
                      <div className="space-y-4">
                         <div>
                           <Label htmlFor="search_member">Search Team Member by Mobile Number</Label>
                           <Input
                             id="search_member"
                             value={teamMemberSearch}
                             onChange={(e) => setTeamMemberSearch(e.target.value)}
                             placeholder="Enter mobile number (e.g. 9876543210)"
                             className="mb-2"
                           />
                           {teamMemberSearch && (
                             <p className="text-sm text-muted-foreground">
                               Found {teamMembers.filter(member => 
                                 member.phone && member.phone.includes(teamMemberSearch)
                               ).length} team member(s) matching "{teamMemberSearch}"
                             </p>
                           )}
                         </div>
                         <div>
                           <Label htmlFor="team_member">Team Member</Label>
                           <Select 
                             value={teamPermissionForm.agent_id} 
                             onValueChange={(value) => setTeamPermissionForm({ ...teamPermissionForm, agent_id: value })}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder={
                                 teamMemberSearch 
                                   ? "Select from filtered team members" 
                                   : "Select team member (or search by mobile above)"
                               } />
                             </SelectTrigger>
                             <SelectContent>
                               {teamMembers
                                 .filter(member => {
                                   if (!teamMemberSearch) return true;
                                   return member.phone && member.phone.includes(teamMemberSearch);
                                 })
                                 .map((member) => (
                                 <SelectItem key={member.id} value={member.id}>
                                   {member.name} ({member.role}){member.phone && ` - ${member.phone}`}
                                 </SelectItem>
                               ))}
                               {teamMembers
                                 .filter(member => {
                                   if (!teamMemberSearch) return true;
                                   return member.phone && member.phone.includes(teamMemberSearch);
                                 }).length === 0 && teamMemberSearch && (
                                 <SelectItem value="" disabled>
                                   No team members found with mobile: {teamMemberSearch}
                                 </SelectItem>
                               )}
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>
                             Permissions {teamPermissionForm.permission_ids.length > 0 && 
                               <span className="text-muted-foreground">({teamPermissionForm.permission_ids.length} selected)</span>}
                           </Label>
                           <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-4">
                             {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                               <div key={category}>
                                 <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                                 <div className="space-y-2">
                                   {categoryPermissions
                                     .filter(p => p.is_active)
                                     .map((permission) => (
                                     <div key={permission.id} className="flex items-start space-x-2">
                                       <input
                                         type="checkbox"
                                         id={`team-permission-${permission.id}`}
                                         checked={teamPermissionForm.permission_ids.includes(permission.id)}
                                         onChange={(e) => {
                                           const isChecked = e.target.checked;
                                           const currentIds = teamPermissionForm.permission_ids;
                                           
                                           if (isChecked) {
                                             setTeamPermissionForm({
                                               ...teamPermissionForm,
                                               permission_ids: [...currentIds, permission.id]
                                             });
                                           } else {
                                             setTeamPermissionForm({
                                               ...teamPermissionForm,
                                               permission_ids: currentIds.filter(id => id !== permission.id)
                                             });
                                           }
                                         }}
                                         className="mt-1"
                                       />
                                       <label 
                                         htmlFor={`team-permission-${permission.id}`}
                                         className="text-sm cursor-pointer flex-1"
                                       >
                                         <div className="font-medium">{permission.permission_name}</div>
                                         {permission.description && (
                                           <div className="text-muted-foreground text-xs">{permission.description}</div>
                                         )}
                                       </label>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit">Grant Permission</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Granted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamPermissions.map((teamPermission) => (
                        <TableRow key={teamPermission.id}>
                          <TableCell>{teamPermission.agent?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {teamPermission.agent?.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {teamPermission.permission?.permission_name}
                          </TableCell>
                          <TableCell>{teamPermission.permission?.category}</TableCell>
                          <TableCell>
                            {new Date(teamPermission.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeTeamPermission(teamPermission.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {teamPermissions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No team permission assignments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissions;