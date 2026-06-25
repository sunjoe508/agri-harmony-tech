import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — AgriSmart" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [stats, setStats] = useState<{ crops: number; sensors: number; cycles: number; income: number; expense: number } | null>(null);

  useEffect(() => {
    void (async () => {
      const [crops, sensors, cycles, tx] = await Promise.all([
        supabase.from("farm_records").select("id", { count: "exact", head: true }),
        supabase.from("sensors").select("id", { count: "exact", head: true }),
        supabase.from("irrigation_cycles").select("id", { count: "exact", head: true }),
        supabase.from("financial_transactions").select("type,amount"),
      ]);
      const income = (tx.data ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expense = (tx.data ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      setStats({ crops: crops.count ?? 0, sensors: sensors.count ?? 0, cycles: cycles.count ?? 0, income, expense });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">Reports</h1>
        <p className="text-sm text-muted-foreground">Aggregated farm activity summary.</p>
      </div>
      <Card className="holo-card">
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Summary</CardTitle></CardHeader>
        <CardContent>
          {!stats ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <Row label="Crop records" value={stats.crops} />
              <Row label="Active sensors" value={stats.sensors} />
              <Row label="Irrigation cycles" value={stats.cycles} />
              <Row label="Total income" value={`KES ${stats.income.toLocaleString()}`} />
              <Row label="Total expense" value={`KES ${stats.expense.toLocaleString()}`} />
              <Row label="Net" value={`KES ${(stats.income - stats.expense).toLocaleString()}`} />
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded border border-border/40 bg-background/40 px-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-display font-semibold">{value}</dd>
    </div>
  );
}
