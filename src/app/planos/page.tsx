import type { Metadata } from "next";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { PublicShell, SectionHeading } from "@/components/marketing/public-shell";

export const metadata: Metadata = { title: "Planos" };

const plans = [
  { name: "Essencial", hint: "Para uma operação que quer sair das planilhas.", features: ["Base multiempresa", "Unidade principal", "Equipe e permissões", "Site institucional"] },
  { name: "Crescimento", hint: "Para academia que transforma interesse em processo.", features: ["Tudo do Essencial", "CRM e aula experimental", "Planos e matrículas", "Site conectado ao funil"], featured: true },
  { name: "Rede", hint: "Para grupos que precisam enxergar a operação inteira.", features: ["Tudo do Crescimento", "Múltiplas unidades", "Papéis por escopo", "Arquitetura para integrações"] },
];

export default function PlansPage() {
  return <PublicShell><main className="public-page"><section className="page-hero centered"><span className="eyebrow">PLANOS QUE ACOMPANHAM A OPERAÇÃO</span><h1>Você cresce.<br /><span>A plataforma acompanha.</span></h1><p>Os valores e condições comerciais são definidos conforme o porte, unidades e módulos que a academia precisa ativar.</p></section><section className="plan-grid">{plans.map((plan) => <article className={plan.featured ? "plan-card featured" : "plan-card"} key={plan.name}>{plan.featured && <span className="plan-label"><Sparkles size={13} /> MAIS PROCURADO</span>}<span className="plan-index">NEXAWI / {plan.name.toUpperCase()}</span><h2>{plan.name}</h2><p>{plan.hint}</p><ul>{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><Link href="/cadastro">Conversar sobre este plano <ArrowUpRight size={16} /></Link></article>)}</section><section className="public-section centered"><SectionHeading eyebrow="SEM PEGADINHAS" title="A escolha acontece com contexto." copy="Antes de contratar, entendemos sua estrutura, unidades e o que precisa entrar em operação primeiro. Sem forçar módulo antes da hora." /></section></main></PublicShell>;
}
