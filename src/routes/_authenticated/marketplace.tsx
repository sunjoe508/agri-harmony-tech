import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — AgriSmart" }] }),
  component: MarketplacePage,
});

type Product = { id: string; name: string; description: string | null; category: string | null; price: number; unit: string | null; stock: number | null; image_url: string | null };

function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("vendor_products").select("*").order("name");
      setProducts((data ?? []) as Product[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Inputs and equipment from verified vendors.</p>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : products.length === 0 ? (
        <Card className="holo-card"><CardContent className="py-8 text-sm text-muted-foreground">No products listed yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="holo-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-display text-base">{p.name}</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                {p.category && <Badge variant="outline" className="w-fit">{p.category}</Badge>}
              </CardHeader>
              <CardContent>
                {p.description && <p className="mb-2 text-xs text-muted-foreground">{p.description}</p>}
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-xl font-bold">KES {Number(p.price).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">/ {p.unit ?? "unit"}</span>
                </div>
                {p.stock != null && <p className="mt-1 text-xs text-muted-foreground">{p.stock} in stock</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
