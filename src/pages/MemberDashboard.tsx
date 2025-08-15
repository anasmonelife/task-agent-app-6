import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Users, Calendar, Clock, MapPin, Phone, Mail, LogOut, Home, CheckCircle, XCircle, MessageSquare, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PersonalTaskCard from "@/components/PersonalTaskCard";
import TeamTaskCard from "@/components/TeamTaskCard";
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'normal';
  due_date?: string;
  assigned_to?: string;
  team_id?: string;
  created_at: string;
}
interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  management_teams?: {
    name: string;
    description?: string;
  };
  agents?: {
    name: string;
    phone?: string;
    role?: string;
  };
}
interface TaskRemark {
  id: string;
  task_id: string;
  remark: string;
  updated_by?: string;
  created_at: string;
}
export default function MemberDashboard() {
  const [memberUser, setMemberUser] = useState<any>(null);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [remarks, setRemarks] = useState('');
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
  const [isViewRemarksDialogOpen, setIsViewRemarksDialogOpen] = useState(false);
  const [existingRemarks, setExistingRemarks] = useState<TaskRemark[]>([]);
  const [pendingStatus, setPendingStatus] = useState<'completed' | 'cancelled' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const {
    toast
  } = useToast();
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
    fetchData(user);
  }, [navigate]);
  const fetchData = async (user: any) => {
    try {
      setLoading(true);

      // First get agent data, try multiple approaches to find the agent
      let agentData = null;
      let agentError = null;

      // Try exact phone match first
      const {
        data: exactMatch,
        error: exactError
      } = await supabase.from('agents').select('id, name, phone, role, panchayath_id').eq('phone', user.mobileNumber).maybeSingle();
      if (exactMatch && !exactError) {
        agentData = exactMatch;
      } else {
        // Try name + panchayath match as fallback for Sajna's case
        const {
          data: nameMatch,
          error: nameError
        } = await supabase.from('agents').select('id, name, phone, role, panchayath_id').eq('name', user.name).eq('panchayath_id', user.panchayath_id).maybeSingle();
        if (nameMatch && !nameError) {
          agentData = nameMatch;
          console.log('Found agent by name + panchayath match:', nameMatch);
        } else {
          console.log('Agent lookup failed for user:', user);
          agentError = nameError || exactError;
        }
      }
      let personalTasksData = [];
      if (agentData && !agentError) {
        // Fetch personal tasks (tasks assigned to this agent ID)
        const {
          data: tasksData,
          error: personalError
        } = await supabase.from('tasks').select('*').eq('allocated_to_agent', agentData.id).order('created_at', {
          ascending: false
        });
        if (personalError) throw personalError;
        personalTasksData = tasksData || [];
      } else {
        // Also try with mobile number as fallback
        const {
          data: tasksData,
          error: personalError
        } = await supabase.from('tasks').select('*').eq('allocated_to_agent', user.mobileNumber).order('created_at', {
          ascending: false
        });
        if (!personalError) {
          personalTasksData = tasksData || [];
        }
      }
      setPersonalTasks(personalTasksData || []);

      // Check team memberships for this agent (reuse agentData from above)
      let teamMemberData = [];
      if (agentData && !agentError) {
        const {
          data: teamMemberQueryData,
          error: teamMemberError
        } = await supabase.from('management_team_members').select(`
            *,
            management_teams(name, description)
          `).eq('agent_id', agentData.id);
        if (teamMemberError) throw teamMemberError;
        teamMemberData = teamMemberQueryData || [];
      }
      setTeamMemberships(teamMemberData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('member_user');
    navigate('/');
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

  // Action functions for tasks
  const handleStatusChange = async (task: Task, newStatus: 'completed' | 'cancelled') => {
    try {
      const {
        error: taskError
      } = await supabase.from('tasks').update({
        status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('id', task.id);
      if (taskError) throw taskError;

      // Add remarks if provided
      if (remarks.trim()) {
        const {
          error: remarkError
        } = await supabase.from('task_remarks').insert({
          task_id: task.id,
          remark: remarks.trim(),
          updated_by: memberUser.name || memberUser.mobileNumber
        });
        if (remarkError) {
          console.error('Error adding remark:', remarkError);
        }
      }
      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`
      });
      setIsRemarksDialogOpen(false);
      setRemarks('');
      setPendingStatus(null);
      setSelectedTask(null);
      fetchData(memberUser);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
    }
  };
  const handleAddRemark = async (task: Task) => {
    if (!remarks.trim()) return;
    try {
      const {
        error
      } = await supabase.from('task_remarks').insert({
        task_id: task.id,
        remark: remarks.trim(),
        updated_by: memberUser.name || memberUser.mobileNumber
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Remark added successfully"
      });
      setIsRemarksDialogOpen(false);
      setRemarks('');
      setSelectedTask(null);
      fetchData(memberUser);
    } catch (error) {
      console.error('Error adding remark:', error);
      toast({
        title: "Error",
        description: "Failed to add remark",
        variant: "destructive"
      });
    }
  };
  const openRemarksDialog = (task: Task, status?: 'completed' | 'cancelled') => {
    setSelectedTask(task);
    setPendingStatus(status || null);
    setIsRemarksDialogOpen(true);
  };
  const fetchTaskRemarks = async (task: Task) => {
    try {
      const {
        data,
        error
      } = await supabase.from('task_remarks').select('*').eq('task_id', task.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setExistingRemarks(data || []);
      setSelectedTask(task);
      setIsViewRemarksDialogOpen(true);
    } catch (error) {
      console.error('Error fetching remarks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch task remarks",
        variant: "destructive"
      });
    }
  };
  const pendingPersonalTasks = personalTasks.filter(task => task.status === 'pending');
  const completedPersonalTasks = personalTasks.filter(task => task.status === 'completed');
  if (!memberUser) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in as a member to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/members">
              <Button className="mt-4">Go to Members Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>;
  }
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Member Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-wrap bg-cyan-400">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">{memberUser.name}</span>
                <Badge variant="secondary" className="text-xs">{memberUser.agent?.role}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-slate-50 bg-slate-600 hover:bg-slate-500">
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Home
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm bg-[#ff0000]/[0.57]">
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Mobile:</span>
                  <span className="font-medium">{memberUser.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Panchayath:</span>
                  <span className="font-medium">{memberUser.agent?.panchayaths?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{memberUser.agent?.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Teams:</span>
                  <span className="font-medium">{teamMemberships.length}</span>
                </div>
              </div>

              {/* Task Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Task Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm text-yellow-600">Pending Personal Tasks</div>
                    <div className="text-2xl font-bold text-yellow-800">{pendingPersonalTasks.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600">Completed Personal Tasks</div>
                    <div className="text-2xl font-bold text-green-800">{completedPersonalTasks.length}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600">Team Membership</div>
                    <div className="text-2xl font-bold text-blue-800">{teamMemberships.length > 0 ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Access Button */}
        {teamMemberships.length > 0 && <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Access
              </CardTitle>
              <CardDescription>
                Access your team management area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/team">
                <Button className="w-full sm:w-auto">
                  <Users className="h-4 w-4 mr-2" />
                  Go to Team Page
                </Button>
              </Link>
            </CardContent>
          </Card>}

        {/* Personal Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Tasks
            </CardTitle>
            <CardDescription>
              Tasks specifically assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Pending ({pendingPersonalTasks.length})</span>
                  <span className="sm:hidden">Pending ({pendingPersonalTasks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Completed ({completedPersonalTasks.length})</span>
                  <span className="sm:hidden">Done ({completedPersonalTasks.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Personal Tasks</CardTitle>
                    <CardDescription>
                      Tasks specifically assigned to you that need attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingPersonalTasks.length === 0 ? <div className="text-center py-8 text-gray-500">
                        No pending personal tasks found.
                      </div> : <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingPersonalTasks.map(task => <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.description || 'No description'}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(task.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 flex-wrap">
                                    <Button size="sm" variant="ghost" onClick={() => fetchTaskRemarks(task)} className="h-8 px-2 text-xs">
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openRemarksDialog(task)} className="h-8 px-2 text-xs">
                                      <MessageSquare className="h-3 w-3" />
                                    </Button>
                                    {task.status === 'pending' && <>
                                        <Button size="sm" variant="default" onClick={() => openRemarksDialog(task, 'completed')} className="bg-green-600 hover:bg-green-700 h-8 px-2 text-xs">
                                          <CheckCircle className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => openRemarksDialog(task, 'cancelled')} className="h-8 px-2 text-xs">
                                          <XCircle className="h-3 w-3" />
                                        </Button>
                                      </>}
                                  </div>
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Personal Tasks</CardTitle>
                    <CardDescription>
                      Your completed tasks with completion details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {completedPersonalTasks.length === 0 ? <div className="text-center py-8 text-gray-500">
                        No completed personal tasks found.
                      </div> : <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedPersonalTasks.map(task => <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.description || 'No description'}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(task.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Remarks Dialog */}
      <Dialog open={isRemarksDialogOpen} onOpenChange={setIsRemarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {pendingStatus === 'completed' ? 'Complete Task' : pendingStatus === 'cancelled' ? 'Cancel Task' : 'Add Remark'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus ? 'Add remarks about this task (optional)' : 'Add a remark to this task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" placeholder="Enter any comments or remarks about this task..." value={remarks} onChange={e => setRemarks(e.target.value)} rows={4} />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
              setIsRemarksDialogOpen(false);
              setRemarks('');
              setPendingStatus(null);
              setSelectedTask(null);
            }}>
                Cancel
              </Button>
              {pendingStatus ? <Button onClick={() => selectedTask && handleStatusChange(selectedTask, pendingStatus)} className={pendingStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''} variant={pendingStatus === 'completed' ? 'default' : 'destructive'}>
                  {pendingStatus === 'completed' ? 'Complete Task' : 'Cancel Task'}
                </Button> : <Button onClick={() => selectedTask && handleAddRemark(selectedTask)} disabled={!remarks.trim()}>
                  Add Remark
                </Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Remarks Dialog */}
      <Dialog open={isViewRemarksDialogOpen} onOpenChange={setIsViewRemarksDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Task Remarks
            </DialogTitle>
            <DialogDescription>
              View all remarks and comments for this task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {existingRemarks.length === 0 ? <p className="text-gray-500 text-center py-4">No remarks found for this task.</p> : existingRemarks.map(remark => <div key={remark.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{remark.updated_by}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(remark.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{remark.remark}</p>
                </div>)}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewRemarksDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}