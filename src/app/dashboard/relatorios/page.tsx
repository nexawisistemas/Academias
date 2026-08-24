import Link from "next/link";
import { Activity, AlertTriangle, CircleDollarSign, Download, Target, TrendingUp, UsersRound } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, money } from "@/lib/supabase/operational";
import { inputClass, PageTitle } from "../ui";

function dateOr(value: string | undefined, fallback: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback; }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const query = await searchParams;
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const start = dateOr(query.start, monthStart);
  const end = dateOr(query.end, now.toISOString().slice(0, 10));
  const endExclusive = new Date(`${end}T00:00:00`); endExclusive.setDate(endExclusive.getDate() + 1);
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  const [{ count: activeMembers }, { count: leads }, { count: won }, { data: payments }, { data: expenses }, { count: accesses }, { count: overdue }, { count: atRisk }] = await Promise.all([
    db.from("members").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active"),
    db.from("crm_leads").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).gte("created_at", `${start}T00:00:00`).lt("created_at", endExclusive.toISOString()),
    db.from("crm_leads").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "won").gte("won_at", `${start}T00:00:00`).lt("won_at", endExclusive.toISOString()),
    db.from("payments").select("amount_cents,method").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", `${start}T00:00:00`).lt("paid_at", endExclusive.toISOString()),
    db.from("expenses").select("amount_cents,category,status").eq("organization_id", organization.id).eq("status", "paid").gte("due_date", start).lte("due_date", end),
    db.from("access_events").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("direction", "entry").gte("occurred_at", `${start}T00:00:00`).lt("occurred_at", endExclusive.toISOString()),
    db.from("invoices").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).in("status", ["open", "overdue"]).lte("due_date", end),
    db.from("retention_tasks").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "open"),
  ]);
  const revenue = payments?.reduce((sum, item) => sum + item.amount_cents, 0) ?? 0;
  const costs = expenses?.reduce((sum, item) => sum + item.amount_cents, 0) ?? 0;
  const result = revenue - costs;
  const conversion = leads ? Math.round(((won ?? 0) / leads) * 100) : 0;
  const ticket = payments?.length ? Math.round(revenue / payments.length) : 0;
  const metrics = [
    { label: "Alunos ativos", value: String(activeMembers ?? 0), note: "base atual", icon: UsersRound },
    { label: "Receita", value: money(revenue), note: `${payments?.length ?? 0} recebimentos`, icon: CircleDollarSign },
    { label: "Resultado", value: money(result), note: `${money(costs)} em despesas`, icon: TrendingUp },
    { label: "Conversão comercial", value: `${conversion}%`, note: `${won ?? 0} de ${leads ?? 0} leads`, icon: Target },
  ];
  const maxFlow = Math.max(revenue, costs, Math.abs(result), 1);

  return <>
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <PageTitle eyebrow="INTELIGÊNCIA DE GESTÃO" title="Relatórios" description="Analise caixa, crescimento, frequência e retenção no período escolhido." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="flex gap-2" method="get"><input className={inputClass} type="date" name="start" defaultValue={start} aria-label="Data inicial" /><input className={inputClass} type="date" name="end" defaultValue={end} aria-label="Data final" /><button className="rounded-xl border border-emerald-300/20 px-4 text-xs font-bold text-emerald-300">Aplicar</button></form>
        <Link href={`/dashboard/relatorios/export?start=${start}&end=${end}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-bold text-emerald-950"><Download size={14} />Exportar CSV</Link>
      </div>
    </div>
    <section className="metric-dashboard-grid mt-8">{metrics.map(({ label, value, note, icon: Icon }) => <article className="dashboard-metric" key={label}><header>{label}<span><Icon size={16} /></span></header><strong>{value}</strong><small>{note}</small></article>)}</section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="dashboard-panel p-6"><TrendingUp size={21} className="text-emerald-300" /><h2 className="mt-5 text-xl font-semibold">Fluxo financeiro do período</h2><p className="mt-1 text-xs text-emerald-50/35">Comparação entre valores efetivamente recebidos e despesas pagas.</p><div className="mt-6 grid gap-5">{[["Receitas", revenue, "bg-emerald-300"], ["Despesas", costs, "bg-rose-300"], ["Resultado", Math.abs(result), result >= 0 ? "bg-cyan-300" : "bg-amber-300"]].map(([label, value, color]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="text-emerald-50/50">{String(label)}</span><strong>{money(Number(value))}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${String(color)}`} style={{ width: `${Math.max(2, Math.round((Number(value) / maxFlow) * 100))}%` }} /></div></div>)}</div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-black/15 p-4"><span className="text-[10px] text-emerald-50/35">TICKET MÉDIO</span><strong className="mt-2 block text-lg">{money(ticket)}</strong></div><div className="rounded-xl bg-black/15 p-4"><span className="text-[10px] text-emerald-50/35">CHECK-INS</span><strong className="mt-2 block text-lg">{accesses ?? 0}</strong></div></div></article>
      <article className="dashboard-panel p-6"><AlertTriangle size={21} className="text-amber-300" /><h2 className="mt-5 text-xl font-semibold">Saúde da operação</h2><div className="mt-5 grid gap-3"><div className="flex items-center justify-between rounded-xl bg-black/15 p-4"><span className="text-xs text-emerald-50/45">Mensalidades abertas ou vencidas</span><strong className="text-rose-300">{overdue ?? 0}</strong></div><div className="flex items-center justify-between rounded-xl bg-black/15 p-4"><span className="text-xs text-emerald-50/45">Tarefas de retenção abertas</span><strong className="text-amber-300">{atRisk ?? 0}</strong></div><div className="flex items-center justify-between rounded-xl bg-black/15 p-4"><span className="text-xs text-emerald-50/45">Leads ganhos no período</span><strong className="text-emerald-300">{won ?? 0}</strong></div></div><div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-xs leading-6 text-cyan-50/55"><Activity size={15} className="mb-2 text-cyan-300" />Use o CRM para agir sobre oportunidades e Relacionamento para acompanhar retenção. Os dados deste relatório são obtidos diretamente da operação.</div></article>
    </section>
  </>;
}
