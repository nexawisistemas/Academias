import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
export const metadata: Metadata = { title: "Política de Cookies" };
export default function CookiesPage(){return <LegalPage eyebrow="ESCOLHA E TRANSPARÊNCIA" title="Política de Cookies" intro="Entenda quais tecnologias podem ser usadas e como controlar suas preferências.">
  <h2>1. O que são cookies</h2><p>Cookies e tecnologias semelhantes armazenam pequenas informações no navegador para manter sessões, lembrar escolhas, medir utilização e, quando autorizado, apoiar campanhas.</p>
  <h2>2. Categorias</h2><ul><li><strong>Essenciais:</strong> autenticação, segurança, equilíbrio de carga e preferências indispensáveis. Não podem ser desativados pela ferramenta do site.</li><li><strong>Analíticos:</strong> ajudam a entender páginas, origem e desempenho de forma agregada, como Google Analytics.</li><li><strong>Marketing:</strong> medem campanhas e podem apoiar publicidade, como Meta Pixel.</li><li><strong>Atendimento:</strong> habilitam widgets de conversa, quando configurados.</li></ul>
  <h2>3. Sua escolha</h2><p>Na primeira visita, você pode aceitar todos os cookies ou manter somente os essenciais. Analíticos, marketing e atendimento só são carregados após o aceite. A preferência é registrada neste navegador.</p>
  <h2>4. Como revisar</h2><p>Você também pode apagar o item <code>nexawi_cookie_consent_v1</code> no armazenamento do navegador ou limpar os dados do site para que o aviso seja exibido novamente. O bloqueio de cookies pelo navegador pode afetar login e recursos essenciais.</p>
  <h2>5. Duração e terceiros</h2><p>A duração varia conforme a finalidade e o fornecedor. IDs de Google Analytics, Google Tag Manager, Meta Pixel e atendimento somente serão utilizados se configurados no painel e consentidos. As políticas dos respectivos provedores também se aplicam.</p>
  <h2>6. Contato</h2><p>Dúvidas ou solicitações podem ser encaminhadas para <a href="mailto:contato@nexawi.com.br">contato@nexawi.com.br</a>.</p>
</LegalPage>}
