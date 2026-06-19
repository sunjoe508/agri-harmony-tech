import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun } from "lucide-react";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({ meta: [{ title: "Weather — AgriSmart" }] }),
  component: () => (
    <div className="mx-auto max-w-xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-primary" /> Weather dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Current conditions, 7-day forecast, agricultural advice. Arriving in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
