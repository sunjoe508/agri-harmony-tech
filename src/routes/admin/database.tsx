import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export const Route = createFileRoute("/admin/database")({
  head: () => ({ meta: [{ title: "Database — Admin" }] }),
  component: () => (
    <div className="mx-auto max-w-xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Database overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detailed table inspection, demo data generator, and admin emails will arrive in Phase 5.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
