import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — AgriSmart" }] }),
  component: () => (
    <div className="mx-auto max-w-xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Conversational crop & finance advisor coming in Phase 2.</p>
          <p>Will use Lovable AI Gateway to provide grounded recommendations from your sensors, weather, and finance data.</p>
        </CardContent>
      </Card>
    </div>
  ),
});
