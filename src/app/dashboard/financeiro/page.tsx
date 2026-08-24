import { AlertTriangle, ArrowDownCircle, CheckCircle2, CircleDollarSign, Plus, RefreshCw } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, money, shortDate } from "@/lib/supabase/operational";
import { createExpenseAction, generateInvoicesAction, registerPaymentAction, updateExpenseStatusAction, updateInvoiceStatusAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";

export default async function FinancePage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);
  const [{ data: invoices }, { data: payments }, { data: expenses }, { data: branches }] = await Promise.all([
    db.from("invoices").select("id,description,amount_cents,due_date,status,paid_at,member:members(full_name)").eq("organization_id", organization.id).order("due_date", { ascending: false }).limit(200),
    db.from("payments").select("amount_cents,paid_at").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", monthStart.toISOString()).lt("paid_at", monthEnd.toISOString()),
    db.from("expenses").select("id,description,supplier,category,amount_cents,due_date,status,payment_method,branch:branches(name)").eq("organization_id", organization.id).order("due_date", { ascending: false }).limit(200),
    db.from("branches").select("id,name").eq("organization_id", organization.id).eq("status", "active").order("name"),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const received = payments?.reduce((sum, item) => sum + item.amount_cents, 0) ?? 0;
  const open = invoices?.filter((item) => item.status === "open" && item.due_date >= today).reduce((sum, item) => sum + item.amount_cents, 0) ?? 0;
  const overdue = invoices?.filter((item) => item.status === "overdue" || (item.status === "open" && item.due_date < today)).reduce((sum, item) => sum + item.amount_cents, 0) ?? 0;
  const paidExpenses = expenses?.filter((item) => item.status === "paid" && item.due_date >= monthStart.toISOString().slice(0, 10) && item.due_date < monthEnd.toISOString().slice(0, 10)).reduce((sum, item) => sum + item.amount_cents, 0) ?? 0;

  return <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <PageTitle eyebrow="CONTROLE FINANCEIRO" title="Financeiro" description="Receitas, cobranças, despesas e inadimplência com histórico auditável." />
      <ActionForm action={generateInvoicesAction}><button className="flex items-center gap-2 rounded-full border border-emerald-300/20 px-4 py-3 text-xs font-bold text-emerald-300"><RefreshCw size={14} />Gerar recorrências</button></ActionForm>
    </div>
    <section className="metric-dashboard-grid mt-8">
      <article className="dashboard-metric"><header>Recebido no mês<span><CheckCircle2 size={16} /></span></header><strong>{money(received)}</strong><small>pagamentos confirmados</small></article>
      <article className="dashboard-metric"><header>Em aberto<span><CircleDollarSign size={16} /></span></header><strong>{money(open)}</strong><small>a vencer</small></article>
      <article className="dashboard-metric"><header>Vencido<span><AlertTriangle size={16} /></span></header><strong>{money(overdue)}</strong><small>exige ação</small></article>
      <article className="dashboard-metric"><header>Resultado do mês<span><ArrowDownCircle size={16} /></span></header><strong>{money(received - paidExpenses)}</strong><small>{money(paidExpenses)} em despesas</small></article>
    </section>

    <section className="dashboard-panel mt-6 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Plus size={16} className="text-cyan-300" />Registrar despesa</h2>
      <ActionForm action={createExpenseAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input className={inputClass} required name="description" placeholder="Descrição" />
        <input className={inputClass} name="supplier" placeholder="Fornecedor" />
        <input className={inputClass} required name="amount" type="number" min="0.01" step="0.01" placeholder="Valor" />
        <input className={inputClass} required name="due_date" type="date" aria-label="Vencimento" />
        <select className={inputClass} name="category"><option value="operational">Operacional</option><option value="payroll">Folha/equipe</option><option value="rent">Aluguel</option><option value="utilities">Água, energia e internet</option><option value="marketing">Marketing</option><option value="maintenance">Manutenção</option><option value="tax">Impostos</option><option value="other">Outros</option></select>
        <select className={inputClass} name="branch_id"><option value="">Toda a organização</option>{branches?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
        <select className={inputClass} name="status"><option value="planned">A pagar</option><option value="paid">Já paga</option></select>
        <select className={inputClass} name="payment_method"><option value="">Forma de pagamento</option><option value="pix">Pix</option><option value="credit_card">Cartão de crédito</option><option value="debit_card">Cartão de débito</option><option value="cash">Dinheiro</option><option value="bank_slip">Boleto</option><option value="transfer">Transferência</option><option value="other">Outro</option></select>
        <button className={buttonClass}>Registrar despesa</button>
      </ActionForm>
    </section>

    <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="dashboard-panel overflow-hidden">
        <header className="border-b border-emerald-100/10 p-5"><h2 className="font-semibold">Cobranças dos alunos</h2></header>
        {invoices?.length ? invoices.map((invoice) => {
          const member = invoice.member as unknown as { full_name?: string }; const isOverdue = invoice.status === "overdue" || (invoice.status === "open" && invoice.due_date < today);
          return <article className="grid gap-3 border-b border-emerald-100/[.06] p-5 last:border-0 lg:grid-cols-[1.2fr_.7fr_auto] lg:items-center" key={invoice.id}>
            <div><strong className="text-sm">{member?.full_name}</strong><span className="block text-[10px] text-emerald-50/35">{invoice.description} · vence {shortDate(invoice.due_date)}</span></div>
            <div><strong className="text-sm">{money(invoice.amount_cents)}</strong><span className={`block text-[9px] font-bold ${invoice.status === "paid" ? "text-emerald-300" : isOverdue ? "text-rose-300" : "text-amber-300"}`}>{invoice.status === "paid" ? "PAGO" : isOverdue ? "VENCIDO" : invoice.status.toUpperCase()}</span></div>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && <div className="grid gap-2">
              <ActionForm action={registerPaymentAction} className="flex gap-2"><input type="hidden" name="invoice_id" value={invoice.id} /><select className={`${inputClass} py-2 text-[10px]`} name="method"><option value="pix">Pix</option><option value="credit_card">Crédito</option><option value="debit_card">Débito</option><option value="cash">Dinheiro</option><option value="transfer">Transferência</option></select><button className={`${buttonClass} py-2`}>Receber</button></ActionForm>
              <ActionForm action={updateInvoiceStatusAction}><input type="hidden" name="invoice_id" value={invoice.id} /><input type="hidden" name="status" value="cancelled" /><button className="text-[9px] font-bold text-rose-200/70">Cancelar cobrança</button></ActionForm>
            </div>}
          </article>;
        }) : <div className="grid min-h-56 place-items-center text-sm text-emerald-50/30">As cobranças aparecerão aqui.</div>}
      </section>

      <section className="dashboard-panel overflow-hidden">
        <header className="border-b border-emerald-100/10 p-5"><h2 className="font-semibold">Despesas</h2></header>
        {expenses?.length ? expenses.map((expense) => { const branch = expense.branch as unknown as { name?: string }; return <article className="border-b border-emerald-100/[.06] p-4 last:border-0" key={expense.id}><div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{expense.description}</strong><span className="block text-[10px] text-emerald-50/35">{expense.supplier || expense.category} · {branch?.name || "Rede"} · {shortDate(expense.due_date)}</span></div><strong className="text-sm">{money(expense.amount_cents)}</strong></div><ActionForm action={updateExpenseStatusAction} className="mt-3 flex gap-2"><input type="hidden" name="expense_id" value={expense.id} /><select className={`${inputClass} py-2 text-[10px]`} name="status" defaultValue={expense.status}><option value="planned">A pagar</option><option value="paid">Paga</option><option value="cancelled">Cancelada</option></select><button className="rounded-lg border border-cyan-300/20 px-3 text-[10px] font-bold text-cyan-200">Salvar</button></ActionForm></article>; }) : <p className="p-8 text-center text-xs text-emerald-50/30">Nenhuma despesa registrada.</p>}
      </section>
    </div>
  </>;
}
