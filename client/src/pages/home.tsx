import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";
import { SwipeSlider } from "@/components/ui/swipe-slider";
import { SignaturePad } from "@/components/ui/signature-pad";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSignatures, setShowSignatures] = useState(false);
  const [employeeSignature, setEmployeeSignature] = useState<string>("");
  const [supervisorSignature, setSupervisorSignature] = useState<string>("");

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get active time entry
  const { data: activeEntry, isLoading: activeEntryLoading } = useQuery({
    queryKey: ["/api/time-entries/active"],
    enabled: !!user,
  });

  // Get user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/analytics/user-stats"],
    enabled: !!user,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/time-entries/clock-in"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/user-stats"] });
      toast({
        title: "Clocked In Successfully",
        description: `Time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Clock In Failed",
        description: error.message || "Unable to clock in",
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/time-entries/${(activeEntry as any)?.id}/clock-out`, {
      employeeSignature,
      supervisorSignature,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/user-stats"] });
      setShowSignatures(false);
      setEmployeeSignature("");
      setSupervisorSignature("");
      toast({
        title: "Clocked Out Successfully",
        description: "Time entry completed with signatures",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Clock Out Failed",
        description: error.message || "Unable to clock out",
        variant: "destructive",
      });
    },
  });

  const handleClockIn = () => {
    clockInMutation.mutate();
  };

  const handleClockOut = () => {
    if (!employeeSignature || !supervisorSignature) {
      toast({
        title: "Signatures Required",
        description: "Both employee and supervisor signatures are required",
        variant: "destructive",
      });
      return;
    }
    clockOutMutation.mutate();
  };

  const handleSwipeComplete = () => {
    if (activeEntry) {
      setShowSignatures(true);
    } else {
      handleClockIn();
    }
  };

  if (authLoading || activeEntryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isActive = !!activeEntry;
  const clockInTime = activeEntry ? new Date((activeEntry as any).clockInTime) : null;
  const hoursWorked = clockInTime ? 
    Math.floor((currentTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)) : 0;
  const minutesWorked = clockInTime ? 
    Math.floor(((currentTime.getTime() - clockInTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60)) : 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-md mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
              {(user as any)?.profileImageUrl ? (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {(user as any)?.firstName?.[0] || 'U'}
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
          
          <h2 className="text-2xl font-bold" data-testid="text-greeting">
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {(user as any)?.firstName || 'User'}!
          </h2>
          <p className="text-muted-foreground">
            {isActive ? "You're currently clocked in" : "Ready to start your workday?"}
          </p>
        </div>

        {/* Time Display */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="text-current-time">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-lg text-muted-foreground mb-1" data-testid="text-current-date">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-muted-foreground" data-testid="text-timezone">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Today's Status</h3>
              <Badge variant={isActive ? "default" : "secondary"} data-testid="status-badge">
                {isActive ? "Clocked In" : "Not Clocked In"}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Clock In:</span>
                <span className="font-medium" data-testid="text-clock-in-time">
                  {clockInTime ? clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hours Worked:</span>
                <span className="font-medium" data-testid="text-hours-worked">
                  {isActive ? `${hoursWorked}h ${minutesWorked}m` : '0h 0m'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Week:</span>
                <span className="font-medium" data-testid="text-weekly-hours">
                  {userStats ? `${(userStats as any).weeklyHours}h ${(userStats as any).weeklyMinutes}m` : '0h 0m'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clock In/Out Interface */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 text-center">
              {isActive ? "Swipe to Clock Out" : "Swipe to Clock In"}
            </h3>
            
            <SwipeSlider
              onSwipeComplete={handleSwipeComplete}
              isLoading={clockInMutation.isPending}
              variant={isActive ? "destructive" : "primary"}
              text={isActive ? "Slide to clock out" : "Slide to clock in"}
              data-testid="swipe-slider"
            />
            
            {clockInMutation.isSuccess && !isActive && (
              <div className="mt-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center text-green-800 dark:text-green-200">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-medium">Successfully clocked in!</span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Modal */}
        {showSignatures && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Digital Signatures Required</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Employee Signature</label>
                  <SignaturePad
                    onSignatureChange={setEmployeeSignature}
                    data-testid="signature-employee"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Supervisor Signature</label>
                  <SignaturePad
                    onSignatureChange={setSupervisorSignature}
                    data-testid="signature-supervisor"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={() => setShowSignatures(false)}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-cancel-signatures"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleClockOut}
                    disabled={clockOutMutation.isPending || !employeeSignature || !supervisorSignature}
                    className="flex-1"
                    data-testid="button-submit-signatures"
                  >
                    {clockOutMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Complete Clock Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
