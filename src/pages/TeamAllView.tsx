import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TeamAllView = () => {
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Quick Access to Reports */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/team-reports">
              <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Reports</h3>
                <p className="text-gray-600">View detailed team performance and statistics</p>
              </div>
            </Link>
            
            <Link to="/team-task-management">
              <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Management</h3>
                <p className="text-gray-600">Manage and track team tasks</p>
              </div>
            </Link>
            
            <Link to="/team-dashboard">
              <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Dashboard</h3>
                <p className="text-gray-600">Access complete team dashboard</p>
              </div>
            </Link>
          </div>

          {/* Instructions for Team Access */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">How to Access Team Reports</h2>
            <div className="space-y-4 text-blue-800">
              <div>
                <h3 className="font-medium mb-2">1. Ensure Team is Registered</h3>
                <p className="text-sm">The team "foodelife" should be registered in the system with proper credentials.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">2. Team Login Required</h3>
                <p className="text-sm">Use the team login functionality with team name, password, and registered mobile number.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">3. Team Member Access</h3>
                <p className="text-sm">Team members must be added to the management team to access reports.</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/team-login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Team Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamAllView;