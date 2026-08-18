import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { PublicShell } from "@/components/marketing/public-shell";

export const metadata: Metadata = { title: "Perguntas frequentes" };

const questions = [
  ["O NexaWi Academias é só um sistema de gestão?", "Não. Ele conecta gestão, comercial e experiência do aluno: do site e do primeiro lead ao plano, cobrança, treino e retenção."],
  ["O site da minha academia já vem incluído?", "Os planos incluem uma presença digital alinhada ao funil comercial. O nível de personalização, páginas e integrações acompanha o plano escolhido."],
  ["Posso administrar mais de uma unidade?", "Sim. A plataforma nasce preparada para operações multiunidade, com leitura consolidada e permissões que respeitam o contexto de cada unidade."],
  ["Consigo acompanhar leads e aulas experimentais?", "Sim. O CRM organiza origem, responsável, etapa, contato e próxima ação para que a recepção não perca oportunidades."],
  ["Posso começar menor e evoluir depois?", "Sim. A contratação é modular. Você começa com a estrutura que precisa hoje e expande recursos quando a operação pedir."],
  ["Como funciona a implantação?", "Mapeamos a operação, configuramos a organização e a unidade inicial, estruturamos o site e ativamos os módulos contratados em etapas."],
  ["Meus dados ficam separados dos dados de outras academias?", "Sim. A arquitetura usa isolamento por organização, permissões por função e trilha de auditoria para atividades relevantes."],
  ["Há integração com catraca, pagamentos ou WhatsApp?", "A arquitetura foi preparada para integrações. A disponibilidade e a prioridade são definidas conforme o plano e o cenário técnico da academia."],
];

export default function FaqPage() {
  return <PublicShell><main className="public-page"><section className="page-hero centered"><span className="eyebrow">TUDO ÀS CLARAS</span><h1>Perguntas antes<br /><span>da sua evolução.</span></h1><p>O essencial para entender o que a NexaWi Academias entrega e como a plataforma acompanha sua operação.</p></section><section className="faq-layout"><div className="faq-intro"><span className="section-kicker">DECISÃO COM CONTEXTO</span><h2>Você não está comprando só telas.</h2><p>Está construindo uma operação mais organizada, comercial e preparada para crescer.</p><ul><li><Check size={16} />Módulos conectados</li><li><Check size={16} />Implantação por etapas</li><li><Check size={16} />Plano adequado ao porte</li></ul><Link className="primary-action" href="/cadastro">Falar sobre minha academia <ArrowUpRight size={18} /></Link></div><div className="faq-list">{questions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}</summary><p>{answer}</p></details>)}</div></section></main></PublicShell>;
}
