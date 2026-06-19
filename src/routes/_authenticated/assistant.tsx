import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — AgriSmart" }] }),
  component: () => (
    <div className="mx-auto max-w-xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> AI farming advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chat-based farming advisor powered by Lovable AI (Gemini). Arriving in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
