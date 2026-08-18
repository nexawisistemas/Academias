import Image from "next/image";
import type { Metadata } from "next";
import { cache } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  MapPin,
  Medal,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";
import { captureGymLeadAction } from "./actions";
import { createOperationalClient, money } from "@/lib/supabase/operational";
import styles from "./page.module.css";

type SiteData = {
  organization: { name: string; slug: string; phone?: string };
  branding: Record<string, unknown>;
  branches: Array<{
    id: string;
    name: string;
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    };
  }>;
  plans: Array<{
    id: string;
    name: string;
    description?: string;
    price_cents: number;
    billing_cycle: string;
    benefits?: string[];
  }>;
};

const modalityCards = [
  {
    index: "01",
    title: "Musculação inteligente",
    description: "Força, técnica e progressão com um treino que acompanha seu momento.",
    image: "/images/gym-site/strength-coaching.png",
    alt: "Aluno realizando agachamento orientado por um treinador",
    icon: Dumbbell,
  },
  {
    index: "02",
    title: "Treino funcional",
    description: "Aulas dinâmicas para ganhar condicionamento, mobilidade e disposição.",
    image: "/images/gym-site/functional-community.png",
    alt: "Grupo de alunos em uma aula de treinamento funcional",
    icon: Zap,
  },
  {
    index: "03",
    title: "Cardio experience",
    description: "Energia coletiva e intensidade na medida para fazer você querer voltar.",
    image: "/images/gym-site/indoor-cycling.png",
    alt: "Aluna participando de uma aula de ciclismo indoor",
    icon: HeartPulse,
  },
];

const faqItems = [
  {
    question: "Posso conhecer a academia antes de me matricular?",
    answer: "Sim. Solicite sua experiência pelo formulário e nossa equipe entrará em contato para combinar o melhor horário.",
  },
  {
    question: "Nunca treinei. Vou receber orientação?",
    answer: "Com certeza. A jornada começa entendendo seu objetivo e seu nível atual para que você treine com mais segurança e confiança.",
  },
  {
    question: "Como escolho o plano ideal?",
    answer: "Nossa equipe explica as diferenças entre os planos e ajuda você a escolher a opção que faz sentido para sua rotina e frequência.",
  },
  {
    question: "Posso treinar em horários diferentes?",
    answer: "A disponibilidade pode variar conforme o plano e a unidade. Informe sua rotina no atendimento para receber a orientação correta.",
  },
];

function cycleLabel(cycle: string) {
  const labels: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
  };
  return labels[cycle.toLowerCase()] ?? cycle;
}

function branchAddress(branch: SiteData["branches"][number]) {
  const addressLine = [branch.address?.street, branch.address?.number].filter(Boolean).join(", ");
  const cityLine = [branch.address?.neighborhood, branch.address?.city, branch.address?.state].filter(Boolean).join(" · ");
  return [addressLine, cityLine].filter(Boolean).join(" — ") || "Localização disponível no atendimento";
}

const getPublicSite = cache(async (slug: string) => {
  const db = await createOperationalClient();
  const { data } = await db.rpc("get_public_gym_site", { p_slug: slug });
  return data ? (data as SiteData) : null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) return {};

  const title = `${site.organization.name} | Treine com propósito`;
  const description = `Conheça a estrutura, os planos e a experiência da ${site.organization.name}. Agende seu primeiro treino.`;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/images/gym-site/hero-training.png", width: 1792, height: 896 }],
    },
  };
}

