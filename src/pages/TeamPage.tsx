import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Calendar, MessageSquare, Eye, CheckCircle, XCircle, ArrowLeft, Send, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'normal';
  due_date?: string;
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

interface ChatMessage {
  id: string;
  team_id: string;
  task_id?: string;
  message: string;
  sender_name: string;
  created_at: string;
}

export default function TeamPage() {
  const [memberUser, setMemberUser] = useState<any>(null);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMember[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [taskRemarks, setTaskRemarks] = useState<TaskRemark[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeamMember, setIsTeamMember] = useState(false);
  
  // Dialog states
  const [remarks, setRemarks] = useState('');
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
  const [isViewRemarksDialogOpen, setIsViewRemarksDialogOpen] = useState(false);
  const [existingRemarks, setExistingRemarks] = useState<TaskRemark[]>([]);
  const [pendingStatus, setPendingStatus] = useState<'completed' | 'cancelled' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Chat states
  const [newMessage, setNewMessage] = useState('');
  const [selectedTaskForChat, setSelectedTaskForChat] = useState<string | null>(null);
  
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
    checkTeamMembership(user);
  }, [navigate]);

  const checkTeamMembership = async (user: any) => {
    try {
      setLoading(true);

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
        setIsTeamMember(false);
        setLoading(false);
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
        setIsTeamMember(true);
        setTeamMemberships(teamMemberData);
        await fetchTeamData(teamMemberData);
      } else {
        setIsTeamMember(false);
      }
    } catch (error) {
      console.error('Error checking team membership:', error);
      toast({
        title: "Error",
        description: "Failed to check team membership",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async (teamMemberData: TeamMember[]) => {
    try {
      const teamIds = teamMemberData.map(tm => tm.team_id);
      
      // Fetch team tasks
      const { data: teamTasksData, error: teamTasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('allocated_to_team', teamIds[0])
        .order('created_at', { ascending: false });

      if (teamTasksError) throw teamTasksError;
      setTeamTasks(teamTasksData || []);

      // Fetch all team members
      const { data: allTeamMembersData, error: allTeamMembersError } = await supabase
        .from('management_team_members')
        .select(`
          *,
          management_teams(name, description),
          agents(name, phone, role)
        `)
        .in('team_id', teamIds);

      if (allTeamMembersError) throw allTeamMembersError;
      setAllTeamMembers(allTeamMembersData || []);

      // Fetch task remarks
      if (teamTasksData && teamTasksData.length > 0) {
        const taskIds = teamTasksData.map(task => task.id);
        const { data: remarksData, error: remarksError } = await supabase
          .from('task_remarks')
          .select('*')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false });

        if (remarksError) throw remarksError;
        setTaskRemarks(remarksData || []);
      }

      // Fetch chat messages (we'll create this table)
      await fetchChatMessages(teamIds[0]);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team data",
        variant: "destructive",
      });
    }
  };

  const fetchChatMessages = async (teamId: string) => {
    try {
      // For now, we'll use task_remarks as chat messages
      // In a real implementation, you'd create a separate chat_messages table
      const { data: messagesData, error: messagesError } = await supabase
        .from('task_remarks')
        .select('*')
        .eq('task_id', selectedTaskForChat || '')
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData) {
        const chatData = messagesData.map(remark => ({
          id: remark.id,
          team_id: teamId,
          task_id: remark.task_id,
          message: remark.remark,
          sender_name: remark.updated_by || 'Unknown',
          created_at: remark.created_at
        }));
        setChatMessages(chatData);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTaskForChat) return;

    try {
      const { error } = await supabase
        .from('task_remarks')
        .insert({
          task_id: selectedTaskForChat,
          remark: newMessage.trim(),
          updated_by: memberUser.name || memberUser.mobileNumber
        });

      if (error) throw error;

      setNewMessage('');
      await fetchChatMessages(teamMemberships[0]?.team_id);
      
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
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
      const { data, error } = await supabase
        .from('task_remarks')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingRemarks(data || []);
      setSelectedTask(task);
      setIsViewRemarksDialogOpen(true);
    } catch (error) {
      console.error('Error fetching remarks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch task remarks",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'completed' | 'cancelled') => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      if (remarks.trim()) {
        const { error: remarkError } = await supabase
          .from('task_remarks')
          .insert({
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
        description: `Task marked as ${newStatus}`,
      });
      
      setIsRemarksDialogOpen(false);
      setRemarks('');
      setPendingStatus(null);
      setSelectedTask(null);
      
      // Refresh data
      await fetchTeamData(teamMemberships);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading team page...</p>
        </div>
      </div>
    );
  }

  if (!isTeamMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You are not a team member
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600">
              Contact your administrator to be added to a team.
            </p>
            <Link to="/member-dashboard">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link to="/member-dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">{teamMemberships[0]?.management_teams?.name}</span>
              </div>
              <Link to="/team-all-view" className="text-blue-600 hover:text-blue-800">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  All View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Tasks - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Team Tasks
                </CardTitle>
                <CardDescription>
                  Tasks assigned to your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No team tasks found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {task.description || 'No description'}
                                </div>
                              </div>
                            </TableCell>
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
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedTaskForChat(task.id);
                                    fetchChatMessages(teamMemberships[0]?.team_id);
                                  }}
                                  className="h-8 px-2"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => fetchTaskRemarks(task)}
                                  className="h-8 px-2"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {task.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => openRemarksDialog(task, 'completed')}
                                      className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openRemarksDialog(task, 'cancelled')}
                                      className="h-8 px-2"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Members & Chat - Right Side */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allTeamMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">{member.agents?.name}</div>
                      <div className="text-sm text-gray-600">{member.agents?.phone}</div>
                      <div className="text-xs text-gray-500">{member.agents?.role}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Task Chat */}
            {selectedTaskForChat && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Task Discussion
                  </CardTitle>
                  <CardDescription>
                    Chat about the selected task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="h-64 overflow-y-auto border rounded p-3 bg-gray-50 space-y-2">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm">
                          No messages yet. Start the discussion!
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div key={message.id} className="bg-white p-2 rounded shadow-sm">
                            <div className="font-medium text-sm text-blue-700">
                              {message.sender_name}
                            </div>
                            <div className="text-sm">{message.message}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Remarks Dialog */}
      <Dialog open={isRemarksDialogOpen} onOpenChange={setIsRemarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {pendingStatus === 'completed' ? 'Complete Task' : 
               pendingStatus === 'cancelled' ? 'Cancel Task' : 'Add Remark'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus 
                ? `Mark task as ${pendingStatus} and add optional remark`
                : 'Add a remark to this task'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter your remarks here..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRemarksDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTask && (pendingStatus 
                  ? handleStatusChange(selectedTask, pendingStatus)
                  : (() => {
                      // Add remark only
                      if (remarks.trim()) {
                        supabase
                          .from('task_remarks')
                          .insert({
                            task_id: selectedTask.id,
                            remark: remarks.trim(),
                            updated_by: memberUser.name || memberUser.mobileNumber
                          });
                      }
                      setIsRemarksDialogOpen(false);
                      setRemarks('');
                      setSelectedTask(null);
                    })()
                )}
              >
                {pendingStatus ? `Mark as ${pendingStatus}` : 'Add Remark'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Remarks Dialog */}
      <Dialog open={isViewRemarksDialogOpen} onOpenChange={setIsViewRemarksDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Task Remarks
            </DialogTitle>
            <DialogDescription>
              All remarks for this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {existingRemarks.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No remarks found for this task.
              </div>
            ) : (
              existingRemarks.map((remark) => (
                <div key={remark.id} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm text-blue-700">
                    {remark.updated_by}
                  </div>
                  <div className="text-sm mt-1">{remark.remark}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(remark.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsViewRemarksDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}