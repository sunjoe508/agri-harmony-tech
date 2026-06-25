import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Droplet, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/irrigation")({
  head: () => ({ meta: [{ title: "Irrigation — AgriSmart" }] }),
  component: IrrigationPage,
});

type Cycle = {
  id: string;
  name: string;
  scheduled_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
};

function IrrigationPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", scheduled_at: "", duration_minutes: "30", notes: "" });

  const load = async () => {
    const { data } = await supabase
      .from("irrigation_cycles")
      .select("id,name,scheduled_at,completed_at,duration_minutes,status,notes")
      .order("scheduled_at", { ascending: false, nullsFirst: false });
    setCycles((data ?? []) as Cycle[]);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("irrigation-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "irrigation_cycles" }, () => void load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("irrigation_cycles").insert({
      user_id: u.user.id,
      name: form.name || "Cycle",
      scheduled_at: form.scheduled_at || new Date().toISOString(),
      duration_minutes: Number(form.duration_minutes) || 30,
      notes: form.notes || null,
      status: "scheduled",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cycle scheduled");
    setOpen(false);
    setForm({ name: "", scheduled_at: "", duration_minutes: "30", notes: "" });
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase
      .from("irrigation_cycles")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">Irrigation</h1>
          <p className="text-sm text-muted-foreground">Schedule and track irrigation cycles.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New irrigation cycle</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Scheduled at</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={create} className="w-full">Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" /> Cycles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cycles yet.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {cycles.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : "—"} · {c.duration_minutes ?? "?"} min
                    </div>
                    {c.notes && <div className="text-xs text-muted-foreground">{c.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={
                      c.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                      c.status === "scheduled" ? "bg-primary/15 text-primary" :
                      "bg-amber-500/15 text-amber-400"
                    }>{c.status}</Badge>
                    {c.status !== "completed" && (
                      <Button size="sm" variant="ghost" onClick={() => markComplete(c.id)}>Mark done</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
