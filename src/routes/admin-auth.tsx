import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/auth-helpers";
import { NeuralBackground } from "@/components/NeuralBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin-auth")({
  head: () => ({ meta: [{ title: "Admin Sign in — AgriSmart" }] }),
  component: AdminAuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(100);

function AdminAuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const email = emailSchema.parse(fd.get("email"));
      const password = passwordSchema.parse(fd.get("password"));
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Sign in failed");
      const ok = await isAdmin(userId);
      if (!ok) {
        await supabase.auth.signOut();
        throw new Error("This account is not an administrator");
      }
      toast.success("Welcome, admin");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <NeuralBackground />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-bold">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="gradient-text">AgriSmart Admin</span>
        </Link>
        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-semibold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Restricted area. Authorized personnel only.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in to admin portal
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Not an admin?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Farmer sign-in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
