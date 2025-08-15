import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Shield, Home, 
  Users, UserCheck, Building2, CheckSquare, Award, 
  FileText, Bell, Settings, BarChart3, GitBranch, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "@/components/AdminAuthProvider";
import AdminLogin from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";
import UserManagement from "@/components/UserManagement";
import MemberApprovals from "@/components/MemberApprovals";
import TeamManagement from "@/components/TeamManagement";
import EnhancedTaskManagement from "@/components/EnhancedTaskManagement";
import PanchayathManagement from "@/components/PanchayathManagement";
import AdminPermissions from "@/components/AdminPermissions";
import AdminReports from "@/components/AdminReports";
import AdminNotifications from "@/components/AdminNotifications";
import AdminSettings from "@/components/AdminSettings";
import AgentPointsPage from "@/pages/AgentPointsPage";
import { HierarchyTable } from "@/components/HierarchyTable";
import { PanchayathNotes } from "@/components/PanchayathNotes";

const AdminPanelContent = () => {
  const { adminUser, logout } = useAdminAuth();
  const [activeView, setActiveView] = useState<string | null>(null);

  if (!adminUser) {
    return <AdminLogin />;
  }

  const adminCards = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'System overview and statistics',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      component: <AdminDashboard />
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage system users and agents',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      component: <UserManagement />
    },
    {
      id: 'approvals',
      title: 'User Approvals',
      description: 'Review pending user registrations',
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      component: <MemberApprovals />
    },
    {
      id: 'teams',
      title: 'Team Management',
      description: 'Manage teams and assignments',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      component: <TeamManagement />
    },
    {
      id: 'tasks',
      title: 'Task Management',
      description: 'Create and monitor tasks',
      icon: CheckSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      component: <EnhancedTaskManagement />
    },
    {
      id: 'points',
      title: 'Agent Points',
      description: 'Manage agent point system',
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      component: <AgentPointsPage />
    },
    {
      id: 'panchayaths',
      title: 'Panchayaths',
      description: 'Manage panchayath data',
      icon: Building2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      component: <PanchayathManagement />
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate system reports',
      icon: FileText,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      component: <AdminReports />
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'System notifications',
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      component: <AdminNotifications />
    },
    {
      id: 'hierarchy',
      title: 'Hierarchy Details',
      description: 'Manage agent hierarchy structure',
      icon: GitBranch,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      component: <div className="p-4"><HierarchyTable agents={[]} panchayathName="All Panchayaths" /></div>
    },
    {
      id: 'panchayath-notes',
      title: 'Panchayath Notes',
      description: 'Manage panchayath notes and updates',
      icon: MessageSquare,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      component: <div className="p-4"><PanchayathNotes /></div>
    }
  ];

  // Add restricted cards for super admin only
  if (adminUser.role === 'super_admin') {
    adminCards.push(
      {
        id: 'permissions',
        title: 'Permissions',
        description: 'Manage user permissions',
        icon: Shield,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        component: <AdminPermissions />
      },
      {
        id: 'settings',
        title: 'Settings',
        description: 'System configuration',
        icon: Settings,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        component: <AdminSettings />
      }
    );
  }

  if (activeView) {
    const selectedCard = adminCards.find(card => card.id === activeView);
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
              ← Back to Cards
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
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {adminUser.role}
              </span>
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
          <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Welcome,</span>
            <span className="font-medium text-gray-900">{adminUser.username}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {adminUser.role}
            </span>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select a module to manage system functions and monitor your organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {adminCards.map((card) => (
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
        </div>
      </main>
    </div>
  );
};

const AdminPanel = () => {
  return (
    <AdminAuthProvider>
      <AdminPanelContent />
    </AdminAuthProvider>
  );
};

export default AdminPanel;