import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — AgriSmart" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  farm_name: string | null;
  farm_location: string | null;
  county: string | null;
  farm_size_acres: number | null;
  bio: string | null;
};

function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setP(data as Profile);
    })();
  }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!p) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: p.full_name,
          phone: p.phone,
          farm_name: p.farm_name,
          farm_location: p.farm_location,
          county: p.county,
          farm_size_acres: p.farm_size_acres,
          bio: p.bio,
        })
        .eq("id", p.id);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !p) return;
    setUploading(true);
    try {
      const path = `${p.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr) throw sErr;
      const { error } = await supabase.from("profiles").update({ avatar_url: signed.signedUrl }).eq("id", p.id);
      if (error) throw error;
      setP({ ...p, avatar_url: signed.signedUrl });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!p) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="holo-card">
        <CardHeader>
          <CardTitle className="font-display">Your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback>{(p.full_name ?? p.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline">
                {uploading ? "Uploading…" : "Change photo"}
              </Label>
              <input id="avatar" type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              <p className="mt-1 text-xs text-muted-foreground">{p.email}</p>
            </div>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={p.full_name ?? ""} onChange={(v) => setP({ ...p, full_name: v })} />
              <Field label="Phone" value={p.phone ?? ""} onChange={(v) => setP({ ...p, phone: v })} />
              <Field label="Farm name" value={p.farm_name ?? ""} onChange={(v) => setP({ ...p, farm_name: v })} />
              <Field label="County" value={p.county ?? ""} onChange={(v) => setP({ ...p, county: v })} />
              <Field
                label="Location"
                value={p.farm_location ?? ""}
                onChange={(v) => setP({ ...p, farm_location: v })}
              />
              <Field
                label="Farm size (acres)"
                type="number"
                value={p.farm_size_acres?.toString() ?? ""}
                onChange={(v) => setP({ ...p, farm_size_acres: v ? Number(v) : null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={p.bio ?? ""} onChange={(e) => setP({ ...p, bio: e.target.value })} rows={3} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
