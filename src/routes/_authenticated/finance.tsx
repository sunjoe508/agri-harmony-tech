import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Finance — AgriSmart" }] }),
  component: FinancePage,
});

type Tx = {
  id: string;
  type: "income" | "expense";
  category: string | null;
  amount: number;
  description: string | null;
  occurred_on: string;
};

function FinancePage() {
  const [tx, setTx] = useState<Tx[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", category: "", amount: "", description: "", occurred_on: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const { data } = await supabase.from("financial_transactions").select("*").order("occurred_on", { ascending: false });
    setTx((data ?? []) as Tx[]);
  };
  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => {
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [tx]);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("financial_transactions").insert({
      user_id: u.user.id,
      type: form.type,
      category: form.category || null,
      amount: Number(form.amount),
      description: form.description || null,
      occurred_on: form.occurred_on,
    });
    if (error) return toast.error(error.message);
    toast.success("Transaction added");
    setOpen(false);
    setForm({ type: "expense", category: "", amount: "", description: "", occurred_on: new Date().toISOString().slice(0, 10) });
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">Finance</h1>
          <p className="text-sm text-muted-foreground">Income, expenses, and net cashflow.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New transaction</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Amount (KES)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={create} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="holo-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Income</CardTitle><TrendingUp className="h-4 w-4 text-emerald-400" /></CardHeader><CardContent><p className="font-display text-2xl font-bold text-emerald-400">KES {totals.income.toLocaleString()}</p></CardContent></Card>
        <Card className="holo-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Expense</CardTitle><TrendingDown className="h-4 w-4 text-destructive" /></CardHeader><CardContent><p className="font-display text-2xl font-bold text-destructive">KES {totals.expense.toLocaleString()}</p></CardContent></Card>
        <Card className="holo-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Net</CardTitle><Wallet className="h-4 w-4 text-primary" /></CardHeader><CardContent><p className="font-display text-2xl font-bold">KES {totals.net.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card className="holo-card">
        <CardHeader><CardTitle className="font-display">Transactions</CardTitle></CardHeader>
        <CardContent>
          {tx.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {tx.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={t.type === "income" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}>{t.type}</Badge>
                      <span className="font-medium">{t.category ?? "—"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(t.occurred_on).toLocaleDateString()} {t.description && `· ${t.description}`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-semibold ${t.type === "income" ? "text-emerald-400" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "-"}KES {Number(t.amount).toLocaleString()}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