export default async function GymPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ enviado?: string; erro?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const site = await getPublicSite(slug);

  if (!site) notFound();
  const phoneHref = site.organization.phone
    ? `tel:${site.organization.phone.replace(/[^+\d]/g, "")}`
    : "#experimental";

  return (
    <main className={styles.site}>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label={`${site.organization.name}, início`}>
          <span className={styles.brandMark}><Dumbbell size={19} strokeWidth={2.4} /></span>
          <span>{site.organization.name}</span>
        </a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#modalidades">Modalidades</a>
          <a href="#experiencia">Experiência</a>
          <a href="#planos">Planos</a>
          <a href="#unidades">Unidades</a>
        </nav>
        <a className={styles.headerCta} href="#experimental">
          Agendar experiência <ArrowUpRight size={15} />
        </a>
      </header>

      <section id="inicio" className={styles.hero}>
        <Image
          className={styles.heroImage}
          src="/images/gym-site/hero-training.png"
          alt="Atletas treinando com pesos em uma academia contemporânea"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroGrid} />
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}><span className={styles.liveDot} />Seu melhor ritmo começa aqui</div>
          <h1>Não é só treino.<span>É a sua virada.</span></h1>
          <p>
            Um ambiente que inspira, profissionais que orientam e uma comunidade que faz você continuar.
            Venha descobrir o que muda quando o treino finalmente combina com você.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#experimental">Quero viver essa experiência <ArrowUpRight size={17} /></a>
            <a className={styles.ghostButton} href="#modalidades"><span><Play size={13} fill="currentColor" /></span>Explorar a academia</a>
          </div>
          <div className={styles.heroProof}>
            <div className={styles.avatarStack} aria-hidden="true"><span>F</span><span>R</span><span>M</span></div>
            <div>
              <span className={styles.stars} aria-label="Experiência cinco estrelas">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} fill="currentColor" />)}
              </span>
              <small>Treino com direção, cuidado e energia</small>
            </div>
          </div>
        </div>
        <a className={styles.scrollCue} href="#movimento" aria-label="Continuar a página"><ArrowDown size={16} /></a>
      </section>

      <section id="movimento" className={styles.proofStrip} aria-label="Diferenciais da experiência">
        <article><strong>360º</strong><span>Olhar completo para sua evolução</span></article>
        <article><strong>1:1</strong><span>Orientação desde o primeiro treino</span></article>
        <article><strong>+ energia</strong><span>Ambiente que coloca você em movimento</span></article>
        <article><strong>Seu ritmo</strong><span>Uma jornada que cabe na sua rotina</span></article>
      </section>

      <section id="modalidades" className={styles.modalities}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.kicker}><Flame size={14} /> Encontre seu movimento</span>
            <h2>Treinos que fazem você esquecer as desculpas.</h2>
          </div>
          <p>Diferentes caminhos, um mesmo objetivo: criar uma rotina que você consiga manter e tenha orgulho de viver.</p>
        </div>
        <div className={styles.modalityGrid}>
          {modalityCards.map((modality) => {
            const Icon = modality.icon;
            return (
              <article className={styles.modalityCard} key={modality.title}>
                <Image src={modality.image} alt={modality.alt} fill sizes="(max-width: 760px) 100vw, 33vw" />
                <div className={styles.cardShade} />
                <span className={styles.cardIndex}>{modality.index}</span>
                <div className={styles.cardCopy}>
                  <Icon size={20} />
                  <h3>{modality.title}</h3>
                  <p>{modality.description}</p>
                  <a href="#experimental">Quero experimentar <ChevronRight size={15} /></a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="experiencia" className={styles.experience}>
        <div className={styles.experienceVisual}>
          <Image src="/images/gym-site/strength-coaching.png" alt="Treinador acompanhando o exercício de um aluno" fill sizes="(max-width: 900px) 100vw, 52vw" />
          <div className={styles.experienceBadge}><BadgeCheck size={20} /><div><strong>Você não treina sozinho</strong><span>Orientação em cada fase</span></div></div>
        </div>
        <div className={styles.experienceCopy}>
          <span className={styles.kicker}><Target size={14} /> Treino com propósito</span>
          <h2>Chega de começar sem saber para onde ir.</h2>
          <p>Seu resultado nasce de uma sequência simples: entender o ponto de partida, construir um plano realista e acompanhar a evolução para continuar avançando.</p>
          <div className={styles.experienceList}>
            {[
              ["01", "Entendimento do seu objetivo", "Sua rotina e suas prioridades entram no plano."],
              ["02", "Treino orientado", "Mais confiança para executar e evoluir com segurança."],
              ["03", "Evolução visível", "Acompanhamento para transformar esforço em constância."],
            ].map(([index, title, text]) => (
              <article key={index}><span>{index}</span><div><strong>{title}</strong><p>{text}</p></div></article>
            ))}
          </div>
          <a className={styles.textLink} href="#experimental">Conversar com a equipe <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <section className={styles.journey}>
        <div className={styles.journeyIntro}>
          <span className={styles.kicker}><TrendingUp size={14} /> A jornada continua</span>
          <h2>Um treino para hoje. Um estilo de vida para levar.</h2>
          <p>Aqui, evolução não é uma promessa distante. É o resultado de pequenas escolhas repetidas em um ambiente preparado para apoiar você.</p>
        </div>
        <div className={styles.journeySteps}>
          {[
            [CalendarDays, "Comece", "Agende sua primeira experiência."],
            [Target, "Organize", "Defina seu foco com orientação."],
            [Dumbbell, "Treine", "Construa força e condicionamento."],
            [Medal, "Evolua", "Perceba a mudança dentro e fora do treino."],
          ].map(([Icon, title, text], index) => {
            const StepIcon = Icon as typeof CalendarDays;
            return <article key={String(title)}><span className={styles.stepNumber}>0{index + 1}</span><StepIcon size={24} /><strong>{String(title)}</strong><p>{String(text)}</p></article>;
          })}
        </div>
      </section>

      <section className={styles.community}>
        <Image src="/images/gym-site/functional-community.png" alt="Comunidade treinando junta em uma aula funcional" fill sizes="100vw" />
        <div className={styles.communityShade} />
        <div className={styles.communityCopy}>
          <span className={styles.kicker}><Users size={14} /> Uma energia que conecta</span>
          <h2>Quando o ambiente puxa você para cima, continuar fica mais leve.</h2>
          <p>Pessoas reais, objetivos diferentes e a mesma vontade de sair melhor do que entrou. Faça parte de uma comunidade que celebra cada avanço.</p>
          <a className={styles.lightButton} href="#experimental">Fazer parte <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <section id="planos" className={styles.plans}>
        <div className={styles.centerHeading}>
          <span className={styles.kicker}><Sparkles size={14} /> Escolha sua jornada</span>
          <h2>Seu próximo capítulo começa com um plano possível.</h2>
          <p>Encontre a opção que combina com sua frequência, seus objetivos e sua rotina.</p>
        </div>
        <div className={styles.planGrid}>
          {site.plans.length ? site.plans.map((plan, index) => {
            const benefits = plan.benefits?.filter(Boolean).slice(0, 5) ?? [];
            const displayBenefits = benefits.length ? benefits : ["Acesso à estrutura", "Orientação no treino", "Suporte da equipe"];
            const featured = index === 1 || (site.plans.length === 1 && index === 0);
            return (
              <article className={`${styles.planCard} ${featured ? styles.featuredPlan : ""}`} key={plan.id}>
                {featured && <span className={styles.planBadge}>Mais escolhido</span>}
                <span className={styles.planCycle}>{cycleLabel(plan.billing_cycle)}</span>
                <h3>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description || "Uma experiência completa para sua evolução."}</p>
                <div className={styles.price}><strong>{money(plan.price_cents)}</strong><span>/ período</span></div>
                <ul>{displayBenefits.map((benefit) => <li key={benefit}><span><Check size={13} /></span>{benefit}</li>)}</ul>
                <a href="#experimental">Quero este plano <ArrowUpRight size={16} /></a>
              </article>
            );
          }) : (
            <article className={`${styles.planCard} ${styles.featuredPlan}`}>
              <span className={styles.planBadge}>Atendimento personalizado</span>
              <span className={styles.planCycle}>Seu objetivo, sua escolha</span>
              <h3>Encontre o plano ideal</h3>
              <p className={styles.planDescription}>Fale com a equipe e descubra a melhor opção para sua rotina.</p>
              <ul>{["Apresentação completa da estrutura", "Plano alinhado à sua frequência", "Atendimento sem compromisso"].map((benefit) => <li key={benefit}><span><Check size={13} /></span>{benefit}</li>)}</ul>
              <a href="#experimental">Quero saber mais <ArrowUpRight size={16} /></a>
            </article>
          )}
        </div>
      </section>

      <section id="unidades" className={styles.units}>
        <div className={styles.unitsIntro}>
          <span className={styles.kicker}><MapPin size={14} /> Perto da sua rotina</span>
          <h2>Seu lugar de treinar está mais perto do que parece.</h2>
          <p>Escolha a unidade, agende sua experiência e venha sentir o ambiente pessoalmente.</p>
          <a className={styles.textLink} href={phoneHref}>Falar com a academia <MessageCircle size={16} /></a>
        </div>
        <div className={styles.unitList}>
          {site.branches.length ? site.branches.map((branch, index) => (
            <article key={branch.id}>
              <span className={styles.unitIndex}>0{index + 1}</span>
              <div><small>Unidade</small><h3>{branch.name}</h3><p>{branchAddress(branch)}</p></div>
              <a href="#experimental" aria-label={`Agendar experiência na unidade ${branch.name}`}><ArrowUpRight size={18} /></a>
            </article>
          )) : (
            <article><span className={styles.unitIndex}>01</span><div><small>Unidade</small><h3>{site.organization.name}</h3><p>Endereço informado no atendimento.</p></div><a href="#experimental" aria-label="Agendar experiência"><ArrowUpRight size={18} /></a></article>
          )}
        </div>
      </section>

      <section className={styles.faq}>
        <div className={styles.faqIntro}>
          <span className={styles.kicker}><ShieldCheck size={14} /> Antes do primeiro treino</span>
          <h2>Suas dúvidas não precisam virar desculpas.</h2>
          <p>Reunimos respostas rápidas para você dar o próximo passo com tranquilidade.</p>
          <div className={styles.faqNote}><Clock3 size={17} /><span>Leva menos de um minuto para solicitar sua experiência.</span></div>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary><span>0{index + 1}</span>{item.question}<ChevronRight size={18} /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="experimental" className={styles.finalCta}>
        <div className={styles.finalVisual}>
          <Image src="/images/gym-site/indoor-cycling.png" alt="Aluna treinando em uma aula de ciclismo indoor" fill sizes="(max-width: 900px) 100vw, 48vw" />
          <div className={styles.finalVisualShade} />
          <div className={styles.finalQuote}><span>Seu futuro agradece o passo que você dá hoje.</span></div>
        </div>
        <div className={styles.formPanel}>
          <span className={styles.kicker}><Sparkles size={14} /> Sua primeira experiência</span>
          <h2>Venha sentir. Depois você decide.</h2>
          <p>Preencha seus dados e a equipe da {site.organization.name} entrará em contato.</p>
          {query.enviado && <p className={styles.successMessage}><BadgeCheck size={17} /> Recebemos seu interesse. A equipe entrará em contato.</p>}
          {query.erro && <p className={styles.errorMessage}>Não foi possível enviar agora. Tente novamente.</p>}
          <form action={captureGymLeadAction} className={styles.leadForm}>
            <input type="hidden" name="slug" value={slug} />
            <label><span>Nome completo</span><input required minLength={2} name="full_name" placeholder="Como podemos chamar você?" /></label>
            <label><span>WhatsApp</span><input required name="phone" type="tel" placeholder="(00) 00000-0000" /></label>
            <label><span>E-mail</span><input name="email" type="email" placeholder="voce@email.com" /></label>
            <label>
              <span>Seu principal objetivo</span>
              <select name="interest" defaultValue="">
                <option value="" disabled>Selecione uma opção</option>
                <option>Ganhar força e massa muscular</option>
                <option>Emagrecer e ganhar condicionamento</option>
                <option>Ter mais saúde e disposição</option>
                <option>Conhecer os planos</option>
              </select>
            </label>
            <button type="submit">Quero agendar minha experiência <ArrowUpRight size={17} /></button>
            <small><ShieldCheck size={13} /> Seus dados serão enviados somente para a equipe desta academia.</small>
          </form>
        </div>
      </section>

      <footer className={styles.footer}>
        <a className={styles.brand} href="#inicio"><span className={styles.brandMark}><Dumbbell size={18} /></span><span>{site.organization.name}</span></a>
        <p>Movimento muda tudo. Comece pelo seu.</p>
        <div><a href="#planos">Planos</a><a href="#unidades">Unidades</a><a href="#experimental">Contato</a></div>
        <small>Imagens ilustrativas · Site criado com NexaWi Academias</small>
      </footer>
    </main>
  );
}
