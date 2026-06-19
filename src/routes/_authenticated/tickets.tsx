import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({ meta: [{ title: "Support — AgriSmart" }] }),
  component: TicketsPage,
});

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string | null;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_CLS: Record<string, string> = {
  open: "bg-info/15 text-info",
  in_progress: "bg-warning/15 text-warning",
  resolved: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
};

function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let userId: string | null = null;
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      userId = u.user?.id ?? null;
      if (!userId) return;
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      setTickets((data ?? []) as Ticket[]);
    })();

    const channel = supabase
      .channel("tickets-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setTickets((prev) => prev.map((t) => (t.id === (payload.new as Ticket).id ? (payload.new as Ticket) : t)));
            toast.info("A ticket was updated");
          } else if (payload.eventType === "INSERT") {
            const t = payload.new as Ticket;
            setTickets((prev) => [t, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const subject = String(fd.get("subject") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    if (!subject || !message) return toast.error("Please fill all fields");
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("support_tickets")
        .insert({ user_id: u.user.id, subject, message });
      if (error) throw error;
      toast.success("Ticket submitted");
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Support tickets</h1>
          <p className="text-sm text-muted-foreground">Get help from the AgriSmart team</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> New ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required rows={5} maxLength={2000} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                Submit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card className="holo-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No tickets yet. Open one if you need help!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="holo-card">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="font-display text-base">{t.subject}</CardTitle>
                <Badge className={STATUS_CLS[t.status] ?? ""} variant="outline">
                  {t.status.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap text-muted-foreground">{t.message}</p>
                {t.admin_response && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="mb-1 text-xs font-medium text-primary">Admin response</p>
                    <p className="whitespace-pre-wrap">{t.admin_response}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
