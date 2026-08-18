import type { Metadata } from "next";
import { ArrowUpRight, Check, Minus, Sparkles } from "lucide-react";
import Link from "next/link";
import { PublicShell, SectionHeading } from "@/components/marketing/public-shell";

export const metadata: Metadata = { title: "Planos" };

const plans = [
  { name: "Essencial", audience: "Estruture a operação", hint: "Para uma academia que precisa substituir planilhas por uma base organizada.", features: ["1 unidade", "Site institucional", "Alunos e planos", "Equipe e permissões", "Visão operacional"] },
  { name: "Crescimento", audience: "Transforme interesse em matrícula", hint: "Para academia que quer vender com processo e acompanhar cada oportunidade.", features: ["Tudo do Essencial", "Site com captação", "CRM e experimental", "Matrículas e contratos", "Financeiro e cobranças", "Campanhas de relacionamento"], featured: true },
  { name: "Rede", audience: "Escale com controle", hint: "Para grupos que precisam de leitura consolidada sem perder a autonomia local.", features: ["Tudo do Crescimento", "Múltiplas unidades", "Papéis por unidade", "Visão consolidada", "Prioridade em integrações", "Suporte de implantação ampliado"] },
];

const comparison = [
  ["Site institucional", true, true, true],
  ["Captação e CRM", false, true, true],
  ["Alunos, planos e matrículas", true, true, true],
  ["Financeiro e cobranças", false, true, true],
  ["Aulas, treinos e avaliações", false, true, true],
  ["Multiunidade", false, false, true],
  ["Permissões por unidade", false, false, true],
  ["Prioridade em integrações", false, false, true],
];

export default function PlansPage() {
  return <PublicShell><main className="public-page"><section className="page-hero centered"><span className="eyebrow">PLANOS QUE ACOMPANHAM A OPERAÇÃO</span><h1>Você cresce.<br /><span>A plataforma acompanha.</span></h1><p>Planos diferentes para estágios diferentes: organizar a base, acelerar vendas ou coordenar uma rede inteira.</p></section><section className="plan-grid">{plans.map((plan) => <article className={plan.featured ? "plan-card featured" : "plan-card"} key={plan.name}>{plan.featured && <span className="plan-label"><Sparkles size={13} /> MAIS PROCURADO</span>}<span className="plan-index">NEXAWI / {plan.name.toUpperCase()}</span><h2>{plan.name}</h2><strong className="plan-audience">{plan.audience}</strong><p>{plan.hint}</p><ul>{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><Link href="/cadastro">Escolher este plano <ArrowUpRight size={16} /></Link></article>)}</section><section className="comparison-section"><SectionHeading eyebrow="COMPARE O QUE MUDA" title="O plano mais completo faz sentido quando a operação pede escala." copy="A diferença não é só quantidade de telas: é o nível de controle, conversão e coordenação que a academia precisa." /><div className="comparison-table" role="table" aria-label="Comparativo de recursos por plano"><div className="comparison-row comparison-head" role="row"><span>Recursos</span>{plans.map((plan) => <strong key={plan.name}>{plan.name}</strong>)}</div>{comparison.map(([feature, ...availability]) => <div className="comparison-row" role="row" key={feature as string}><span>{feature}</span>{availability.map((included, index) => <i key={plans[index].name} aria-label={included ? "Incluído" : "Não incluído"}>{included ? <Check size={16} /> : <Minus size={16} />}</i>)}</div>)}</div></section><section className="public-section centered"><SectionHeading eyebrow="INVESTIMENTO CLARO" title="Definimos o valor com base no cenário real." copy="O investimento considera unidades, módulos, implantação e integrações. Assim, você contrata uma estrutura coerente com a sua operação — sem pagar por uma rede que ainda não existe." /><Link className="outline-action" href="/cadastro">Montar meu cenário <ArrowUpRight size={16} /></Link></section></main></PublicShell>;
}
