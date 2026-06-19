import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/map")({
  head: () => ({ meta: [{ title: "Farmers Map — Admin" }] }),
  component: AdminMap,
});

// Approx centroids of Kenyan counties (subset).
const COUNTY_COORDS: Record<string, [number, number]> = {
  Nairobi: [-1.286, 36.817],
  Mombasa: [-4.043, 39.668],
  Kisumu: [-0.092, 34.768],
  Nakuru: [-0.303, 36.08],
  Kiambu: [-1.171, 36.83],
  Machakos: [-1.518, 37.266],
  Uasin: [0.515, 35.269],
  Meru: [0.047, 37.65],
  Kakamega: [0.282, 34.752],
  Bungoma: [0.563, 34.56],
  Eldoret: [0.514, 35.27],
  Nyeri: [-0.42, 36.95],
  Embu: [-0.531, 37.45],
  Kilifi: [-3.51, 39.85],
  Kitui: [-1.37, 38.01],
};

const KENYA_BOUNDS = { latMin: -5, latMax: 5.5, lngMin: 33.5, lngMax: 42 };
const W = 600;
const H = 600;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - KENYA_BOUNDS.lngMin) / (KENYA_BOUNDS.lngMax - KENYA_BOUNDS.lngMin)) * W;
  const y = H - ((lat - KENYA_BOUNDS.latMin) / (KENYA_BOUNDS.latMax - KENYA_BOUNDS.latMin)) * H;
  return [x, y];
}

function AdminMap() {
  const [byCounty, setByCounty] = useState<Record<string, number>>({});

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("profiles").select("county");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: { county: string | null }) => {
        if (!r.county) return;
        const key = Object.keys(COUNTY_COORDS).find((k) => k.toLowerCase() === r.county!.toLowerCase());
        if (key) counts[key] = (counts[key] ?? 0) + 1;
      });
      setByCounty(counts);
    })();
  }, []);

  function activityColor(n: number): string {
    if (n >= 10) return "var(--color-success)";
    if (n >= 3) return "var(--color-warning)";
    return "var(--color-info)";
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold gradient-text">Farmers map — Kenya</h1>

      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display">Activity by county</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 lg:flex-row">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="aspect-square w-full max-w-xl rounded-lg border border-border bg-card/30"
            >
              {/* Simple Kenya bounding-box backdrop */}
              <rect x="0" y="0" width={W} height={H} fill="oklch(0.18 0.03 230)" />
              <rect
                x="0"
                y="0"
                width={W}
                height={H}
                fill="none"
                stroke="oklch(0.78 0.2 155 / 0.2)"
                strokeWidth="2"
              />
              {Object.entries(COUNTY_COORDS).map(([name, [lat, lng]]) => {
                const [x, y] = project(lat, lng);
                const n = byCounty[name] ?? 0;
                const r = Math.min(28, 6 + n * 2);
                return (
                  <g key={name}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={activityColor(n)}
                      fillOpacity="0.35"
                      stroke={activityColor(n)}
                      strokeWidth="1.5"
                    />
                    <text x={x} y={y - r - 4} textAnchor="middle" fontSize="10" fill="oklch(0.96 0.01 150)">
                      {name} {n > 0 ? `(${n})` : ""}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="space-y-3">
              <h3 className="font-display font-semibold">Legend</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-success)" }} />
                High activity (10+ farmers)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-warning)" }} />
                Medium (3–9)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-info)" }} />
                Low (1–2)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
