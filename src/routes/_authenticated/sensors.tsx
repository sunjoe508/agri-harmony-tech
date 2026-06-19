import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sensors")({
  head: () => ({ meta: [{ title: "Sensors — AgriSmart" }] }),
  component: () => <ComingSoon title="Sensor Monitoring" desc="Register IoT sensors and view real-time soil/water/climate readings. Arriving in Phase 2." />,
});

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </div>
  );
}
