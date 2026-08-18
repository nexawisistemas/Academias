import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { PublicShell, SectionHeading } from "@/components/marketing/public-shell";

const modules = [
  { icon: UsersRound, label: "Alunos", value: "1.248", trend: "+12,4%" },
  { icon: BarChart3, label: "Receita", value: "R$ 184k", trend: "+18,7%" },
  { icon: Activity, label: "Check-ins", value: "436", trend: "hoje" },
];

const capabilities = [
  { icon: Building2, title: "Multiunidade", copy: "Veja toda a rede ou mergulhe em cada operação." },
  { icon: ShieldCheck, title: "Gestão segura", copy: "Tenancy, permissões e auditoria desde a fundação." },
  { icon: Radio, title: "Operação ao vivo", copy: "Vendas, frequência e financeiro em uma única leitura." },
];

export default function Home() {
  return (
    <PublicShell>
      <main className="landing-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="perspective-grid" />

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> O sistema operacional da sua academia</div>
          <h1>Sua academia em<span> outro nível.</span></h1>
          <p>
            Gestão, vendas, financeiro, treinos e experiência do aluno conectados
            em um ecossistema desenhado para crescer com você.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/cadastro">Quero evoluir minha academia <ArrowUpRight size={18} /></Link>
            <Link className="secondary-action" href="/plataforma"><span className="pulse-dot" /> Explorar plataforma</Link>
          </div>
          <div className="trust-line">
            <span>Multiempresa</span><i />
            <span>Multiunidade</span><i />
            <span>Dados em tempo real</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Prévia conceitual do dashboard NexaWi Academias">
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="dashboard-frame">
            <div className="dashboard-topbar">
              <div><span className="status-light" /> Visão geral <small>REDE NEXAWI</small></div>
              <span className="live-badge">● AO VIVO</span>
            </div>
            <div className="metric-grid">
              {modules.map(({ icon: Icon, label, value, trend }) => (
                <article className="metric-card" key={label}>
                  <div className="metric-icon"><Icon size={17} /></div>
                  <span>{label}</span><strong>{value}</strong><small>{trend}</small>
                </article>
              ))}
            </div>
            <div className="chart-card">
              <div className="chart-heading"><span>Performance da rede</span><strong>+24.8%</strong></div>
              <div className="chart-bars" aria-hidden="true">
                {[38, 52, 43, 69, 58, 82, 72, 94, 78, 100, 88, 116].map((height, index) => (
                  <i key={index} style={{ height }} />
                ))}
              </div>
            </div>
          </div>
          <div className="floating-chip chip-one"><span>IA</span> Insights prontos</div>
          <div className="floating-chip chip-two"><Activity size={15} /> Operação sincronizada</div>
        </div>
      </section>

      <section className="capability-strip" id="plataforma">
        {capabilities.map(({ icon: Icon, title, copy }) => (
          <article key={title}><Icon size={21} /><div><strong>{title}</strong><p>{copy}</p></div></article>
        ))}
      </section>

      <section className="ecosystem" id="ecossistema">
        <span className="section-kicker">UM ÚNICO ECOSSISTEMA</span>
        <h2>Do primeiro lead ao próximo treino.</h2>
        <p>A jornada inteira conectada, mensurável e pronta para escala.</p>
        <div className="journey-line">
          {["Visitante", "Lead", "Matrícula", "Acesso", "Treino", "Renovação"].map((item, index) => (
            <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>
          ))}
        </div>
      </section>
      <section className="home-modules">
        <SectionHeading eyebrow="ARQUITETURA PRONTA PARA CRESCER" title="Uma base. Todas as jornadas." copy="O que a academia enxerga no painel, o aluno encontra no celular e o visitante sente no site." />
        <div className="module-showcase">
          {[{ label: "Comercial", text: "Leads, experimental e matrículas sem planilhas paralelas.", icon: Target }, { label: "Operação", text: "Alunos, unidades, equipe e acesso em uma leitura.", icon: Activity }, { label: "Experiência", text: "Portal do aluno, treinos, aulas e comunicação conectados.", icon: Sparkles }].map(({ label, text, icon: Icon }, index) => <article className="module-showcase-card" key={label}><span>0{index + 1}</span><Icon size={21} /><h3>{label}</h3><p>{text}</p><Link href="/plataforma">Ver arquitetura <ArrowUpRight size={14} /></Link></article>)}
        </div>
      </section>
      <section className="full-stack">
        <SectionHeading eyebrow="O QUE SUA ACADEMIA RECEBE" title="Tudo para captar, operar e reter." copy="Uma visão clara do que entra na sua operação — sem depender de planilhas, ferramentas soltas ou promessas vagas." />
        <div className="full-stack-grid">
          {[
            ["01", "Captação e CRM", "Site, landing pages, leads, origem, experimental, follow-up e conversão."],
            ["02", "Alunos e matrículas", "Cadastro, contratos, planos, status, renovações, pausas e cancelamentos."],
            ["03", "Financeiro", "Mensalidades, cobranças, inadimplência, caixa e indicadores de receita."],
            ["04", "Aulas e treinos", "Grade, vagas, professores, presença, avaliações e evolução do aluno."],
            ["05", "Acesso e unidades", "Operação multiunidade preparada para catraca, QR Code e permissões por equipe."],
            ["06", "Relacionamento", "Comunicação, reativação, aniversários, alertas e campanhas com contexto."],
          ].map(([number, title, copy]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
        <div className="stack-actions"><Link className="outline-action" href="/plataforma">Ver todos os módulos <ArrowUpRight size={16} /></Link><Link className="text-action" href="/planos">Comparar planos e recursos <ArrowUpRight size={16} /></Link></div>
      </section>
      <section className="home-site-banner">
        <div><span className="section-kicker">SEU SITE TAMBÉM É OPERAÇÃO</span><h2>Uma vitrine que já nasce conectada ao CRM.</h2><p>Sites por academia, campanhas, formulários e aulas experimentais entram na mesma jornada comercial da operação.</p><Link className="outline-action" href="/site-da-academia">Conhecer a estrutura do site <ArrowUpRight size={16} /></Link></div>
        <div className="mini-site-preview" aria-label="Prévia de site de academia"><div className="mini-site-top"><i /> <span>MOVE STUDIO</span><b>Menu</b></div><div className="mini-site-hero"><small>MOVE COM INTENÇÃO</small><strong>O seu próximo nível começa aqui.</strong><em>Agendar aula experimental</em></div><div className="mini-site-cards"><span>Funcional</span><span>Yoga</span><span>Musculação</span></div></div>
      </section>
      </main>
    </PublicShell>
  );
}
