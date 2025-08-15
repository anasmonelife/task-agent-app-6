import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { Eye, EyeOff, LogIn, Home, Shield, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingMobile, setIsLoadingMobile] = useState(false);
  const { login, isLoading } = useAdminAuth();
  const { toast } = useToast();

  const validateMobileNumber = (mobile: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingMobile(true);
    
    try {
      // Check if mobile number belongs to a team member and get their team associations
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select(`
          id, 
          name, 
          phone,
          management_team_members(
            management_teams(
              id,
              name,
              description
            )
          )
        `)
        .eq('phone', mobileNumber)
        .single();

      if (agentError || !agentData) {
        toast({
          title: "Error",
          description: "Mobile number not registered as a team member",
          variant: "destructive",
        });
        setIsLoadingMobile(false);
        return;
      }

      // Get team IDs for this agent
      const teamIds = agentData.management_team_members?.map((member: any) => member.management_teams.id) || [];
      
      if (teamIds.length === 0) {
        toast({
          title: "Error",
          description: "No team associations found for this mobile number",
          variant: "destructive",
        });
        setIsLoadingMobile(false);
        return;
      }

      // Fetch team permissions for all associated teams
      const { data: teamPermissions, error: permissionsError } = await supabase
        .from('team_permissions')
        .select('permission_id, team_id')
        .in('team_id', teamIds);

      if (permissionsError) {
        console.error('Error fetching team permissions:', permissionsError);
      }

      // Aggregate all unique permissions across teams
      const allPermissions = [...new Set(teamPermissions?.map(p => p.permission_id) || [])];

      // Get team information
      const teamInfo = agentData.management_team_members?.[0]?.management_teams;

      // Create a team member admin session with permissions
      const teamMemberAdmin = {
        id: `team_${agentData.id}`,
        username: agentData.name,
        role: 'team_member_admin',
        phone: agentData.phone,
        active: true,
        team_id: teamInfo?.id,
        team_name: teamInfo?.name,
        permissions: allPermissions,
        is_active: true
      };

      localStorage.setItem('adminUser', JSON.stringify(teamMemberAdmin));
      
      toast({
        title: "Success",
        description: `Welcome to admin panel, ${agentData.name}! Team: ${teamInfo?.name}`,
      });

      // Redirect to admin panel
      window.location.href = '/admin';
    } catch (error) {
      console.error('Mobile login error:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMobile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Admin Login</CardTitle>
            <CardDescription className="text-slate-600">
              Access the admin panel with your credentials
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="credentials" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="credentials">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Credentials
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Team Member Access
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="credentials" className="space-y-4 mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-700">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="border-slate-200 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-slate-200 focus:border-primary pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing in..."
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 text-center">
                    Default login: superadmin / admin123
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="mobile" className="space-y-4 mt-4">
                <form onSubmit={handleMobileLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-slate-700">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter your registered mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      maxLength={10}
                      required
                      className="border-slate-200 focus:border-primary"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoadingMobile}
                  >
                    {isLoadingMobile ? (
                      "Verifying..."
                    ) : (
                      <>
                        <Smartphone className="mr-2 h-4 w-4" />
                        Access Admin Panel
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 text-center">
                    Only registered team members can access admin panel via mobile number
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;