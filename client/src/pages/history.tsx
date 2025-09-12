import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function History() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  const { data: timeEntries = [], isLoading: entriesLoading, error } = useQuery({
    queryKey: ["/api/time-entries/user"],
    enabled: !!user,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/analytics/user-stats"],
    enabled: !!user,
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (authLoading || entriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-md mx-auto pt-8 px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold" data-testid="text-page-title">Time History</h2>
          <p className="text-muted-foreground">Your recent time entries</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary" data-testid="text-weekly-hours">
                {userStats ? `${(userStats as any).weeklyHours}h` : '0h'}
              </div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-hours">
                {userStats ? `${(userStats as any).monthlyHours}h` : '0h'}
              </div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Time Entries */}
        <div className="space-y-4">
          {(timeEntries as any[]).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No time entries found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start clocking in to see your time history here
                </p>
              </CardContent>
            </Card>
          ) : (
            (timeEntries as any[]).map((entry: any) => (
              <Card key={entry.id} className="border border-border hover:shadow-md transition-shadow" data-testid={`card-time-entry-${entry.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium" data-testid="text-entry-date">
                      {formatDate(entry.clockInTime)}
                    </div>
                    <Badge 
                      variant={entry.status === "completed" ? "default" : "secondary"}
                      data-testid="status-entry"
                    >
                      {entry.status === "completed" ? "Completed" : "Active"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span data-testid="text-clock-in">
                        {new Date(entry.clockInTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {entry.clockOutTime && (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span data-testid="text-clock-out">
                            {new Date(entry.clockOutTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="font-medium text-foreground" data-testid="text-total-hours">
                      {entry.totalHours ? formatDuration(entry.totalHours) : 'In Progress'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Load More */}
        {(timeEntries as any[]).length >= 50 && (
          <div className="text-center mt-6">
            <Button variant="outline" data-testid="button-load-more">
              Load More Entries
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
