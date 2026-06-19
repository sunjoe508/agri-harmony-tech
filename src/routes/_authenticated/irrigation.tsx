import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/irrigation")({
  head: () => ({ meta: [{ title: "Irrigation — AgriSmart" }] }),
  component: () => (
    <div className="mx-auto max-w-xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Irrigation cycles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Schedule and log irrigation events tied to sensor thresholds. Arriving in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
