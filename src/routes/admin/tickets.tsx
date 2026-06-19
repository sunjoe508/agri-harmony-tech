import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin/tickets")({
  head: () => ({ meta: [{ title: "Tickets — Admin" }] }),
  component: AdminTickets,
});

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
};

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      setTickets((data ?? []) as Ticket[]);
    })();

    const ch = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTickets((p) => [payload.new as Ticket, ...p]);
          toast.info("New support ticket");
        } else if (payload.eventType === "UPDATE") {
          setTickets((p) => p.map((t) => (t.id === (payload.new as Ticket).id ? (payload.new as Ticket) : t)));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function update(id: string, patch: Partial<Ticket>) {
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Updated");
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold gradient-text">Support tickets</h1>
      <div className="space-y-3">
        {tickets.map((t) => (
          <Card key={t.id} className="holo-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display text-base">{t.subject}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
                <Select value={t.status} onValueChange={(v) => update(t.id, { status: v })}>
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap text-muted-foreground">{t.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
              </p>
              <Textarea
                placeholder="Admin response…"
                value={drafts[t.id] ?? t.admin_response ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => update(t.id, { admin_response: drafts[t.id] ?? t.admin_response })}
              >
                Save response
              </Button>
            </CardContent>
          </Card>
        ))}
        {tickets.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No tickets.</p>
        )}
      </div>
    </div>
  );
}
