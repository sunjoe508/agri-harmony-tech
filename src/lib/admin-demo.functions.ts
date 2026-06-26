import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const regenerateDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Verify admin via RLS-respecting client (admin_roles is admin-only readable; service role bypasses RLS so we check as the user).
    const { data: isAdminRow } = await context.supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    if (!isAdminRow) {
      throw new Response("Forbidden", { status: 403 });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("regenerate_demo_data" as never);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true, data };
  });
