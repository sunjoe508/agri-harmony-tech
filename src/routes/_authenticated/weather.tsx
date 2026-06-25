import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun } from "lucide-react";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({ meta: [{ title: "Weather — AgriSmart" }] }),
  component: WeatherPage,
});

type Row = {
  id: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  fetched_at: string;
  payload: Record<string, unknown> | null;
};

function WeatherPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("weather_data")
        .select("id,location,latitude,longitude,fetched_at,payload")
        .order("fetched_at", { ascending: false })
        .limit(10);
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  const pick = (p: Row["payload"], k: string): string | number | null => {
    if (!p || typeof p !== "object") return null;
    const v = (p as Record<string, unknown>)[k];
    return typeof v === "string" || typeof v === "number" ? v : null;
  };

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
              {rows.map((r) => {
                const temp = pick(r.payload, "temperature_c") ?? pick(r.payload, "temp");
                const hum = pick(r.payload, "humidity_pct") ?? pick(r.payload, "humidity");
                const cond = pick(r.payload, "conditions") ?? pick(r.payload, "summary");
                return (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{r.location ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.fetched_at).toLocaleString()} {cond ? `· ${cond}` : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl">{temp ?? "—"}{temp != null ? "°C" : ""}</div>
                      <div className="text-xs text-muted-foreground">{hum != null ? `${hum}% humidity` : "—"}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
