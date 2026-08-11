import { Fingerprint } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const supabase = await createClient();
  const { data: logs } = await supabase.from("audit_logs").select("id, action, entity_type, entity_id, created_at, actor:profiles(full_name)").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(50);

  return <><header><span className="text-[10px] font-bold tracking-[.16em] text-emerald-300">RASTREABILIDADE</span><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Auditoria</h1><p className="mt-2 text-sm text-emerald-50/40">Eventos administrativos sensíveis preservados por tenant.</p></header><section className="dashboard-panel mt-8 overflow-hidden">{logs?.length ? logs.map((log) => { const actor = log.actor as unknown as { full_name?: string } | null; return <article key={log.id} className="flex items-center gap-4 border-b border-emerald-100/[.06] px-5 py-4 last:border-0"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Fingerprint size={16} /></span><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{log.action}</strong><span className="text-[10px] text-emerald-50/35">{actor?.full_name || "Sistema"} · {log.entity_type}</span></div><time className="text-[10px] text-emerald-50/30">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.created_at))}</time></article>; }) : <div className="grid min-h-64 place-items-center p-8 text-center"><div><Fingerprint className="mx-auto text-emerald-300" /><h2 className="mt-4 font-semibold">Nenhum evento registrado</h2><p className="mt-2 text-xs text-emerald-50/35">As próximas ações administrativas aparecerão aqui.</p></div></div>}</section></>;
}
