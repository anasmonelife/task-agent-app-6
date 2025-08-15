import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, GitBranch, Table, BarChart3 } from "lucide-react";
import { useSupabaseHierarchy } from "@/hooks/useSupabaseHierarchy";
import { HierarchyTable } from "./HierarchyTable";
import { OrganizationChartView } from "./OrganizationChartView";

export const AdminHierarchyDetails = () => {
  const { agents, panchayaths, isLoading } = useSupabaseHierarchy();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Filter agents based on search and filters
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.ward?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPanchayath = selectedPanchayath === 'all' || agent.panchayath_id === selectedPanchayath;
    const matchesRole = selectedRole === 'all' || agent.role === selectedRole;
    
    return matchesSearch && matchesPanchayath && matchesRole;
  });

  // Get hierarchy statistics
  const getHierarchyStats = () => {
    const totalAgents = agents.length;
    const coordinators = agents.filter(a => a.role === 'coordinator').length;
    const supervisors = agents.filter(a => a.role === 'supervisor').length;
    const groupLeaders = agents.filter(a => a.role === 'group-leader').length;
    const pros = agents.filter(a => a.role === 'pro').length;
    
    return {
      total: totalAgents,
      coordinator: coordinators,
      supervisor: supervisors,
      'group-leader': groupLeaders,
      pro: pros
    };
  };

  const stats = getHierarchyStats();

  const roleColors = {
    coordinator: 'bg-red-100 text-red-800',
    supervisor: 'bg-purple-100 text-purple-800',
    'group-leader': 'bg-orange-100 text-orange-800',
    pro: 'bg-green-100 text-green-800'
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Complete Hierarchy Details
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Comprehensive view of all agents across all panchayaths
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.coordinator}</div>
            <div className="text-sm text-red-700">Coordinators</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.supervisor}</div>
            <div className="text-sm text-purple-700">Supervisors</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats['group-leader']}</div>
            <div className="text-sm text-orange-700">Group Leaders</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.pro}</div>
            <div className="text-sm text-green-700">P.R.Os</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, or ward..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Panchayath" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panchayaths</SelectItem>
              {panchayaths.map((panchayath) => (
                <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="coordinator">Coordinator</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="group-leader">Group Leader</SelectItem>
              <SelectItem value="pro">P.R.O</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedPanchayath('all');
              setSelectedRole('all');
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredAgents.length} of {agents.length} agents
            {selectedPanchayath !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {panchayaths.find(p => p.id === selectedPanchayath)?.name}
              </Badge>
            )}
            {selectedRole !== 'all' && (
              <Badge variant="outline" className={`ml-2 ${roleColors[selectedRole as keyof typeof roleColors]}`}>
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1).replace('-', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Hierarchy Views */}
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Organization Chart
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-6">
            <HierarchyTable 
              agents={filteredAgents} 
              panchayathName={
                selectedPanchayath === 'all' 
                  ? "All Panchayaths" 
                  : panchayaths.find(p => p.id === selectedPanchayath)?.name || "Selected Panchayath"
              } 
            />
          </TabsContent>
          
          <TabsContent value="chart" className="mt-6">
            {selectedPanchayath === 'all' ? (
              <div className="space-y-6">
                {panchayaths.map((panchayath) => {
                  const panchayathAgents = agents.filter(a => a.panchayath_id === panchayath.id);
                  if (panchayathAgents.length === 0) return null;
                  
                  return (
                    <div key={panchayath.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {panchayath.name}
                        <Badge variant="outline">
                          {panchayathAgents.length} agents
                        </Badge>
                      </h3>
                      <OrganizationChartView
                        panchayathId={panchayath.id}
                        agents={panchayathAgents}
                        panchayathName={panchayath.name}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <OrganizationChartView
                panchayathId={selectedPanchayath}
                agents={filteredAgents}
                panchayathName={
                  panchayaths.find(p => p.id === selectedPanchayath)?.name || "Selected Panchayath"
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};