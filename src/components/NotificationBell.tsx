import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  level: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const LEVEL_STYLES: Record<string, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "text-info" },
  success: { icon: CheckCircle2, cls: "text-success" },
  warning: { icon: AlertTriangle, cls: "text-warning" },
  error: { icon: AlertCircle, cls: "text-destructive" },
};

export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let userId: string | null = null;
    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
      if (!userId) return;
      void load();
    });

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setItems(data as Notif[]);
    };

    const channel = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => [n, ...prev].slice(0, 20));
          const meta = LEVEL_STYLES[n.level] ?? LEVEL_STYLES.info;
          toast(n.title, { description: n.body ?? undefined, className: meta.cls });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((i) => !i.read_at).length;

  async function markAllRead() {
    const ids = items.filter((i) => !i.read_at).map((i) => i.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    setItems((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, read_at: new Date().toISOString() } : i)));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-pulse-glow">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold">Notifications</h3>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">You're all caught up.</div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const meta = LEVEL_STYLES[n.level] ?? LEVEL_STYLES.info;
                const Icon = meta.icon;
                return (
                  <li key={n.id} className={`px-4 py-3 ${!n.read_at ? "bg-accent/30" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
