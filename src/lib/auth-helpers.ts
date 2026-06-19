import { supabase } from "@/integrations/supabase/client";

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function logActivity(
  userId: string,
  action: string,
  entity?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action,
    entity: entity ?? null,
    entity_id: entityId ?? null,
    metadata: metadata ?? null,
  });
}
