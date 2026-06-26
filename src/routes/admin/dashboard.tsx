import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Activity, Wallet, LifeBuoy, Database as DbIcon, Sprout, RefreshCw } from "lucide-react";
import { regenerateDemoData } from "@/lib/admin-demo.functions";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — AgriSmart" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState<{
    users: number;
    sensors: number;
    transactions: number;
    budgets: number;
    tickets: number;
    crops: number;
  } | null>(null);
  const [reseeding, setReseeding] = useState(false);

  const loadStats = async () => {
    const [users, sensors, tx, budgets, tickets, crops] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("sensors").select("id", { count: "exact", head: true }),
      supabase.from("financial_transactions").select("id", { count: "exact", head: true }),
      supabase.from("budgets").select("id", { count: "exact", head: true }),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      supabase.from("farm_records").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      users: users.count ?? 0,
      sensors: sensors.count ?? 0,
      transactions: tx.count ?? 0,
      budgets: budgets.count ?? 0,
      tickets: tickets.count ?? 0,
      crops: crops.count ?? 0,
    });
  };

  const regenerate = async () => {
    if (reseeding) return;
    if (!window.confirm("Wipe and regenerate demo seed data for the 3 demo farmers?")) return;
    setReseeding(true);
    const { error } = await supabase.rpc("regenerate_demo_data" as never);
    setReseeding(false);
    if (error) {
      toast.error("Failed to regenerate demo data", { description: error.message });
      return;
    }
    toast.success("Demo data regenerated");
    void loadStats();
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const cards = [
    { icon: Users, label: "Total users", value: stats?.users },
    { icon: Activity, label: "Sensors", value: stats?.sensors },
    { icon: Wallet, label: "Transactions", value: stats?.transactions },
    { icon: DbIcon, label: "Budgets", value: stats?.budgets },
    { icon: LifeBuoy, label: "Open tickets", value: stats?.tickets },
    { icon: Sprout, label: "Crop records", value: stats?.crops },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">System overview</h1>
          <p className="text-sm text-muted-foreground">Live database statistics and platform health.</p>
        </div>
        <Button onClick={regenerate} disabled={reseeding} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${reseeding ? "animate-spin" : ""}`} />
          {reseeding ? "Regenerating…" : "Regenerate demo data"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="holo-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{c.value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
