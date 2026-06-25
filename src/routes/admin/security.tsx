import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, RefreshCw, Lock, Radio } from "lucide-react";

export const Route = createFileRoute("/admin/security")({
  head: () => ({ meta: [{ title: "Security — AgriSmart Admin" }] }),
  component: SecurityPage,
});

// Static map of expected RLS coverage. Mirrors what migrations established.
const TABLES: Array<{ name: string; rls: boolean; policies: number; notes: string }> = [
  { name: "profiles", rls: true, policies: 4, notes: "Owner read/update; admin read-all" },
  { name: "user_roles", rls: true, policies: 2, notes: "Self read; admin manage" },
  { name: "admin_roles", rls: true, policies: 5, notes: "Admin-only manage, no self-elevation" },
  { name: "sensors", rls: true, policies: 2, notes: "Owner scoped" },
  { name: "sensor_readings", rls: true, policies: 2, notes: "Owner scoped" },
  { name: "irrigation_cycles", rls: true, policies: 2, notes: "Owner scoped" },
  { name: "farm_records", rls: true, policies: 2, notes: "Owner scoped" },
  { name: "financial_transactions", rls: true, policies: 2, notes: "Owner scoped" },
  { name: "budgets", rls: true, policies: 2, notes: "Owner scoped" },
  { name: "notifications", rls: true, policies: 1, notes: "Owner read" },
  { name: "support_tickets", rls: true, policies: 5, notes: "Owner read/insert; admin manage" },
  { name: "vendor_products", rls: true, policies: 3, notes: "Public read; vendor manage" },
  { name: "weather_data", rls: true, policies: 1, notes: "Public read" },
  { name: "activity_logs", rls: true, policies: 3, notes: "Owner read; admin read-all" },
];

const REALTIME_TABLES = ["sensor_readings", "sensors", "irrigation_cycles", "support_tickets", "notifications"];

function SecurityPage() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const next: Record<string, number | null> = {};
    await Promise.all(
      TABLES.map(async (t) => {
        const { count, error } = await supabase
          .from(t.name as never)
          .select("*", { count: "exact", head: true });
        next[t.name] = error ? null : count ?? 0;
      }),
    );
    setCounts(next);
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const total = TABLES.length;
  const covered = TABLES.filter((t) => t.rls).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">Security status</h1>
          <p className="text-sm text-muted-foreground">
            Row-Level Security coverage, realtime publication, and storage policy state.
          </p>
        </div>
        <Button onClick={load} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Re-check
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={ShieldCheck} label="RLS coverage" value={`${covered}/${total}`} ok={covered === total} />
        <Stat icon={Radio} label="Realtime tables" value={`${REALTIME_TABLES.length}`} ok />
        <Stat icon={Lock} label="Storage buckets" value="1 private" ok />
      </div>

      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display">RLS coverage by table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Table</th>
                <th className="py-2 pr-4">RLS</th>
                <th className="py-2 pr-4">Policies</th>
                <th className="py-2 pr-4">Rows</th>
                <th className="py-2 pr-4">Realtime</th>
                <th className="py-2 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {TABLES.map((t) => (
                <tr key={t.name} className="border-t border-border/40">
                  <td className="py-2 pr-4 font-mono text-xs">{t.name}</td>
                  <td className="py-2 pr-4">
                    {t.rls ? (
                      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">on</Badge>
                    ) : (
                      <Badge variant="destructive">off</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-4">{t.policies}</td>
                  <td className="py-2 pr-4">{counts[t.name] ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {REALTIME_TABLES.includes(t.name) ? (
                      <Badge variant="secondary" className="bg-primary/15 text-primary">live</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Hardening applied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Avatars bucket is private; objects scoped to <code>auth.uid()</code> folder.</p>
          <p>• Admin role table protected against self-elevation (admin-only writes).</p>
          <p>• Realtime broadcast/presence topics scoped to <code>user:{"{uid}"}</code>.</p>
          <p>• SECURITY DEFINER functions: EXECUTE revoked from <code>anon</code>; trigger functions revoked from <code>authenticated</code>.</p>
          <p>• <code>regenerate_demo_data</code> gated by <code>is_admin(auth.uid())</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <Card className="holo-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${ok ? "text-emerald-400" : "text-destructive"}`} />
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
