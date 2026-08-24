import Link from "next/link";
import { CheckCircle2, Clock3, CircleX } from "lucide-react";

type Props = { status: "return" | "cancelled" | "expired" };

const content = {
  return: { icon: CheckCircle2, eyebrow: "PAGAMENTO ENVIADO", title: "Estamos confirmando seu pagamento.", text: "A confirmação é automática e pode levar alguns instantes. Assim que o gateway notificar a NexaWi, a mensalidade será baixada no financeiro.", color: "text-emerald-300" },
  cancelled: { icon: CircleX, eyebrow: "PAGAMENTO INTERROMPIDO", title: "Nenhuma cobrança foi concluída.", text: "Você pode retornar ao financeiro e gerar um novo checkout quando quiser.", color: "text-rose-300" },
  expired: { icon: Clock3, eyebrow: "LINK EXPIRADO", title: "Este checkout não está mais disponível.", text: "Por segurança, gere um novo link de pagamento no financeiro da academia.", color: "text-amber-300" },
};

export function PaymentStatusPage({ status }: Props) {
  const item = content[status]; const Icon = item.icon;
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#00110b] px-5 text-emerald-50">
    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(83,255,170,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(83,255,170,.08)_1px,transparent_1px)] [background-size:48px_48px]" />
    <section className="relative w-full max-w-xl rounded-[2rem] border border-emerald-100/15 bg-[#031b12]/90 p-8 shadow-2xl shadow-emerald-950/50 sm:p-12">
      <Icon className={item.color} size={42} /><p className={`mt-8 text-[10px] font-black tracking-[.22em] ${item.color}`}>{item.eyebrow}</p><h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{item.title}</h1><p className="mt-5 text-sm leading-7 text-emerald-50/55">{item.text}</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard/financeiro" className="rounded-full bg-emerald-300 px-5 py-3 text-xs font-black text-emerald-950">Voltar ao financeiro</Link><Link href="/" className="rounded-full border border-emerald-100/15 px-5 py-3 text-xs font-bold text-emerald-100">Ir para o início</Link></div>
    </section>
  </main>;
}
