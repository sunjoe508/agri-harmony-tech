import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  county: string | null;
  farm_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setUsers((data ?? []) as Profile[]);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold gradient-text">Users</h1>
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display">Latest signups</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-4 py-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback>{(u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.full_name ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  <p>{u.farm_name ?? "—"}</p>
                  <p>{u.county ?? ""}</p>
                </div>
                <p className="hidden text-xs text-muted-foreground md:block">
                  {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
            {users.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
