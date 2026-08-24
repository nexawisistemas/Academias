import { CreditCard, FileSignature, Layers3, PauseCircle, Plus } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, money, shortDate } from "@/lib/supabase/operational";
import { createContractAction, createPlanAction, createSubscriptionAction, updateContractStatusAction, updatePlanStatusAction, updateSubscriptionStatusAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";
import { createPaymentCheckoutAction } from "../financeiro/payment-actions";

const cycle: Record<string, string> = { monthly: "Mensal", quarterly: "Trimestral", semiannual: "Semestral", annual: "Anual" };

export default async function PlansPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  const [{ data: plans }, { data: members }, { data: branches }, { data: subscriptions }, { data: contracts }, { data: gateways }, { data: providerSubscriptions }] = await Promise.all([
    db.from("membership_plans").select("*").eq("organization_id", organization.id).order("active", { ascending: false }).order("price_cents"),
    db.from("members").select("id,full_name").eq("organization_id", organization.id).eq("status", "active").order("full_name"),
    db.from("branches").select("id,name").eq("organization_id", organization.id).eq("status", "active"),
    db.from("subscriptions").select("id,status,amount_cents,discount_cents,starts_on,next_billing_on,member_id,member:members(full_name),plan:membership_plans(name)").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(100),
    db.from("member_contracts").select("id,title,status,terms_version,created_at,member:members(full_name)").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(50),
    db.from("payment_provider_connections").select("id,provider,status").eq("organization_id", organization.id).eq("status", "active"),
    db.from("payment_provider_subscriptions").select("connection_id,subscription_id,mode,status").eq("organization_id", organization.id),
  ]);
  const activeSubscriptions = subscriptions?.filter((item) => item.status === "active").length ?? 0;

  return <>
    <PageTitle eyebrow="PRODUTOS E RECORRÊNCIA" title="Planos, matrículas e contratos" description="Oferta, vínculo, cobrança, ciclo de vida e aceite no mesmo fluxo." badge={`${activeSubscriptions} ATIVAS`} />
    <div className="mt-8 grid gap-4 xl:grid-cols-3">
      <section className="dashboard-panel p-5">
        <h2 className="flex gap-2 font-semibold"><Plus size={16} className="text-emerald-300" />Novo plano</h2>
        <ActionForm action={createPlanAction} className="mt-4 grid gap-3">
          <input className={inputClass} name="name" required placeholder="Nome do plano" />
          <div className="grid grid-cols-2 gap-2"><input className={inputClass} name="price" required type="number" min="0" step="0.01" placeholder="Mensalidade" /><input className={inputClass} name="enrollment_fee" type="number" min="0" step="0.01" placeholder="Matrícula" /></div>
          <select className={inputClass} name="billing_cycle"><option value="monthly">Mensal</option><option value="quarterly">Trimestral</option><option value="semiannual">Semestral</option><option value="annual">Anual</option></select>
          <input className={inputClass} name="access_limit" type="number" min="1" max="14" placeholder="Acessos por semana" />
          <textarea className={inputClass} name="description" placeholder="Descrição comercial" />
          <textarea className={inputClass} name="benefits" rows={4} placeholder={"Benefícios — um por linha"} />
          <button className={buttonClass}>Criar plano</button>
        </ActionForm>
      </section>
      <section className="dashboard-panel p-5">
        <h2 className="flex gap-2 font-semibold"><Layers3 size={16} className="text-cyan-300" />Nova matrícula</h2>
        <ActionForm action={createSubscriptionAction} className="mt-4 grid gap-3">
          <select className={inputClass} name="member_id" required><option value="">Aluno</option>{members?.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select>
          <select className={inputClass} name="plan_id" required><option value="">Plano ativo</option>{plans?.filter((plan) => plan.active).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price_cents)}</option>)}</select>
          <select className={inputClass} name="branch_id"><option value="">Unidade</option>{branches?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><label className="text-[9px] text-emerald-50/40">INÍCIO<input className={`${inputClass} mt-1 w-full`} name="starts_on" type="date" /></label><label className="text-[9px] text-emerald-50/40">1ª COBRANÇA<input className={`${inputClass} mt-1 w-full`} name="next_billing_on" type="date" /></label></div>
          <input className={inputClass} name="discount" type="number" min="0" step="0.01" placeholder="Desconto em R$" />
          <button className={buttonClass}>Ativar e gerar cobrança</button>
        </ActionForm>
      </section>
      <section className="dashboard-panel p-5">
        <h2 className="flex gap-2 font-semibold"><FileSignature size={16} className="text-emerald-300" />Novo contrato</h2>
        <ActionForm action={createContractAction} className="mt-4 grid gap-3">
          <select className={inputClass} name="member_id" required><option value="">Aluno</option>{members?.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select>
          <select className={inputClass} name="subscription_id"><option value="">Sem matrícula vinculada</option>{subscriptions?.map((subscription) => { const member = subscription.member as unknown as { full_name?: string }; const plan = subscription.plan as unknown as { name?: string }; return <option key={subscription.id} value={subscription.id}>{member?.full_name} · {plan?.name}</option>; })}</select>
          <input className={inputClass} name="title" placeholder="Título do contrato" />
          <input className={inputClass} name="terms_version" defaultValue="1.0" placeholder="Versão do termo" />
          <button className={buttonClass}>Gerar pendência de aceite</button>
        </ActionForm>
      </section>
    </div>

    <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {plans?.map((plan) => <article className="dashboard-panel p-5" key={plan.id}>
        <div className="flex items-center justify-between"><Layers3 className={plan.active ? "text-emerald-300" : "text-emerald-50/25"} size={18} /><span className="text-[9px] font-bold text-emerald-50/35">{plan.active ? "ATIVO" : "ARQUIVADO"}</span></div>
        <h2 className="mt-4 font-semibold">{plan.name}</h2><strong className="mt-2 block text-2xl">{money(plan.price_cents)}</strong>
        <p className="mt-2 text-xs text-emerald-50/35">{plan.description || "Plano sem descrição"} · {cycle[plan.billing_cycle] || plan.billing_cycle}</p>
        <ActionForm action={updatePlanStatusAction} className="mt-4"><input type="hidden" name="plan_id" value={plan.id} /><input type="hidden" name="active" value={String(!plan.active)} /><button className="text-[10px] font-bold text-cyan-200">{plan.active ? "Arquivar para novas vendas" : "Reativar plano"}</button></ActionForm>
      </article>)}
    </section>

    <section className="dashboard-panel mt-6 overflow-hidden">
      <header className="border-b border-emerald-100/10 p-5"><h2 className="font-semibold">Matrículas e recorrências</h2><p className="mt-1 text-xs text-emerald-50/35">Pause, reative ou encerre vínculos sem perder o histórico.</p></header>
      {subscriptions?.length ? subscriptions.map((subscription) => {
        const member = subscription.member as unknown as { full_name?: string }; const plan = subscription.plan as unknown as { name?: string };
        const bindings = providerSubscriptions?.filter((item) => item.subscription_id === subscription.id) || [];
        return <article className="grid gap-3 border-b border-emerald-100/[.06] p-4 last:border-0 lg:grid-cols-[1.1fr_.8fr_.7fr_1.1fr_auto] lg:items-center" key={subscription.id}>
          <div><strong className="text-sm">{member?.full_name}</strong><span className="block text-[10px] text-emerald-50/35">{plan?.name} · desde {shortDate(subscription.starts_on)}</span></div>
          <div><strong className="text-sm">{money(subscription.amount_cents - subscription.discount_cents)}</strong><span className="block text-[10px] text-emerald-50/35">Próxima: {shortDate(subscription.next_billing_on)}</span></div>
          <span className="w-fit rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-bold text-emerald-300">{subscription.status.toUpperCase()}</span>
          <div className="flex flex-wrap gap-1">{gateways?.map((gateway) => { const binding = bindings.find((item) => item.connection_id === gateway.id); const configured = binding && ["pending", "active"].includes(binding.status); return <div key={gateway.id}>{configured ? <span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-[9px] font-bold text-cyan-200">{gateway.provider === "asaas" ? (binding.status === "pending" ? "ASAAS AGUARDANDO" : "ASAAS AUTOMÁTICO") : "INFINITEPAY VINCULADO"}</span> : <ActionForm action={createPaymentCheckoutAction}><input type="hidden" name="provider" value={gateway.provider} /><input type="hidden" name="target_type" value="subscription" /><input type="hidden" name="target_id" value={subscription.id} /><button className="flex items-center gap-1 rounded-lg border border-cyan-300/20 px-2 py-2 text-[9px] font-bold text-cyan-200"><CreditCard size={11} />{gateway.provider === "asaas" ? "Ativar automático" : "Gerar mensalidade"}</button></ActionForm>}</div>; })}{!gateways?.length && <span className="text-[9px] text-amber-200/65">Configure um gateway no Financeiro</span>}</div>
          <ActionForm action={updateSubscriptionStatusAction} className="flex gap-2"><input type="hidden" name="subscription_id" value={subscription.id} /><select className={`${inputClass} py-2 text-[10px]`} name="status" defaultValue={subscription.status}><option value="active">Ativa</option><option value="paused">Pausada</option><option value="overdue">Inadimplente</option><option value="ended">Encerrada</option><option value="cancelled">Cancelada</option></select><button className="rounded-lg border border-emerald-300/20 px-3 text-[10px] font-bold text-emerald-300">Salvar</button></ActionForm>
        </article>;
      }) : <p className="p-8 text-center text-xs text-emerald-50/30">Nenhuma matrícula cadastrada.</p>}
    </section>

    <section className="dashboard-panel mt-6 overflow-hidden">
      <header className="border-b border-emerald-100/10 p-5"><h2 className="font-semibold">Contratos</h2></header>
      {contracts?.length ? contracts.map((contract) => { const member = contract.member as unknown as { full_name?: string }; return <article className="grid gap-3 border-b border-emerald-100/[.06] p-4 last:border-0 md:grid-cols-[1fr_.7fr_auto] md:items-center" key={contract.id}><div><strong className="text-sm">{member?.full_name}</strong><span className="block text-[10px] text-emerald-50/35">{contract.title} · versão {contract.terms_version}</span></div><span className="text-[9px] font-bold text-emerald-300">{contract.status.toUpperCase()}</span><ActionForm action={updateContractStatusAction} className="flex gap-2"><input type="hidden" name="contract_id" value={contract.id} /><select className={`${inputClass} py-2 text-[10px]`} name="status" defaultValue={contract.status}><option value="pending">Pendente</option><option value="accepted">Aceito</option><option value="expired">Expirado</option><option value="cancelled">Cancelado</option></select><button className="rounded-lg border border-cyan-300/20 px-3 text-cyan-200"><PauseCircle size={14} /></button></ActionForm></article>; }) : <p className="p-8 text-center text-xs text-emerald-50/30">Nenhum contrato gerado.</p>}
    </section>
  </>;
}
