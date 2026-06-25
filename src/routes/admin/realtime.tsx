import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/realtime")({
  head: () => ({ meta: [{ title: "Realtime Test — AgriSmart Admin" }] }),
  component: RealtimePage,
});

type Event = {
  id: string;
  table: string;
  type: string;
  at: string;
  payload: unknown;
};

const TABLES = ["sensor_readings", "sensors", "irrigation_cycles", "support_tickets", "notifications"];

function RealtimePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const idRef = useRef(0);

  useEffect(() => {
    const channels = TABLES.map((table) => {
      const ch = supabase
        .channel(`rt-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            idRef.current += 1;
            setEvents((prev) =>
              [
                {
                  id: `${idRef.current}`,
                  table,
                  type: payload.eventType,
                  at: new Date().toLocaleTimeString(),
                  payload: payload.new ?? payload.old,
                },
                ...prev,
              ].slice(0, 100),
            );
          },
        )
        .subscribe((s) => {
          setStatus((prev) => ({ ...prev, [table]: s }));
        });
      return ch;
    });
    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">Realtime monitor</h1>
        <p className="text-sm text-muted-foreground">
          Live postgres_changes stream. Trigger inserts (e.g. regenerate demo data) and watch events arrive.
        </p>
      </div>

      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" /> Subscription status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {TABLES.map((t) => {
            const s = status[t] ?? "connecting";
            const ok = s === "SUBSCRIBED";
            return (
              <Badge
                key={t}
                variant="secondary"
                className={ok ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}
              >
                {t}: {s}
              </Badge>
            );
          })}
        </CardContent>
      </Card>

      <Card className="holo-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Event stream ({events.length})</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEvents([])}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Waiting for events… Try regenerating demo data on the Overview page, or inserting a row.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {events.map((e) => (
                <li key={e.id} className="rounded border border-border/40 bg-background/40 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{e.type}</Badge>
                    <span className="font-mono">{e.table}</span>
                    <span className="ml-auto text-muted-foreground">{e.at}</span>
                  </div>
                  <pre className="mt-1 overflow-x-auto text-[10px] text-muted-foreground">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
