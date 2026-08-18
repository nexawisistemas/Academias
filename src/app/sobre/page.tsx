import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, Layers3, ShieldCheck, Target } from "lucide-react";
import Link from "next/link";
import { PublicShell, SectionHeading } from "@/components/marketing/public-shell";

export const metadata: Metadata = { title: "Sobre a NexaWi" };

export default function AboutPage() {
  const values = [
    { icon: Target, title: "Clareza operacional", copy: "Dados úteis para decidir, não painéis cheios de ruído." },
    { icon: Layers3, title: "Base modular", copy: "Cada módulo cresce sobre uma fundação de identidade, permissões e unidades." },
    { icon: ShieldCheck, title: "Confiança por padrão", copy: "Isolamento multiempresa, auditoria e segurança fazem parte do desenho." },
  ];

  return <PublicShell><main className="public-page"><section className="page-hero"><span className="eyebrow">NEXAWI SISTEMAS</span><h1>Gestão que respeita a realidade de quem está em movimento.</h1><p>Não estamos construindo mais um cadastro de alunos. Estamos estruturando o sistema operacional que conecta aquisição, operação e experiência fitness.</p></section><section className="values-grid">{values.map(({ icon: Icon, title, copy }) => <article key={title}><Icon size={24} /><h2>{title}</h2><p>{copy}</p></article>)}</section><section className="about-statement"><span>VISÃO NEXAWI</span><h2>Uma academia pequena merece estrutura. Uma rede grande não pode ser limitada por ela.</h2><div><p>O produto foi pensado para acompanhar a jornada completa: visitante, lead, experimental, matrícula, pagamento, treino, frequência e renovação.</p><Link className="outline-action" href="/cadastro">Falar sobre a minha operação <ArrowUpRight size={16} /></Link></div></section><section className="public-section"><SectionHeading eyebrow="COMPROMISSOS DE PRODUTO" title="Tecnologia a serviço da operação." copy="Uma construção incremental: o que entra em produção precisa ser seguro, mensurável e útil desde o primeiro dia." /><div className="commitment-list">{["Sem dados misturados entre academias", "Sem módulos fictícios em produção", "Sem dependência de uma única unidade", "Sem vendor lock-in onde uma abstração fizer sentido"].map((item) => <span key={item}><CheckCircle2 size={18} />{item}</span>)}</div></section></main></PublicShell>;
}
