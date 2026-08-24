export type MarketingPlan = {
  name: string;
  slug: string;
  audience: string;
  description: string;
  price: number;
  setup: string;
  units: string;
  students: string;
  trial: string;
  commitment: string;
  featured?: boolean;
  included: string[];
  excluded: string[];
};

export const company = {
  legalName: "54954 James Costa Lima",
  tradeName: "NexaWi Academias",
  taxId: "54.954.915/0001-65",
  city: "Vitória da Conquista",
  state: "BA",
  email: "contato@nexawi.com.br",
  supportEmail: "contato@nexawi.com.br",
  whatsapp: "5577988656394",
  whatsappDisplay: "(77) 98865-6394",
  serviceHours: "Atendimento digital 24 horas, 7 dias por semana",
  domain: "academias.nexawi.com.br",
};

export const marketingPlans: MarketingPlan[] = [
  {
    name: "Plano Básico",
    slug: "basico",
    audience: "Para organizar a primeira operação",
    description: "A base essencial para uma academia vender, cadastrar alunos e acompanhar a rotina sem planilhas paralelas.",
    price: 147,
    setup: "R$ 240 uma única vez",
    units: "1 unidade",
    students: "Até 300 alunos",
    trial: "7 dias",
    commitment: "Permanência mínima de 6 meses",
    included: [
      "Site público conectado ao CRM",
      "Cadastro de alunos, planos e matrículas",
      "Agenda de aulas e reservas",
      "Treinos e avaliações físicas",
      "Financeiro e controle de inadimplência",
      "Check-in manual e relatórios essenciais",
    ],
    excluded: ["Multiunidade", "Permissões por unidade", "Domínio personalizado", "Prioridade em integrações"],
  },
  {
    name: "Plano Extensão",
    slug: "extensao",
    audience: "Para crescer com processo e controle",
    description: "Mais capacidade, gestão multiunidade e recursos comerciais para transformar oportunidades em matrículas.",
    price: 217,
    setup: "R$ 240 uma única vez",
    units: "Até 5 unidades",
    students: "Até 2.500 alunos",
    trial: "7 dias",
    commitment: "Permanência mínima de 6 meses",
    featured: true,
    included: [
      "Tudo do Plano Básico",
      "Operação de até 5 unidades",
      "CRM com pipeline e histórico",
      "Contratos e jornadas de retenção",
      "Papéis e permissões da equipe",
      "Indicadores comerciais e operacionais",
      "Personalização ampliada do site",
    ],
    excluded: ["Mais de 5 unidades", "Implantação dedicada por unidade", "Prioridade máxima em integrações"],
  },
  {
    name: "Plano Rede",
    slug: "rede",
    audience: "Para redes que precisam escalar sem perder o controle",
    description: "Governança, capacidade e acompanhamento consolidado para grupos com várias operações físicas.",
    price: 497,
    setup: "R$ 120 por unidade",
    units: "Até 50 unidades",
    students: "Até 10.000 alunos",
    trial: "7 dias",
    commitment: "Permanência mínima de 6 meses",
    included: [
      "Tudo do Plano Extensão",
      "Operação de até 50 unidades",
      "Visão consolidada da rede",
      "Permissões e escopo por unidade",
      "Auditoria operacional",
      "Domínios personalizados",
      "Implantação e suporte prioritários",
      "Prioridade no roadmap de integrações",
    ],
    excluded: ["Desenvolvimentos exclusivos não previstos no escopo", "Custos de serviços de terceiros e equipamentos"],
  },
];

export function whatsappUrl(message = "Olá! Quero conhecer o NexaWi Academias e agendar uma demonstração.") {
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const institutionalFaq = [
  ["O teste de 7 dias gera cobrança automática?", "Não nesta etapa. A ativação do teste é acompanhada pela equipe. Quando o checkout recorrente estiver disponível, a cobrança após o teste exigirá cadastro prévio do meio de pagamento e aceite expresso."],
  ["Existe fidelidade?", "Os planos possuem permanência mínima de 6 meses. Condições de cancelamento, aviso prévio e eventuais valores são apresentadas na proposta e no contrato antes da contratação."],
  ["A implantação está incluída?", "A implantação é cobrada separadamente: R$ 240 nos planos Básico e Extensão e R$ 120 por unidade no Plano Rede."],
  ["Posso migrar de plano?", "Sim. A mudança é analisada conforme quantidade de alunos, unidades e recursos necessários, sem perder o histórico da operação."],
  ["Integrações com pagamentos, WhatsApp e catracas estão incluídas?", "A plataforma está preparada para integrações. Disponibilidade, eventuais custos de terceiros e implantação técnica são confirmados na proposta comercial."],
] as const;
