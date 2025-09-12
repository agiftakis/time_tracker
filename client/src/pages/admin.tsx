import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, BarChart3, Timer, Edit, Trash2, Plus } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || !(user as any).isAdmin)) {
      toast({
        title: "Unauthorized",
        description: user ? "Admin access required" : "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = user ? "/" : "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/analytics/system-stats"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries"],
    enabled: !!(user as any)?.isAdmin,
  });

  // Calculate user-specific stats
  const getUserStats = (userId: string) => {
    const userEntries = (timeEntries as any[]).filter((entry: any) => entry.userId === userId);
    const todayEntries = userEntries.filter((entry: any) => {
      const entryDate = new Date(entry.clockInTime);
      const today = new Date();
      return entryDate.toDateString() === today.toDateString();
    });
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEntries = userEntries.filter((entry: any) => {
      const entryDate = new Date(entry.clockInTime);
      return entryDate >= weekStart;
    });

    const todayMinutes = todayEntries.reduce((total: number, entry: any) => 
      total + (entry.totalHours || 0), 0);
    const weekMinutes = weekEntries.reduce((total: number, entry: any) => 
      total + (entry.totalHours || 0), 0);

    const activeEntry = userEntries.find((entry: any) => entry.status === "active");
    const lastEntry = userEntries.sort((a: any, b: any) => 
      new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime())[0];

    return {
      todayHours: Math.floor(todayMinutes / 60),
      todayMinutes: todayMinutes % 60,
      weekHours: Math.floor(weekMinutes / 60),
      weekMinutes: weekMinutes % 60,
      isActive: !!activeEntry,
      lastClockIn: lastEntry ? new Date(lastEntry.clockInTime) : null,
    };
  };

  if (authLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto pt-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-page-title">Super Admin Dashboard</h2>
            <p className="text-muted-foreground">Manage employees and time records</p>
          </div>
          <Button data-testid="button-add-employee">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-total-employees">
                    {(systemStats as any)?.totalEmployees || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Employees</div>
                </div>
                <Users className="w-6 h-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-active-sessions">
                    {(systemStats as any)?.activeSessions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Sessions</div>
                </div>
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600" data-testid="text-weekly-hours">
                    {(systemStats as any)?.weeklyHours || 0}h
                  </div>
                  <div className="text-sm text-muted-foreground">Weekly Hours</div>
                </div>
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-hours">
                    {(systemStats as any)?.avgHours || 0}h
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Daily Hours</div>
                </div>
                <Timer className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(users as any[]).length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No employees found</p>
                <Button className="mt-4" data-testid="button-add-first-employee">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              </CardContent>
            </Card>
          ) : (
            (users as any[]).map((employee: any) => {
              const stats = getUserStats(employee.id);
              return (
                <Card key={employee.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-employee-${employee.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                          {employee.profileImageUrl ? (
                            <img 
                              src={employee.profileImageUrl} 
                              alt="Employee" 
                              className="w-full h-full object-cover"
                              data-testid="img-employee-avatar"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                              {employee.firstName?.[0] || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold" data-testid="text-employee-name">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid="text-employee-department">
                            {employee.department || 'No Department'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" data-testid="button-edit-employee">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" data-testid="button-delete-employee">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={stats.isActive ? "default" : "secondary"} data-testid="status-employee">
                          {stats.isActive ? "Active" : "Not Clocked In"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Today:</span>
                        <span className="font-medium" data-testid="text-employee-today-hours">
                          {stats.todayHours}h {stats.todayMinutes}m
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">This Week:</span>
                        <span className="font-medium" data-testid="text-employee-week-hours">
                          {stats.weekHours}h {stats.weekMinutes}m
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Clock-in:</span>
                        <span className="font-medium" data-testid="text-employee-last-clock-in">
                          {stats.lastClockIn 
                            ? stats.lastClockIn.toLocaleDateString() === new Date().toLocaleDateString()
                              ? stats.lastClockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : stats.lastClockIn.toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1" data-testid="button-view-details">
                        View Details
                      </Button>
                      <Button size="sm" variant="secondary" className="flex-1" data-testid="button-time-records">
                        Time Records
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
