import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Users, 
  UserCheck, 
  Building2, 
  CheckSquare, 
  Shield, 
  Settings,
  BarChart3,
  FileText,
  Bell,
  Award
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: BarChart3 },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "User Approvals", url: "/admin/approvals", icon: UserCheck },
  { title: "Team Management", url: "/admin/teams", icon: Building2 },
  { title: "Team Permissions", url: "/admin/team-permissions", icon: Shield },
  { title: "Task Management", url: "/admin/tasks", icon: CheckSquare },
  { title: "Agent Points", url: "/admin/points", icon: Award },
  { title: "Panchayaths", url: "/admin/panchayaths", icon: Building2 },
  { title: "Permissions", url: "/admin/permissions", icon: Shield },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { adminUser } = useAdminAuth();

  // Super admin gets access to all features, others get restricted access
  const getVisibleMenuItems = () => {
    if (!adminUser) return [];
    
    if (adminUser.role === 'super_admin') {
      return adminMenuItems; // Super admin sees everything
    }
    
    // Other admin roles see limited features
    return adminMenuItems.filter(item => 
      !['permissions', 'settings'].some(restricted => item.url.includes(restricted))
    );
  };

  const isActive = (path: string) => currentPath === path;

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {getVisibleMenuItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClass}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}