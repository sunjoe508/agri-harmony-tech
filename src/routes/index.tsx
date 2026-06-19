import { createFileRoute, Link } from "@tanstack/react-router";
import { NeuralBackground } from "@/components/NeuralBackground";
import { Button } from "@/components/ui/button";
import { Sprout, Activity, CloudSun, Wallet, Bot, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriSmart — Smart Farm Management" },
      { name: "description", content: "IoT sensors, weather, finance and AI assistance for modern farmers." },
      { property: "og:title", content: "AgriSmart — Smart Farm Management" },
      { property: "og:description", content: "Run a smarter farm with real-time sensor data, AI advice, and a unified dashboard." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Activity, title: "IoT Sensors", desc: "Soil, water, light & climate in real time." },
  { icon: CloudSun, title: "Weather Intelligence", desc: "7-day forecasts with agronomic advice." },
  { icon: Wallet, title: "Farm Finance", desc: "Budgets, expenses, income and reports." },
  { icon: Bot, title: "AI Assistant", desc: "Ask anything — from pests to pricing." },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <NeuralBackground />

      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <Sprout className="h-6 w-6 text-primary" />
          <span>AgriSmart</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin-auth">
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Admin
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 pb-20 pt-12">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Smart farms, real-time intelligence
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            <span className="gradient-text">Grow smarter.</span>
            <br />
            Farm with data.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            AgriSmart unifies IoT sensors, weather, finance, and AI guidance in one
            beautifully simple dashboard — built for modern farmers.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="glow">
              <Link to="/auth">Get started — it's free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-24 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="holo-card p-6">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
