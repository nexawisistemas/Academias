import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, CreditCard, KeyRound, Link2, ShieldCheck, Webhook } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { gatewayCapabilities, type PaymentProvider } from "@/lib/payments/types";
import { paymentEncryptionReady } from "@/lib/payments/crypto";
import { createOperationalClient, shortDate } from "@/lib/supabase/operational";
import { ActionForm } from "../../action-form";
import { buttonClass, inputClass, PageTitle } from "../../ui";
import { provisionAsaasWebhookAction, savePaymentProviderConnectionAction, testPaymentProviderConnectionAction, updatePaymentProviderStatusAction } from "../payment-actions";

type Connection = {
  id: string; provider: PaymentProvider; environment: string; status: string; credentials_hint: string | null;
  last_tested_at: string | null; last_error: string | null; config: Record<string, unknown>;
};

const statusLabel: Record<string, string> = { draft: "AGUARDANDO TESTE", testing: "TESTANDO", active: "ATIVO", error: "COM ERRO", disabled: "DESATIVADO" };

function ProviderStatus({ connection }: { connection?: Connection }) {
  if (!connection) return <span className="rounded-full bg-amber-300/10 px-3 py-1 text-[9px] font-bold text-amber-200">NÃO CONFIGURADO</span>;
  const active = connection.status === "active";
  return <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${active ? "bg-emerald-300/10 text-emerald-300" : connection.status === "error" ? "bg-rose-300/10 text-rose-200" : "bg-amber-300/10 text-amber-200"}`}>{statusLabel[connection.status] || connection.status.toUpperCase()}</span>;
}

export default async function PaymentIntegrationsPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  const { data } = await db.from("payment_provider_connections").select("id,provider,environment,status,credentials_hint,last_tested_at,last_error,config").eq("organization_id", organization.id);
  const connections = (data || []) as Connection[];
  const asaas = connections.find((item) => item.provider === "asaas");
  const infinitepay = connections.find((item) => item.provider === "infinitepay");
  const encryptionReady = paymentEncryptionReady();

  return <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <PageTitle eyebrow="COBRANÇA SEGURA" title="Gateways de pagamento" description="Ative pagamentos online sem expor credenciais para o navegador ou para os usuários da equipe." />
      <Link href="/dashboard/financeiro" className="flex items-center gap-2 text-xs font-bold text-emerald-200"><ArrowLeft size={14} />Voltar ao financeiro</Link>
    </div>

    <div className={`mt-7 flex gap-3 rounded-2xl border p-4 ${encryptionReady ? "border-emerald-300/15 bg-emerald-300/[.04]" : "border-rose-300/25 bg-rose-300/[.06]"}`}>
      {encryptionReady ? <ShieldCheck className="shrink-0 text-emerald-300" size={20} /> : <CircleAlert className="shrink-0 text-rose-300" size={20} />}
      <div><strong className="text-sm">{encryptionReady ? "Cofre de credenciais disponível" : "Chave interna de criptografia pendente"}</strong><p className="mt-1 text-xs text-emerald-50/45">{encryptionReady ? "As chaves são protegidas com AES-256-GCM antes de serem persistidas." : "Configure PAYMENT_CREDENTIALS_ENCRYPTION_KEY no ambiente antes de salvar qualquer gateway."}</p></div>
    </div>

    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <section className="dashboard-panel p-6">
        <header className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><CreditCard size={20} /></span><div><h2 className="font-semibold">Asaas</h2><p className="mt-1 text-xs text-emerald-50/40">Cartão recorrente nativo, Pix e cobrança avulsa.</p></div></div><ProviderStatus connection={asaas} /></header>
        <div className="mt-5 grid grid-cols-2 gap-3 text-[10px]"><span className="rounded-xl border border-emerald-100/10 p-3"><strong className="block text-emerald-200">RECORRÊNCIA</strong>Nativa no gateway</span><span className="rounded-xl border border-emerald-100/10 p-3"><strong className="block text-emerald-200">CHECKOUT</strong>Hospedado e seguro</span></div>
        <ActionForm action={savePaymentProviderConnectionAction} className="mt-5 grid gap-3">
          <input type="hidden" name="provider" value="asaas" />
          <select className={inputClass} name="environment" defaultValue={asaas?.environment || "sandbox"}><option value="sandbox">Sandbox · testes</option><option value="production">Produção · cobranças reais</option></select>
          <label className="text-[10px] font-bold text-emerald-50/45">API KEY {asaas?.credentials_hint && <span className="font-normal">· atual {asaas.credentials_hint}</span>}<input className={`${inputClass} mt-1 w-full`} name="api_key" type="password" autoComplete="new-password" placeholder={asaas ? "Deixe vazio para manter a atual" : "$aact_..."} /></label>
          <label className="text-[10px] font-bold text-emerald-50/45">TOKEN DO WEBHOOK<input className={`${inputClass} mt-1 w-full`} name="webhook_token" type="password" autoComplete="new-password" placeholder="Opcional · geramos um segredo forte" /></label>
          <button disabled={!encryptionReady} className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-35`}><KeyRound size={15} />Salvar credenciais protegidas</button>
        </ActionForm>
        {asaas && <div className="mt-4 grid gap-3 border-t border-emerald-100/10 pt-4">
          <div className="flex flex-wrap gap-2"><ActionForm action={testPaymentProviderConnectionAction}><input type="hidden" name="provider" value="asaas" /><button className="rounded-full border border-cyan-300/20 px-4 py-2 text-[10px] font-bold text-cyan-200">Testar e ativar</button></ActionForm>{asaas.status === "active" && !asaas.config.webhook_id && <ActionForm action={provisionAsaasWebhookAction}><button className="flex items-center gap-2 rounded-full border border-emerald-300/20 px-4 py-2 text-[10px] font-bold text-emerald-200"><Webhook size={13} />Criar webhook</button></ActionForm>}<ActionForm action={updatePaymentProviderStatusAction}><input type="hidden" name="provider" value="asaas" /><input type="hidden" name="status" value={asaas.status === "disabled" ? "active" : "disabled"} /><button className="px-3 py-2 text-[10px] font-bold text-emerald-50/45">{asaas.status === "disabled" ? "Reativar" : "Desativar"}</button></ActionForm></div>
          {!!asaas.config.webhook_url && <p className="flex items-center gap-2 break-all text-[10px] text-emerald-50/35"><Link2 size={12} />{String(asaas.config.webhook_url)}</p>}
          {asaas.last_tested_at && <p className="text-[10px] text-emerald-50/35">Último teste: {shortDate(asaas.last_tested_at)}</p>}{asaas.last_error && <p className="text-xs text-rose-200">{asaas.last_error}</p>}
        </div>}
      </section>

      <section className="dashboard-panel p-6">
        <header className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><CheckCircle2 size={20} /></span><div><h2 className="font-semibold">InfinitePay</h2><p className="mt-1 text-xs text-emerald-50/40">Pix e cartão por link integrado à mensalidade.</p></div></div><ProviderStatus connection={infinitepay} /></header>
        <div className="mt-5 grid grid-cols-2 gap-3 text-[10px]"><span className="rounded-xl border border-emerald-100/10 p-3"><strong className="block text-emerald-200">RECORRÊNCIA</strong>Um link por competência</span><span className="rounded-xl border border-emerald-100/10 p-3"><strong className="block text-emerald-200">CONCILIAÇÃO</strong>Webhook automático</span></div>
        <ActionForm action={savePaymentProviderConnectionAction} className="mt-5 grid gap-3">
          <input type="hidden" name="provider" value="infinitepay" /><input type="hidden" name="environment" value="production" />
          <label className="text-[10px] font-bold text-emerald-50/45">INFINITETAG<input className={`${inputClass} mt-1 w-full`} required={!infinitepay} name="handle" defaultValue={String(infinitepay?.config.handle || "")} placeholder="sua-infinite-tag" /></label>
          <p className="text-[10px] leading-5 text-emerald-50/35">A API pública gera links de pagamento. A NexaWi cria uma nova cobrança automaticamente em cada vencimento e confirma o recebimento pelo webhook.</p>
          <button disabled={!encryptionReady} className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-35`}><KeyRound size={15} />Salvar e ativar InfinitePay</button>
        </ActionForm>
        {infinitepay && <div className="mt-4 flex gap-2 border-t border-emerald-100/10 pt-4"><ActionForm action={testPaymentProviderConnectionAction}><input type="hidden" name="provider" value="infinitepay" /><button className="rounded-full border border-cyan-300/20 px-4 py-2 text-[10px] font-bold text-cyan-200">Validar configuração</button></ActionForm><ActionForm action={updatePaymentProviderStatusAction}><input type="hidden" name="provider" value="infinitepay" /><input type="hidden" name="status" value={infinitepay.status === "disabled" ? "active" : "disabled"} /><button className="px-3 py-2 text-[10px] font-bold text-emerald-50/45">{infinitepay.status === "disabled" ? "Reativar" : "Desativar"}</button></ActionForm></div>}
      </section>
    </div>

    <section className="dashboard-panel mt-6 p-5"><h2 className="font-semibold">Como a operação fica</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><p className="rounded-xl border border-emerald-100/10 p-4 text-xs text-emerald-50/45"><strong className="mb-2 block text-emerald-100">1. Matrícula</strong>O responsável escolhe o gateway e envia o aluno ao checkout.</p><p className="rounded-xl border border-emerald-100/10 p-4 text-xs text-emerald-50/45"><strong className="mb-2 block text-emerald-100">2. Confirmação</strong>O webhook registra pagamento uma única vez e baixa a mensalidade.</p><p className="rounded-xl border border-emerald-100/10 p-4 text-xs text-emerald-50/45"><strong className="mb-2 block text-emerald-100">3. Próximo ciclo</strong>{gatewayCapabilities.asaas.nativeRecurring ? "Asaas renova no cartão; " : ""}InfinitePay recebe um novo link por competência.</p></div></section>
  </>;
}
