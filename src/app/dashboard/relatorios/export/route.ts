import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";

export const dynamic = "force-dynamic";

function validDate(value: string | null, fallback: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback; }
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export async function GET(request: Request) {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string; name: string };
  const url = new URL(request.url);
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const start = validDate(url.searchParams.get("start"), monthStart);
  const end = validDate(url.searchParams.get("end"), now.toISOString().slice(0, 10));
  const endExclusive = new Date(`${end}T00:00:00`); endExclusive.setDate(endExclusive.getDate() + 1);
  const db = await createOperationalClient();
  const [{ data: payments }, { data: expenses }] = await Promise.all([
    db.from("payments").select("amount_cents,method,paid_at,invoice:invoices(description,member:members(full_name))").eq("organization_id", organization.id).eq("status", "confirmed").gte("paid_at", `${start}T00:00:00`).lt("paid_at", endExclusive.toISOString()).order("paid_at"),
    db.from("expenses").select("description,supplier,category,amount_cents,due_date,status,payment_method").eq("organization_id", organization.id).gte("due_date", start).lte("due_date", end).order("due_date"),
  ]);
  const rows: unknown[][] = [["Tipo", "Data", "Pessoa/Fornecedor", "Descrição", "Categoria/Forma", "Status", "Valor (R$)"]];
  for (const payment of payments ?? []) {
    const invoice = payment.invoice as unknown as { description?: string; member?: { full_name?: string } | null } | null;
    rows.push(["Receita", payment.paid_at?.slice(0, 10), invoice?.member?.full_name, invoice?.description, payment.method, "confirmada", (payment.amount_cents / 100).toFixed(2).replace(".", ",")]);
  }
  for (const expense of expenses ?? []) rows.push(["Despesa", expense.due_date, expense.supplier, expense.description, `${expense.category}${expense.payment_method ? ` / ${expense.payment_method}` : ""}`, expense.status, (expense.amount_cents / 100).toFixed(2).replace(".", ",")]);
  const body = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
  const filename = `relatorio-${organization.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${start}-${end}.csv`;
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
