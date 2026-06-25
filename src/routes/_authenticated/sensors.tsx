import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplet, Thermometer, Wind, FlaskConical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/sensors")({
  head: () => ({ meta: [{ title: "Sensors — AgriSmart" }] }),
  component: SensorsPage,
});

type Sensor = {
  id: string;
  name: string;
  type: string;
  location: string | null;
  unit: string | null;
  min_threshold: number | null;
  max_threshold: number | null;
  last_reading: number | null;
  last_reading_at: string | null;
  is_active: boolean;
};

const ICONS: Record<string, typeof Activity> = {
  soil_moisture: Droplet,
  temperature: Thermometer,
  humidity: Wind,
  ph: FlaskConical,
};

function SensorsPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("sensors")
        .select("*")
        .order("name");
      setSensors((data ?? []) as Sensor[]);
      setLoading(false);
    };
    void load();

    const ch = supabase
      .channel("sensors-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "sensor_readings" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sensors" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading sensors…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">Sensor monitoring</h1>
        <p className="text-sm text-muted-foreground">Live IoT readings from your farm. Updates in real time.</p>
      </div>

      {sensors.length === 0 ? (
        <Card className="holo-card">
          <CardContent className="py-8 text-sm text-muted-foreground">
            No sensors registered yet. Demo data can be seeded from the admin portal.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sensors.map((s) => {
            const Icon = ICONS[s.type] ?? Activity;
            const out =
              s.last_reading != null &&
              ((s.min_threshold != null && s.last_reading < s.min_threshold) ||
                (s.max_threshold != null && s.last_reading > s.max_threshold));
            return (
              <Card key={s.id} className="holo-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="font-display text-base">{s.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{s.location ?? "—"}</p>
                  </div>
                  <Icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold">
                      {s.last_reading != null ? Number(s.last_reading).toFixed(1) : "—"}
                    </span>
                    <span className="text-sm text-muted-foreground">{s.unit}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {s.last_reading_at
                        ? formatDistanceToNow(new Date(s.last_reading_at), { addSuffix: true })
                        : "no data"}
                    </span>
                    {out ? (
                      <Badge variant="destructive">out of range</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">ok</Badge>
                    )}
                  </div>
                  {s.min_threshold != null && s.max_threshold != null && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      range {s.min_threshold} – {s.max_threshold} {s.unit}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
