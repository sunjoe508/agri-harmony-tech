import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Droplets, Wallet, CloudSun, Sprout, TrendingUp, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AgriSmart" }] }),
  component: Dashboard,
});

type Stats = {
  sensors: number;
  activeCycles: number;
  income: number;
  expenses: number;
  records: number;
  openTickets: number;
};

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState<string>("");
  const [weather, setWeather] = useState<{ temp: number; desc: string; loc: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, sensors, cycles, tx, records, tickets] = await Promise.all([
        supabase.from("profiles").select("full_name, farm_name").eq("id", u.user.id).maybeSingle(),
        supabase.from("sensors").select("id", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase
          .from("irrigation_cycles")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.user.id)
          .eq("status", "scheduled"),
        supabase.from("financial_transactions").select("type, amount").eq("user_id", u.user.id),
        supabase.from("farm_records").select("id", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.user.id)
          .in("status", ["open", "in_progress"]),
      ]);

      const income = (tx.data ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = (tx.data ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

      setName(profile?.full_name ?? u.user.email?.split("@")[0] ?? "Farmer");
      setStats({
        sensors: sensors.count ?? 0,
        activeCycles: cycles.count ?? 0,
        income,
        expenses,
        records: records.count ?? 0,
        openTickets: tickets.count ?? 0,
      });
    })();

    // Mock weather widget — geolocation + open-meteo (no key needed)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const r = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weather_code`,
            );
            const j = await r.json();
            setWeather({
              temp: Math.round(j.current?.temperature_2m ?? 0),
              desc: weatherCodeToDesc(j.current?.weather_code ?? 0),
              loc: "Your location",
            });
          } catch {
            // ignore
          }
        },
        () => setWeather({ temp: 24, desc: "Partly cloudy", loc: "Default" }),
        { timeout: 5000 },
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-3xl font-bold">
          <span className="gradient-text">{name}</span>
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Sensors" value={stats?.sensors ?? "—"} hint="Connected devices" />
        <StatCard icon={Droplets} label="Irrigation" value={stats?.activeCycles ?? "—"} hint="Scheduled cycles" />
        <StatCard
          icon={TrendingUp}
          label="Net P&L"
          value={stats ? `KSh ${(stats.income - stats.expenses).toLocaleString()}` : "—"}
          hint={`Income KSh ${stats?.income.toLocaleString() ?? 0}`}
        />
        <StatCard icon={Sprout} label="Crops" value={stats?.records ?? "—"} hint="Farm records" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="holo-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary" /> Weather now
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="flex items-center gap-6">
                <div className="text-6xl font-display font-bold gradient-text">{weather.temp}°</div>
                <div>
                  <p className="text-lg font-medium">{weather.desc}</p>
                  <p className="text-sm text-muted-foreground">{weather.loc}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Allow location to see live weather.</p>
            )}
            <Button asChild variant="link" className="mt-2 px-0">
              <Link to="/weather">7-day forecast →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="holo-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ask the AgriSmart AI about pests, planting, pricing — anything farm related.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link to="/assistant">Chat now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickAction icon={Wallet} title="Add transaction" desc="Log income or expenses" to="/finance" />
        <QuickAction icon={Activity} title="Register a sensor" desc="Connect a new IoT device" to="/sensors" />
      </div>

      {stats?.openTickets ? (
        <div className="glass-card p-4 text-sm">
          You have <span className="font-semibold text-primary">{stats.openTickets}</span> open support
          ticket{stats.openTickets > 1 ? "s" : ""}. <Link to="/tickets" className="underline">View</Link>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="holo-card p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, to }: { icon: typeof Activity; title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="holo-card flex items-center gap-4 p-5 transition-colors hover:bg-accent/40">
      <div className="rounded-lg bg-primary/15 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "—";
}
