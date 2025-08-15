import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Users, Building2, CheckSquare, UserCheck, TrendingUp, GitBranch, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { HierarchyTable } from "@/components/HierarchyTable";
import { PanchayathNotes } from "@/components/PanchayathNotes";

interface DashboardStats {
  totalUsers: number;
  totalTeams: number;
  totalTasks: number;
  pendingApprovals: number;
  totalPanchayaths: number;
  totalNotes: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalTasks: 0,
    pendingApprovals: 0,
    totalPanchayaths: 0,
    totalNotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_registration_requests'
        },
        () => {
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'management_teams'
        },
        () => {
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersResult, teamsResult, tasksResult, approvalsResult, panchayathsResult, notesResult] = await Promise.all([
        supabase.from('agents').select('id', { count: 'exact' }),
        supabase.from('management_teams').select('id', { count: 'exact' }),
        supabase.from('tasks').select('id', { count: 'exact' }),
        supabase.from('user_registration_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('panchayaths').select('id', { count: 'exact' }),
        supabase.from('panchayath_notes').select('id', { count: 'exact' })
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalTeams: teamsResult.count || 0,
        totalTasks: tasksResult.count || 0,
        pendingApprovals: approvalsResult.count || 0,
        totalPanchayaths: panchayathsResult.count || 0,
        totalNotes: notesResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users in the system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Management Teams",
      value: stats.totalTeams,
      icon: Building2,
      description: "Active management teams",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckSquare,
      description: "Tasks in the system",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: UserCheck,
      description: "User registrations awaiting approval",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Panchayaths",
      value: stats.totalPanchayaths,
      icon: TrendingUp,
      description: "Total panchayaths managed",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Hierarchy Details",
      value: "View",
      icon: GitBranch,
      description: "Agent hierarchy structure",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      isAction: true,
      actionComponent: "hierarchy"
    },
    {
      title: "Panchayath Notes",
      value: stats.totalNotes,
      icon: FileText,
      description: "Total notes recorded",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      isAction: true,
      actionComponent: "notes"
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of system statistics and real-time updates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.title === "Pending Approvals" && typeof card.value === 'number' && card.value > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Needs Attention
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live updates from the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">Real-time updates enabled</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Live
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Dashboard automatically updates when data changes
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                • Review pending user approvals
              </div>
              <div className="text-sm">
                • Manage team assignments
              </div>
              <div className="text-sm">
                • Monitor task progress
              </div>
              <div className="text-sm">
                • Update system settings
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Hierarchy Management
            </CardTitle>
            <CardDescription>View and manage agent hierarchy structure</CardDescription>
          </CardHeader>
          <CardContent>
            <HierarchyTable agents={[]} panchayathName="All Panchayaths" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Panchayath Notes Management
            </CardTitle>
            <CardDescription>Manage notes and updates for panchayaths</CardDescription>
          </CardHeader>
          <CardContent>
            <PanchayathNotes />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};