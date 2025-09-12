import { Clock, User, History, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Clock, label: "Clock In", testId: "nav-home" },
    { path: "/profile", icon: User, label: "Profile", testId: "nav-profile" },
    { path: "/history", icon: History, label: "History", testId: "nav-history" },
    ...((user as any)?.isAdmin ? [
      { path: "/admin", icon: Settings, label: "Admin", testId: "nav-admin" }
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => setLocation(item.path)}
              className={cn(
                "flex flex-col items-center p-2 h-auto gap-1",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              data-testid={item.testId}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
