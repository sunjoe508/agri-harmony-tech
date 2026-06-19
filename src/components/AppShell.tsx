import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { NeuralBackground } from "@/components/NeuralBackground";
import {
  LayoutDashboard,
  Activity,
  Droplets,
  Sprout,
  Wallet,
  CloudSun,
  Bot,
  ShoppingCart,
  LifeBuoy,
  FileText,
  User as UserIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sensors", label: "Sensors", icon: Activity },
  { to: "/irrigation", label: "Irrigation", icon: Droplets },
  { to: "/farm", label: "Farm Records", icon: Sprout },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { to: "/tickets", label: "Support", icon: LifeBuoy },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-2 px-6 py-6 font-display text-xl font-bold">
        <Sprout className="h-6 w-6 text-primary" />
        <span className="gradient-text">AgriSmart</span>
      </Link>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          return (
            <a
              key={item.to}
              href={item.to}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                navigate({ to: item.to });
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 truncate px-3 py-2 text-xs text-muted-foreground">{email}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen">
      <NeuralBackground />
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/60 backdrop-blur-md md:flex md:flex-col">
        {SidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/70 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                {SidebarContent}
              </SheetContent>
            </Sheet>
            <h1 className="font-display text-lg font-semibold">{titleFor(path)}</h1>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function titleFor(path: string): string {
  const found = NAV.find((n) => path === n.to || path.startsWith(n.to + "/"));
  return found?.label ?? "AgriSmart";
}
