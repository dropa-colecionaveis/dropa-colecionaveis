'use client'

import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <PublicHeader />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-purple-300/10 text-6xl animate-pulse">⚡</div>
        <div className="absolute top-40 right-20 text-blue-300/10 text-4xl animate-bounce">💎</div>
        <div className="absolute bottom-40 left-1/4 text-indigo-300/10 text-5xl animate-pulse delay-300">🌟</div>
        <div className="absolute bottom-20 right-1/3 text-purple-300/10 text-3xl animate-bounce delay-500">⚔️</div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white border border-white/20 shadow-2xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400">
            Política de Privacidade
          </h1>
          <p className="text-purple-200 text-center mb-8">
            Atualizada em: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <div className="space-y-8 text-gray-200">
            {/* Seção 1 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Informações Gerais</h2>
              <p className="leading-relaxed">
                A <strong>Colecionáveis Platform</strong> ("nós", "nosso" ou "empresa") está comprometida em proteger 
                a privacidade e os dados pessoais de nossos usuários. Esta Política de Privacidade descreve como 
                coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a 
                Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
              </p>
            </section>

            {/* Seção 2 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Dados Coletados</h2>
              <div className="leading-relaxed space-y-3">
                <p><strong>2.1 Dados fornecidos por você:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Nome completo e email (obrigatórios para registro)</li>
                  <li>Dados de autenticação (Google, Facebook)</li>
                  <li>Informações de pagamento (processadas pelo Mercado Pago)</li>
                  <li>Preferências de jogo e configurações de conta</li>
                </ul>
                
                <p className="mt-4"><strong>2.2 Dados coletados automaticamente:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Endereço IP e informações do dispositivo</li>
                  <li>Logs de acesso e atividades na plataforma</li>
                  <li>Cookies e tecnologias similares</li>
                  <li>Estatísticas de uso e performance</li>
                </ul>
              </div>
            </section>

            {/* Seção 3 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. Finalidades do Tratamento</h2>
              <div className="leading-relaxed">
                <p>Utilizamos seus dados pessoais para:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>Criar e gerenciar sua conta de usuário</li>
                  <li>Processar pagamentos e transações</li>
                  <li>Fornecer suporte ao cliente</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Enviar comunicações importantes sobre a conta</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                </ul>
              </div>
            </section>

            {/* Seção 4 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Base Legal</h2>
              <div className="leading-relaxed">
                <p>O tratamento de seus dados pessoais é baseado em:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li><strong>Consentimento:</strong> Para comunicações de marketing</li>
                  <li><strong>Execução de contrato:</strong> Para prestação dos serviços</li>
                  <li><strong>Legítimo interesse:</strong> Para segurança e prevenção de fraudes</li>
                  <li><strong>Cumprimento de obrigação legal:</strong> Para questões fiscais e regulamentares</li>
                </ul>
              </div>
            </section>

            {/* Seção 5 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Compartilhamento de Dados</h2>
              <div className="leading-relaxed">
                <p>Compartilhamos seus dados apenas nas seguintes situações:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li><strong>Mercado Pago:</strong> Para processamento de pagamentos</li>
                  <li><strong>Google/Facebook:</strong> Para autenticação (quando escolhido pelo usuário)</li>
                  <li><strong>Autoridades competentes:</strong> Quando exigido por lei</li>
                  <li><strong>Prestadores de serviços:</strong> Sob acordos de confidencialidade</li>
                </ul>
              </div>
            </section>

            {/* Seção 6 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Seus Direitos</h2>
              <div className="leading-relaxed">
                <p>Conforme a LGPD, você tem direito a:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>Confirmação da existência de tratamento de dados</li>
                  <li>Acesso aos seus dados pessoais</li>
                  <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                  <li>Anonimização, bloqueio ou eliminação de dados</li>
                  <li>Portabilidade dos dados</li>
                  <li>Eliminação dos dados tratados com consentimento</li>
                  <li>Revogação do consentimento</li>
                </ul>
                
                <div className="bg-purple-600/20 border border-purple-400/30 rounded-lg p-4 mt-4 backdrop-blur-sm">
                  <p className="font-semibold">📧 Para exercer seus direitos, entre em contato:</p>
                  <p className="mt-2">Email: <span className="text-purple-300">privacidade@colecionaveis.com</span></p>
                  <p>Ou acesse: <Link href="/account/data-request" className="text-purple-300 hover:text-purple-100 underline transition-colors">Configurações de Privacidade</Link></p>
                </div>
              </div>
            </section>

            {/* Seção 7 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Segurança dos Dados</h2>
              <div className="leading-relaxed">
                <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controle de acesso e autenticação</li>
                  <li>Monitoramento de segurança 24/7</li>
                  <li>Backups seguros e recuperação de dados</li>
                  <li>Treinamento regular da equipe</li>
                </ul>
              </div>
            </section>

            {/* Seção 8 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Retenção de Dados</h2>
              <p className="leading-relaxed">
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, 
                respeitando os prazos legais de retenção. Dados de transações financeiras são mantidos conforme 
                exigências fiscais e regulamentares.
              </p>
            </section>

            {/* Seção 9 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Cookies</h2>
              <div className="leading-relaxed">
                <p>Utilizamos cookies para:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>Manter você logado na plataforma</li>
                  <li>Lembrar suas preferências</li>
                  <li>Analisar o uso da plataforma</li>
                  <li>Melhorar a segurança</li>
                </ul>
                <p className="mt-3">
                  Você pode gerenciar os cookies através das <Link href="/cookies" className="text-purple-300 hover:text-purple-100 underline transition-colors">configurações de cookies</Link>.
                </p>
              </div>
            </section>

            {/* Seção 10 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. Alterações na Política</h2>
              <p className="leading-relaxed">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas 
                por email ou através da plataforma. A data da última atualização será sempre indicada no topo desta página.
              </p>
            </section>

            {/* Seção 11 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">11. Contato</h2>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <p className="leading-relaxed">
                  <strong>Controlador de Dados:</strong> Colecionáveis Platform Ltda.<br/>
                  <strong>Email:</strong> privacidade@colecionaveis.com<br/>
                  <strong>Telefone:</strong> (11) 9999-9999<br/>
                  <strong>Endereço:</strong> Rua Example, 123 - São Paulo, SP
                </p>
                
                <p className="mt-4">
                  <strong>Encarregado de Proteção de Dados (DPO):</strong><br/>
                  Email: dpo@colecionaveis.com
                </p>
              </div>
            </section>
          </div>

          {/* Footer da política */}
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-gray-300 text-sm">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
            </p>
            <div className="mt-4 space-x-4">
              <Link href="/terms" className="text-purple-300 hover:text-purple-100 text-sm underline transition-colors">
                Termos de Uso
              </Link>
              <Link href="/cookies" className="text-purple-300 hover:text-purple-100 text-sm underline transition-colors">
                Política de Cookies
              </Link>
              <Link href="/account/data-request" className="text-purple-300 hover:text-purple-100 text-sm underline transition-colors">
                Solicitar Dados
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}