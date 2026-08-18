import type { Metadata } from "next";
import { Activity, ArrowUpRight, Building2, CircleDollarSign, ContactRound, Dumbbell, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { PublicShell, SectionHeading } from "@/components/marketing/public-shell";

export const metadata: Metadata = { title: "Plataforma" };

const modules = [
  { icon: ContactRound, title: "Comercial e CRM", copy: "Capte, distribua e acompanhe cada interesse até a matrícula." },
  { icon: UsersRound, title: "Alunos e planos", copy: "Uma visão completa de vínculo, plano, frequência e relacionamento." },
  { icon: CircleDollarSign, title: "Financeiro", copy: "Cobranças e recorrências com confirmação no servidor e rastreabilidade." },
  { icon: Dumbbell, title: "Treinos e aulas", copy: "Professores, biblioteca de exercícios, agenda e reservas em evolução modular." },
  { icon: Building2, title: "Multiunidade", copy: "Uma única operação para a rede inteira, sem perder o contexto de cada unidade." },
  { icon: ShieldCheck, title: "Segurança nativa", copy: "Isolamento de dados, permissões e auditoria desde o primeiro acesso." },
];

export default function PlatformPage() {
  return <PublicShell><main className="public-page"><section className="page-hero"><span className="eyebrow">PLATAFORMA NEXAWI</span><h1>Todo o movimento da academia.<br /><span>Uma única visão.</span></h1><p>Uma plataforma multiempresa construída para conectar o que hoje vive espalhado entre recepção, comercial, financeiro e professores.</p><Link className="primary-action" href="/cadastro">Começar a estruturar <ArrowUpRight size={18} /></Link></section><section className="platform-map"><div className="map-rail" aria-hidden="true" /><div className="map-core"><small>NEXAWI ACADEMIAS</small><strong>Centro da operação</strong><span>Dados confiáveis, decisões rápidas.</span></div><div className="map-items">{modules.map(({ icon: Icon, title, copy }, index) => <article key={title}><span>0{index + 1}</span><Icon size={20} /><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section><section className="public-section"><SectionHeading eyebrow="SEM PROMESSAS VAZIAS" title="Módulos que entram na hora certa." copy="A base de identidade, organização, unidades e permissões existe antes dos módulos operacionais. Assim, cada próxima entrega nasce no lugar certo." /><div className="release-roadmap">{[["Fundação","Identidade, RBAC e multiunidade"],["Comercial","Site, leads, CRM e experimental"],["Operação","Alunos, planos, treinos e acesso"],["Escala","Automação, integrações e IA"]].map(([label, copy], index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><h3>{label}</h3><p>{copy}</p></article>)}</div></section><section className="platform-cta"><Activity size={25} /><div><strong>Uma arquitetura feita para acompanhar seu ritmo.</strong><span>Comece pela estrutura. Cresça por módulos.</span></div><Link href="/cadastro">Criar minha operação <ArrowUpRight size={16} /></Link></section></main></PublicShell>;
}
