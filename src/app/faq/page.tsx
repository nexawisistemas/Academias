import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { PublicShell } from "@/components/marketing/public-shell";
import { institutionalFaq } from "@/lib/marketing-config";
export const metadata: Metadata = { title: "Perguntas frequentes" };
const productFaq = [
  ["O NexaWi Academias é só um sistema de gestão?","Não. A plataforma conecta site, CRM, alunos, matrículas, financeiro, agenda, treinos, avaliações, acesso, relacionamento e relatórios."],
  ["O site da minha academia está incluído?","Sim. Todos os planos incluem site público e captação. A personalização e os recursos avançados aumentam conforme o plano."],
  ["Posso administrar várias unidades?","O Plano Extensão atende até 5 unidades e o Plano Rede até 50, com limite de alunos e recursos de governança próprios."],
  ["O sistema já cobra meus alunos automaticamente?","O controle financeiro e de inadimplência está disponível. Processamento automático depende da integração com o meio de pagamento definida na implantação."],
  ["Posso usar catraca e WhatsApp?","A arquitetura aceita integrações, mas modelo do equipamento, fornecedor, API, custo de terceiros e disponibilidade precisam ser validados na proposta."],
  ["Meus dados ficam separados?","Sim. A base usa isolamento por organização, papéis, permissões e auditoria. Cada cliente também precisa administrar corretamente os acessos da própria equipe."],
] as const;
const questions=[...productFaq,...institutionalFaq];
export default function FaqPage(){return <PublicShell><main className="public-page"><section className="page-hero centered"><span className="eyebrow">TUDO ÀS CLARAS</span><h1>Entenda antes<br/><span>de contratar.</span></h1><p>Escopo, limites, teste, implantação e integrações explicados sem letras miúdas.</p></section><section className="faq-layout"><div className="faq-intro"><span className="section-kicker">DECISÃO COM CONTEXTO</span><h2>Você está comprando uma operação conectada.</h2><p>Veja o que já faz parte da plataforma e o que depende de validação técnica.</p><ul><li><Check size={16}/>Planos com preços e limites</li><li><Check size={16}/>7 dias de teste</li><li><Check size={16}/>Implantação acompanhada</li></ul><Link className="primary-action" href="/demonstracao">Agendar demonstração <ArrowUpRight size={18}/></Link></div><div className="faq-list">{questions.map(([q,a],index)=><details key={q} open={index===0}><summary><span>{String(index+1).padStart(2,"0")}</span>{q}</summary><p>{a}</p></details>)}</div></section></main></PublicShell>}
