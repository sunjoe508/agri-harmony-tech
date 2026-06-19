import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/auth-helpers";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin-auth" });
    const ok = await isAdmin(data.user.id);
    if (!ok) throw redirect({ to: "/admin-auth" });
    return { user: data.user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
