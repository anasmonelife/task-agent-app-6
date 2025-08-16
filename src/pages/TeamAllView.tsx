
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TreePine, FileText, BarChart3 } from "lucide-react";
import { AdminHierarchyDetails } from '@/components/AdminHierarchyDetails';
import { PanchayathNotes } from '@/components/PanchayathNotes';

const TeamAllView = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/team')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management Portal</h1>
          <p className="text-gray-600">Comprehensive view of hierarchy, notes, and reports</p>
        </div>

        <Tabs defaultValue="hierarchy" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              View Hierarchy
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Panchayath Notes
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="space-y-6">
            <AdminHierarchyDetails />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <PanchayathNotes />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Team Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Hierarchy Reports</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Complete organizational structure across all panchayaths
                      </p>
                      <Button variant="outline" className="w-full">
                        View Hierarchy Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Activity Reports</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Agent activities and performance metrics
                      </p>
                      <Button variant="outline" className="w-full">
                        View Activity Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Notes Summary</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Summary of all panchayath notes and updates
                      </p>
                      <Button variant="outline" className="w-full">
                        View Notes Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Team Performance</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Overall team performance and statistics
                      </p>
                      <Button variant="outline" className="w-full">
                        View Performance Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Task Reports</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Task completion and management reports
                      </p>
                      <Button variant="outline" className="w-full">
                        View Task Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-teal-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Export Data</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Export all data for external analysis
                      </p>
                      <Button variant="outline" className="w-full">
                        Export All Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamAllView;
