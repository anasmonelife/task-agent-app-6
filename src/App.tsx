
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import Index from './pages/Index';
import AddAgents from './pages/AddAgents';
import ViewHierarchy from './pages/ViewHierarchy';
import MemberTaskManagement from './pages/MemberTaskManagement';
import PanchayathNotes from './pages/PanchayathNotes';
import NotFound from './pages/NotFound';

import MembersLogin from './pages/MembersLogin';
import MemberDashboard from './pages/MemberDashboard';
import TeamPage from './pages/TeamPage';
import TeamDashboard from './pages/TeamDashboard';
import TeamTaskManagement from './pages/TeamTaskManagement';
import TeamReports from './pages/TeamReports';
import { AuthProvider } from './components/AuthProvider';
import { AdminAuthProvider } from './components/AdminAuthProvider';
import AdminPanel from './pages/AdminPanel';
import TeamAllView from './pages/TeamAllView';
import TeamAdminDashboard from './components/TeamAdminDashboard';
import AgentAdminPanel from './pages/AgentAdminPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AuthProvider>
          <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/add-agents" element={<AddAgents />} />
              <Route path="/view-hierarchy" element={<ViewHierarchy />} />
              <Route path="/task-management" element={<MemberTaskManagement />} />
              <Route path="/panchayath-notes" element={<PanchayathNotes />} />
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="/agent-admin/*" element={<AgentAdminPanel />} />
              <Route path="/members" element={<MembersLogin />} />
              <Route path="/member-dashboard" element={<MemberDashboard />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/team-all-view" element={<TeamAllView />} />
              <Route path="/team-admin/:teamId" element={<TeamAdminDashboard />} />
              <Route path="/team-dashboard" element={<TeamDashboard />} />
              <Route path="/team-task-management" element={<TeamTaskManagement />} />
              <Route path="/team-reports" element={<TeamReports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
          </BrowserRouter>
        </AuthProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
