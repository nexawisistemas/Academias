import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  Dumbbell,
  Radio,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

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
    <main className="landing-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="perspective-grid" />

      <nav className="site-nav" aria-label="Navegação principal">
        <a className="brand" href="#inicio" aria-label="NexaWi Academias — início">
          <span className="brand-mark"><Dumbbell size={20} strokeWidth={2.4} /></span>
          <span>NEXAWI <strong>ACADEMIAS</strong></span>
        </a>
        <div className="nav-links">
          <a href="#plataforma">Plataforma</a>
          <a href="#ecossistema">Ecossistema</a>
          <a href="/login">Entrar</a>
        </div>
        <a className="nav-cta" href="/cadastro">Entrar na nova era <ArrowUpRight size={16} /></a>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> O sistema operacional da sua academia</div>
          <h1>Sua academia em<span> outro nível.</span></h1>
          <p>
            Gestão, vendas, financeiro, treinos e experiência do aluno conectados
            em um ecossistema desenhado para crescer com você.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="/cadastro">Quero evoluir minha academia <ArrowUpRight size={18} /></a>
            <a className="secondary-action" href="#plataforma"><span className="pulse-dot" /> Explorar plataforma</a>
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

      <footer id="contato">
        <div><strong>NexaWi Academias</strong><span>academias.nexawi.com.br</span></div>
        <p>Construindo o futuro da gestão fitness.</p>
      </footer>
    </main>
  );
}
