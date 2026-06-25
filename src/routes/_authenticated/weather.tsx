import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun } from "lucide-react";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({ meta: [{ title: "Weather — AgriSmart" }] }),
  component: WeatherPage,
});

type Row = { id: string; location: string | null; temperature_c: number | null; humidity_pct: number | null; conditions: string | null; recorded_at: string };

function WeatherPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("weather_data").select("*").order("recorded_at", { ascending: false }).limit(10);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">Weather</h1>
        <p className="text-sm text-muted-foreground">Latest readings near your farm.</p>
      </div>
      <Card className="holo-card">
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><CloudSun className="h-5 w-5 text-primary" /> Recent</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weather data yet. A scheduled job will populate this table.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{r.location ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.recorded_at).toLocaleString()} · {r.conditions ?? ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl">{r.temperature_c ?? "—"}°C</div>
                    <div className="text-xs text-muted-foreground">{r.humidity_pct ?? "—"}% humidity</div>
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
