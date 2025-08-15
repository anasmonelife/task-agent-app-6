import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Home, 
  Users, UserCheck, Building2, CheckSquare, 
  FileText, Bell, BarChart3, Calendar, MessageSquare, Eye, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { AdminDashboard } from "@/components/AdminDashboard";
import UserManagement from "@/components/UserManagement";
import MemberApprovals from "@/components/MemberApprovals";
import TeamManagement from "@/components/TeamManagement";
import EnhancedTaskManagement from "@/components/EnhancedTaskManagement";
import PanchayathManagement from "@/components/PanchayathManagement";
import AdminReports from "@/components/AdminReports";
import AdminNotifications from "@/components/AdminNotifications";
import { AdminHierarchyDetails } from "@/components/AdminHierarchyDetails";
import { PanchayathNotes } from "@/components/PanchayathNotes";

const RestrictedAdminPanel = () => {
  const { adminUser, logout } = useAdminAuth();
  const [activeView, setActiveView] = useState<string | null>(null);

  if (!adminUser) {
    return null;
  }

  // Define permission-based card mapping
  const permissionCardMap = {
    'team_management': {
      id: 'teams',
      title: 'Team Management',
      description: 'Manage team settings and configuration',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      component: <TeamManagement />
    },
    'task_management': {
      id: 'tasks',
      title: 'Task Management',
      description: 'Create and manage team tasks',
      icon: CheckSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      component: <EnhancedTaskManagement />
    },
    'reports_view': {
      id: 'reports',
      title: 'Reports',
      description: 'View team performance reports',
      icon: BarChart3,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      component: <AdminReports />
    },
    'member_management': {
      id: 'users',
      title: 'Member Management',
      description: 'Add and manage team members',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      component: <UserManagement />
    },
    'hierarchy_view': {
      id: 'hierarchy',
      title: 'Hierarchy View',
      description: 'View organizational hierarchy',
      icon: Eye,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      component: <div className="p-4"><AdminHierarchyDetails /></div>
    },
    'panchayath_notes': {
      id: 'panchayath-notes',
      title: 'Panchayath Notes',
      description: 'Manage panchayath notes and documentation',
      icon: MessageSquare,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      component: <div className="p-4"><PanchayathNotes /></div>
    },
    'settings': {
      id: 'panchayaths',
      title: 'Panchayath Settings',
      description: 'Configure panchayath data',
      icon: Settings,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      component: <PanchayathManagement />
    },
    'chat': {
      id: 'notifications',
      title: 'Team Communications',
      description: 'Team notifications and communications',
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      component: <AdminNotifications />
    }
  };

  // Always show dashboard, and approvals if they have member management
  const defaultCards = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Team overview and statistics',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      component: <AdminDashboard />
    }
  ];

  // Add member approvals if user has member management permission
  if (adminUser.permissions?.includes('member_management')) {
    defaultCards.push({
      id: 'approvals',
      title: 'Member Approvals',
      description: 'Review pending member registrations',
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      component: <MemberApprovals />
    });
  }

  // Get available cards based on permissions
  const getAvailableCards = () => {
    const permissionCards = (adminUser.permissions || [])
      .map(permission => permissionCardMap[permission as keyof typeof permissionCardMap])
      .filter(Boolean);

    return [...defaultCards, ...permissionCards];
  };

  const availableCards = getAvailableCards();

  if (activeView) {
    const selectedCard = availableCards.find(card => card.id === activeView);
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveView(null)}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900">
                {selectedCard?.title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className="font-medium text-gray-900">{adminUser.username}</span>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="text-xs">
                  {adminUser.team_name}
                </Badge>
                <span className="text-xs text-gray-500">Team Member</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {selectedCard?.component}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-900">Team Admin Panel</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Welcome,</span>
            <span className="font-medium text-gray-900">{adminUser.username}</span>
            <div className="flex flex-col items-end">
              <Badge variant="secondary" className="text-xs">
                {adminUser.team_name}
              </Badge>
              <span className="text-xs text-gray-500">Team Member</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Card Grid */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Team Admin Dashboard</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access team management features based on your permissions
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">Team:</span>
              <Badge variant="outline">{adminUser.team_name}</Badge>
              <span className="text-sm text-gray-500">Permissions:</span>
              <Badge variant="outline">{adminUser.permissions?.length || 0} granted</Badge>
            </div>
          </div>

          {availableCards.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Permissions Granted</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your team doesn't have any admin permissions granted yet. Contact your administrator to request access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableCards.map((card) => (
                <Card 
                  key={card.id} 
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-102 min-h-[160px]"
                  onClick={() => setActiveView(card.id)}
                >
                  <CardHeader className="text-center pb-2 p-4">
                    <div className={`mx-auto p-3 rounded-full ${card.bgColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <CardTitle className="text-sm font-semibold mb-1">{card.title}</CardTitle>
                    <CardDescription className="text-xs text-gray-600 leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pt-2 p-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-white transition-colors duration-300 font-medium text-xs"
                    >
                      Open
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Permissions Overview */}
          {adminUser.permissions && adminUser.permissions.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Permissions</CardTitle>
                  <CardDescription>
                    Features you can access with your current team permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {adminUser.permissions.map((permission) => {
                      const permissionCard = permissionCardMap[permission as keyof typeof permissionCardMap];
                      return (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permissionCard?.title || permission.replace('_', ' ').toUpperCase()}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RestrictedAdminPanel;