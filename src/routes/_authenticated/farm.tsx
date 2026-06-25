import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sprout, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/farm")({
  head: () => ({ meta: [{ title: "Farm Records — AgriSmart" }] }),
  component: FarmPage,
});

type Record = {
  id: string;
  crop_name: string;
  variety: string | null;
  planted_at: string | null;
  harvested_at: string | null;
  area_acres: number | null;
  yield_kg: number | null;
  notes: string | null;
};

function FarmPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ crop_name: "", variety: "", planted_at: "", area_acres: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("farm_records").select("*").order("planted_at", { ascending: false, nullsFirst: false });
    setRecords((data ?? []) as Record[]);
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("farm_records").insert({
      user_id: u.user.id,
      crop_name: form.crop_name,
      variety: form.variety || null,
      planted_at: form.planted_at || null,
      area_acres: form.area_acres ? Number(form.area_acres) : null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Crop added");
    setOpen(false);
    setForm({ crop_name: "", variety: "", planted_at: "", area_acres: "", notes: "" });
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("farm_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">Farm records</h1>
          <p className="text-sm text-muted-foreground">Track crops, plantings, and harvests.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add crop</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New crop record</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Crop</Label><Input value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} /></div>
              <div><Label>Variety</Label><Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} /></div>
              <div><Label>Planted on</Label><Input type="date" value={form.planted_at} onChange={(e) => setForm({ ...form, planted_at: e.target.value })} /></div>
              <div><Label>Area (acres)</Label><Input type="number" step="0.1" value={form.area_acres} onChange={(e) => setForm({ ...form, area_acres: e.target.value })} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={create} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="holo-card">
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" /> Crops</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {records.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{r.crop_name} {r.variety && <span className="text-muted-foreground">· {r.variety}</span>}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.planted_at ? `Planted ${new Date(r.planted_at).toLocaleDateString()}` : "—"}
                      {r.harvested_at && ` · Harvested ${new Date(r.harvested_at).toLocaleDateString()}`}
                      {r.area_acres && ` · ${r.area_acres} ac`}
                      {r.yield_kg && ` · ${r.yield_kg} kg`}
                    </div>
                    {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
