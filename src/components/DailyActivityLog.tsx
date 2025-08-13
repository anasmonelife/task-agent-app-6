import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, Phone, Trophy, Star } from "lucide-react";
import { format, parseISO, startOfToday, startOfMonth, endOfMonth } from "date-fns";
import { typedSupabase, TABLES } from "@/lib/supabase-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
interface Agent {
  id: string;
  name: string;
  phone: string;
  role: string;
  panchayath_id: string;
}
interface DailyActivity {
  id: string;
  agent_id: string;
  mobile_number: string;
  activity_date: string;
  activity_description: string;
  created_at: string;
}
export const DailyActivityLog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'mobile' | 'calendar' | 'activity' | 'history'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activityText, setActivityText] = useState('');
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const {
    toast
  } = useToast();

  // Get points per activity from admin settings
  const getPointsPerActivity = (agentRole: string) => {
    const savedSettings = localStorage.getItem('pointSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const roleSetting = settings.find((setting: any) => setting.role === agentRole);
      return roleSetting ? roleSetting.points_per_activity : 0;
    }
    return 0;
  };

  const calculateMonthlyPoints = (activitiesData: DailyActivity[], agentRole: string) => {
    const currentMonth = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    
    const monthlyActivities = activitiesData.filter(activity => {
      const activityDate = parseISO(activity.activity_date);
      return activityDate >= currentMonth && activityDate <= currentMonthEnd;
    });
    
    return monthlyActivities.length * getPointsPerActivity(agentRole);
  };
  const resetForm = () => {
    setStep('mobile');
    setMobileNumber('');
    setCurrentAgent(null);
    setSelectedDate(new Date());
    setActivityText('');
    setActivities([]);
  };
  const handleMobileSubmit = async () => {
    if (!mobileNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mobile number",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await typedSupabase.from(TABLES.AGENTS).select('*').eq('phone', mobileNumber).limit(1).maybeSingle();
      if (error || !data) {
        toast({
          title: "Error",
          description: "Agent not found with this mobile number",
          variant: "destructive"
        });
        return;
      }
      setCurrentAgent(data);
      console.log('Found agent:', data.name, 'Current date auto-selected:', format(new Date(), 'yyyy-MM-dd'));
      
      const activitiesData = await fetchActivities(data.id);
      await ensureYesterdayLeaveIfMissing(data);
      
      // Auto-select today's date and go directly to activity entry
      const today = new Date();
      setSelectedDate(today);
      console.log('Activity step - today selected:', format(today, 'yyyy-MM-dd'));
      
      // Check if today already has activity
      const todayStr = format(today, 'yyyy-MM-dd');
      const existingActivity = activitiesData.find(activity => activity.activity_date === todayStr);
      if (existingActivity) {
        setActivityText(existingActivity.activity_description);
      } else {
        setActivityText('');
      }
      
      setStep('activity');
    } catch (error) {
      console.error('Error finding agent:', error);
      toast({
        title: "Error",
        description: "Failed to find agent",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchActivities = async (agentId: string) => {
    try {
      const {
        data,
        error
      } = await typedSupabase.from(TABLES.DAILY_ACTIVITIES).select('*').eq('agent_id', agentId).order('activity_date', {
        ascending: false
      });
      if (error) throw error;
      setActivities(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  };
  
  // Ensure yesterday is marked as leave if no activity exists
  const ensureYesterdayLeaveIfMissing = async (agent: Agent) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      
      console.log('Checking yesterday activities for:', yesterdayStr);

      const { data: existing, error: existError } = await typedSupabase
        .from(TABLES.DAILY_ACTIVITIES)
        .select('id')
        .eq('agent_id', agent.id)
        .eq('activity_date', yesterdayStr)
        .maybeSingle();

      if (existError && existError.code !== 'PGRST116') {
        throw existError;
      }

      if (!existing) {
        console.log('No activity found for yesterday, creating Leave entry');
        const { error: insertError } = await typedSupabase.from(TABLES.DAILY_ACTIVITIES).insert([
          {
            agent_id: agent.id,
            mobile_number: mobileNumber || agent.phone,
            activity_date: yesterdayStr,
            activity_description: 'Leave'
          }
        ]);
        if (insertError) throw insertError;

        console.log('Leave entry created for yesterday');
        // Refresh activities to reflect the new leave record
        await fetchActivities(agent.id);
      } else {
        console.log('Activity already exists for yesterday:', existing.id);
      }
    } catch (e) {
      console.error('Error ensuring leave for yesterday:', e);
    }
  };

  const getDateColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasActivity = activities.some(activity => activity.activity_date === dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isPast = date < yesterday;
    if (hasActivity) {
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    } else if (isPast) {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    return '';
  };
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isPast = date < yesterday;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingActivity = activities.find(activity => activity.activity_date === dateStr);
    setSelectedDate(date);
    if (isPast && existingActivity) {
      // Show past activity in read-only mode
      setActivityText(existingActivity.activity_description);
      setStep('activity');
    } else if (isPast && !existingActivity) {
      // Past date with no activity - show in read-only
      setActivityText('No activity recorded for this date');
      setStep('activity');
    } else {
      // Today, yesterday, or future date - allow editing
      if (existingActivity) {
        setActivityText(existingActivity.activity_description);
      } else {
        setActivityText('');
      }
      setStep('activity');
    }
  };
  const saveActivity = async () => {
    if (!currentAgent || !selectedDate || !activityText.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const activityDate = format(selectedDate, 'yyyy-MM-dd');

      // Check if activity already exists
      const existingActivity = activities.find(activity => activity.activity_date === activityDate);
      if (existingActivity) {
        // Update existing activity
        const {
          error
        } = await typedSupabase.from(TABLES.DAILY_ACTIVITIES).update({
          activity_description: activityText,
          updated_at: new Date().toISOString()
        }).eq('id', existingActivity.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Activity updated successfully"
        });
      } else {
        // Create new activity
        const {
          error
        } = await typedSupabase.from(TABLES.DAILY_ACTIVITIES).insert([{
          agent_id: currentAgent.id,
          mobile_number: mobileNumber,
          activity_date: activityDate,
          activity_description: activityText
        }]);
        if (error) throw error;
        
        // Show points earned popup for new activities
        const pointsEarned = getPointsPerActivity(currentAgent.role);
        setEarnedPoints(pointsEarned);
        setShowPointsPopup(true);
        
        toast({
          title: "Success",
          description: "Activity saved successfully"
        });
      }
      await fetchActivities(currentAgent.id);
      
      // Calculate monthly total after fetching updated activities
      if (!existingActivity) {
        const updatedActivities = await typedSupabase
          .from(TABLES.DAILY_ACTIVITIES)
          .select('*')
          .eq('agent_id', currentAgent.id)
          .order('activity_date', { ascending: false });
        
        if (updatedActivities.data) {
          setMonthlyTotal(calculateMonthlyPoints(updatedActivities.data, currentAgent.role));
        }
      }
      
      setStep('history');
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: "Failed to save activity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isPastDate = selectedDate && selectedDate < yesterday;
  const isReadOnly = isPastDate;

  // Points Popup Component
  const PointsPopup = () => (
    <Dialog open={showPointsPopup} onOpenChange={setShowPointsPopup}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Congratulations!
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold">+{earnedPoints} Points Earned!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Great job logging your daily activity!
            </p>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Monthly Total</p>
              <p className="text-2xl font-bold text-primary">{monthlyTotal} Points</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentAgent ? Math.floor(monthlyTotal / getPointsPerActivity(currentAgent.role)) : 0} activities this month
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowPointsPopup(false)} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  return <Dialog open={isOpen} onOpenChange={open => {
    setIsOpen(open);
    if (!open) resetForm();
  }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-slate-950 hover:bg-slate-800">
          <CalendarDays className="h-4 w-4" />
          Daily Activity Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Activity Log</DialogTitle>
          <DialogDescription>
            Log and track daily activities for agents
          </DialogDescription>
        </DialogHeader>

        {step === 'mobile' && <div className="space-y-4">
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="flex gap-2">
                <Input id="mobile" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="Enter mobile number" className="flex-1" />
                <Button onClick={handleMobileSubmit} disabled={loading}>
                  {loading ? "Finding..." : "Find Agent"}
                </Button>
              </div>
            </div>
          </div>}

        {step === 'calendar' && currentAgent && <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Agent Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span> {currentAgent.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Phone:</span> {currentAgent.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentAgent.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label>Select Date</Label>
              <div className="text-sm text-muted-foreground mb-2">
                <span className="inline-block w-3 h-3 bg-green-100 border rounded mr-1"></span>
                Has activity
                <span className="inline-block w-3 h-3 bg-red-100 border rounded mr-1 ml-4"></span>
                No activity (past dates)
              </div>
              <div className="flex justify-center mt-2">
                <Calendar 
                  mode="single" 
                  selected={selectedDate} 
                  onSelect={handleDateSelect} 
                  className="rounded-md border pointer-events-auto" 
                  defaultMonth={new Date()}
                  modifiers={{
                    hasActivity: date => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return activities.some(activity => activity.activity_date === dateStr);
                    },
                    noActivity: date => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const isPast = date < yesterday;
                      return isPast && !activities.some(activity => activity.activity_date === dateStr);
                    }
                  }} 
                  modifiersStyles={{
                    hasActivity: {
                      backgroundColor: '#dcfce7',
                      color: '#166534'
                    },
                    noActivity: {
                      backgroundColor: '#fecaca',
                      color: '#991b1b'
                    }
                  }} 
                />
              </div>
            </div>
          </div>}

        {step === 'activity' && selectedDate && <div className="space-y-4">
            {currentAgent && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Name:</span> {currentAgent.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Phone:</span> {currentAgent.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{currentAgent.role}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div>
              <Label>
                Activity for {format(selectedDate, 'PPP')}
                {isReadOnly && <span className="text-muted-foreground ml-2">(Read Only)</span>}
              </Label>
              <Textarea value={activityText} onChange={e => setActivityText(e.target.value)} placeholder={isReadOnly ? "No activity recorded" : "Describe your daily activities..."} rows={6} className="mt-2" readOnly={isReadOnly} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep('calendar')} variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                View Calendar
              </Button>
              {!isReadOnly && <Button onClick={saveActivity} disabled={loading} className="flex-1">
                  {loading ? "Saving..." : "Save Activity"}
                </Button>}
            </div>
          </div>}

        {step === 'history' && activities.length > 0 && <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Activity History</h3>
              <Button onClick={() => setStep('calendar')} variant="outline">
                Back to Calendar
              </Button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map(activity => <Card key={activity.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseISO(activity.activity_date), 'PPP')}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {format(parseISO(activity.created_at), 'MMM dd, yyyy')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {activity.activity_description}
                    </p>
                  </CardContent>
                </Card>)}
            </div>
          </div>}

        {/* Add History Button in activity step */}
        {step === 'activity' && currentAgent && <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={() => setStep('history')} className="gap-2">
              <Clock className="h-4 w-4" />
              View History
            </Button>
          </div>}
      </DialogContent>
      <PointsPopup />
    </Dialog>;
};