import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, LogIn, UserPlus, Phone, User, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileAgentSearch } from "@/components/MobileAgentSearch";
export default function MembersLogin() {
  const [loginData, setLoginData] = useState({
    mobileNumber: ''
  });
  const [registrationData, setRegistrationData] = useState({
    selectedAgentId: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'pending' | 'rejected'>('idle');
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleAgentSelect = (agentId: string) => {
    setRegistrationData({
      selectedAgentId: agentId
    });
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      // Check if member exists and is approved using only mobile number
      const {
        data,
        error
      } = await supabase.from('user_registration_requests').select('*, panchayaths(name, district, state)').eq('mobile_number', loginData.mobileNumber).single();
      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Error",
            description: "Mobile number not found or not registered",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }
      if (data.status === 'approved') {
        // Store member session
        localStorage.setItem('member_user', JSON.stringify({
          id: data.id,
          name: data.username,
          mobileNumber: data.mobile_number,
          panchayath_id: data.panchayath_id,
          panchayath: data.panchayaths,
          role: 'member'
        }));
        setLoginStatus('success');
        setTimeout(() => {
          navigate('/member-dashboard');
        }, 1000);
      } else if (data.status === 'pending') {
        setLoginStatus('pending');
      } else if (data.status === 'rejected') {
        setLoginStatus('rejected');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    if (!registrationData.selectedAgentId) {
      toast({
        title: "Error",
        description: "Please search and select an agent by mobile number",
        variant: "destructive"
      });
      setIsRegistering(false);
      return;
    }
    try {
      // Get selected agent data from database
      const {
        data: selectedAgent,
        error: agentError
      } = await supabase.from('agents').select('*').eq('id', registrationData.selectedAgentId).single();
      if (agentError || !selectedAgent) {
        throw new Error('Selected agent not found');
      }

      // Check if already registered with this agent
      const {
        data: existingData
      } = await supabase.from('user_registration_requests').select('id').eq('username', selectedAgent.name).eq('mobile_number', selectedAgent.phone).single();
      if (existingData) {
        toast({
          title: "Error",
          description: "This agent is already registered as a member",
          variant: "destructive"
        });
        setIsRegistering(false);
        return;
      }

      // Create member registration
      const {
        error
      } = await supabase.from('user_registration_requests').insert([{
        username: selectedAgent.name,
        mobile_number: selectedAgent.phone,
        panchayath_id: selectedAgent.panchayath_id,
        status: 'pending'
      }]);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Registration submitted successfully. Please wait for admin approval."
      });
      setRegistrationData({
        selectedAgentId: ''
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };
  if (loginStatus === 'success') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Login Successful</CardTitle>
            <CardDescription>
              Welcome! Redirecting you to the member dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center gap-2 bg-blue-400 hover:bg-blue-300">
              <LogIn className="h-4 w-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300">
              <UserPlus className="h-4 w-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Member Login</CardTitle>
                <CardDescription>
                  Login with your registered mobile number
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loginStatus === 'pending' && <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your registration is still pending admin approval.
                    </AlertDescription>
                  </Alert>}

                {loginStatus === 'rejected' && <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your registration request was rejected. Please contact the administrator.
                    </AlertDescription>
                  </Alert>}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-mobile">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="login-mobile" type="tel" placeholder="Enter your registered mobile number" value={loginData.mobileNumber} onChange={e => setLoginData(prev => ({
                      ...prev,
                      mobileNumber: e.target.value
                    }))} className="pl-10" maxLength={10} disabled={isLoggingIn} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Member Registration</CardTitle>
                <CardDescription>
                  Find your profile by mobile number from the agents hierarchy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistration} className="space-y-4">
                  <MobileAgentSearch onAgentSelect={handleAgentSelect} selectedAgentId={registrationData.selectedAgentId} />

                  <Button type="submit" className="w-full" disabled={isRegistering}>
                    {isRegistering ? "Registering..." : "Register"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}