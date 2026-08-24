import { CheckCircle2, MessageCircleMore, RefreshCw, Send } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, shortDate } from "@/lib/supabase/operational";
import { createCampaignAction, refreshRetentionAction, updateCampaignStatusAction, updateRetentionTaskAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";

export default async function RelationshipPage() {
  const context = await requireOrganization(); const organization = context.activeOrganization as unknown as { id: string }; const db = await createOperationalClient();
  const [{ data: campaigns }, { data: tasks }] = await Promise.all([
    db.from("communication_campaigns").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(100),
    db.from("retention_tasks").select("id,title,type,priority,status,due_at,notes,member:members(full_name)").eq("organization_id", organization.id).neq("status", "done").order("priority", { ascending: false }).limit(100),
  ]);
  return <>
    <PageTitle eyebrow="RETENÇÃO E COMUNICAÇÃO" title="Relacionamento" description="Campanhas organizadas e ações de retenção geradas pelo comportamento e cobrança." badge={`${tasks?.length ?? 0} AÇÕES`} />
    <div className="mt-8 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <section className="dashboard-panel p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Send size={17} className="text-emerald-300" />Nova campanha</h2>
        <ActionForm action={createCampaignAction} className="mt-4 grid gap-3">
          <input className={inputClass} required name="name" placeholder="Nome da campanha" />
          <div className="grid grid-cols-2 gap-3"><select className={inputClass} name="channel"><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="sms">SMS</option><option value="push">Push</option></select><select className={inputClass} name="audience"><option value="active">Alunos ativos</option><option value="inactive">Inativos</option><option value="overdue">Inadimplentes</option><option value="leads">Leads</option><option value="birthday">Aniversariantes</option><option value="all">Todos</option></select></div>
          <input className={inputClass} name="scheduled_at" type="datetime-local" aria-label="Agendamento opcional" />
          <textarea className={inputClass} required name="message" rows={5} placeholder="Mensagem da campanha" />
          <button className={buttonClass}>Salvar campanha</button>
        </ActionForm>
        <p className="mt-3 text-[10px] leading-5 text-emerald-50/35">O painel organiza público, conteúdo e execução. O disparo automático depende da futura conexão de WhatsApp, e-mail ou SMS; até lá, marque a campanha como executada após o envio manual.</p>
      </section>
      <section className="dashboard-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-emerald-100/10 p-5"><div><h2 className="font-semibold">Central de retenção</h2><p className="mt-1 text-xs text-emerald-50/35">Ações sugeridas a partir de ausência e inadimplência.</p></div><ActionForm action={refreshRetentionAction}><button className="flex items-center gap-2 rounded-full border border-emerald-300/20 px-3 py-2 text-[10px] font-bold text-emerald-300"><RefreshCw size={13} />Atualizar</button></ActionForm></div>
        {tasks?.length ? tasks.map((task) => { const member = task.member as unknown as { full_name?: string }; return <article className="grid gap-3 border-b border-emerald-100/[.06] p-5 last:border-0 md:grid-cols-[auto_1fr_auto] md:items-center" key={task.id}><span className="grid size-9 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><MessageCircleMore size={16} /></span><div className="min-w-0"><strong className="block text-sm">{task.title}</strong><span className="text-[10px] text-emerald-50/35">{member?.full_name} · {task.type} · {shortDate(task.due_at)} · {task.priority}</span></div><ActionForm action={updateRetentionTaskAction} className="flex gap-2"><input type="hidden" name="task_id" value={task.id} /><select className={`${inputClass} py-2 text-[9px]`} name="status" defaultValue={task.status}><option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="done">Concluída</option><option value="cancelled">Cancelada</option></select><button className="rounded-lg border border-emerald-300/20 p-2 text-emerald-300" aria-label="Atualizar"><CheckCircle2 size={15} /></button></ActionForm></article>; }) : <div className="grid min-h-56 place-items-center text-center text-sm text-emerald-50/30">Atualize para identificar oportunidades de retenção.</div>}
      </section>
    </div>
    <section className="dashboard-panel mt-6 overflow-hidden"><header className="border-b border-emerald-100/10 p-5"><h2 className="font-semibold">Campanhas</h2></header>{campaigns?.length ? campaigns.map((campaign) => <article className="grid gap-3 border-b border-emerald-100/[.06] p-4 last:border-0 md:grid-cols-[1fr_1.2fr_auto] md:items-center" key={campaign.id}><div><strong className="text-sm">{campaign.name}</strong><span className="block text-[10px] text-emerald-50/35">{campaign.channel} · {campaign.audience}</span></div><p className="line-clamp-2 text-xs leading-5 text-emerald-50/45">{campaign.message}</p><ActionForm action={updateCampaignStatusAction} className="flex gap-2"><input type="hidden" name="campaign_id" value={campaign.id} /><select className={`${inputClass} py-2 text-[9px]`} name="status" defaultValue={campaign.status}><option value="draft">Rascunho</option><option value="scheduled">Agendada</option><option value="sent">Executada</option><option value="cancelled">Cancelada</option></select><button className="rounded-lg border border-cyan-300/20 px-3 text-[10px] font-bold text-cyan-200">Salvar</button></ActionForm></article>) : <p className="p-8 text-center text-xs text-emerald-50/30">Nenhuma campanha criada.</p>}</section>
  </>;
}
