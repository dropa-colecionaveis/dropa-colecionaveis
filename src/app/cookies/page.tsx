'use client'

import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <PublicHeader />
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 text-purple-300/10 text-6xl animate-pulse">⚡</div>
          <div className="absolute top-40 right-20 text-blue-300/10 text-4xl animate-bounce">💎</div>
          <div className="absolute bottom-40 left-1/4 text-indigo-300/10 text-5xl animate-pulse delay-300">🌟</div>
          <div className="absolute bottom-20 right-1/3 text-purple-300/10 text-3xl animate-bounce delay-500">⚔️</div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden border border-white/20">
            <div className="px-6 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 mb-4">
                  Política de Cookies
                </h1>
                <p className="text-sm text-purple-200">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              <nav className="mb-8">
                <ul className="space-y-2 text-sm">
                  <li><a href="#what-are-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">1. O que são Cookies</a></li>
                  <li><a href="#types-of-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">2. Tipos de Cookies que Utilizamos</a></li>
                  <li><a href="#necessary-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">3. Cookies Necessários</a></li>
                  <li><a href="#analytics-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">4. Cookies de Análise</a></li>
                  <li><a href="#marketing-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">5. Cookies de Marketing</a></li>
                  <li><a href="#preferences-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">6. Cookies de Preferências</a></li>
                  <li><a href="#third-party-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">7. Cookies de Terceiros</a></li>
                  <li><a href="#managing-cookies" className="text-purple-300 hover:text-purple-100 transition-colors">8. Gerenciamento de Cookies</a></li>
                  <li><a href="#data-retention" className="text-purple-300 hover:text-purple-100 transition-colors">9. Retenção de Dados</a></li>
                  <li><a href="#updates" className="text-purple-300 hover:text-purple-100 transition-colors">10. Atualizações desta Política</a></li>
                  <li><a href="#contact" className="text-purple-300 hover:text-purple-100 transition-colors">11. Contato</a></li>
                </ul>
              </nav>

              <div className="space-y-8 text-gray-200">
                <section id="what-are-cookies">
                  <h2 className="text-2xl font-semibold text-white mb-4">1. O que são Cookies</h2>
                  <p className="mb-4">
                    Cookies são pequenos arquivos de texto que são armazenados em seu dispositivo (computador, tablet ou smartphone) 
                    quando você visita nosso site. Eles permitem que o site "lembre" de suas ações e preferências 
                    (como login, idioma, tamanho da fonte e outras preferências de exibição) durante um período de tempo.
                  </p>
                  <p className="mb-4">
                    Os cookies nos ajudam a:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Manter você logado durante sua sessão</li>
                    <li>Lembrar suas preferências e configurações</li>
                    <li>Melhorar a performance e funcionalidade do site</li>
                    <li>Entender como você usa nosso site para melhorar sua experiência</li>
                    <li>Fornecer conteúdo personalizado e relevante</li>
                  </ul>
                </section>

                <section id="types-of-cookies">
                  <h2 className="text-2xl font-semibold text-white mb-4">2. Tipos de Cookies que Utilizamos</h2>
                  <p className="mb-4">
                    Utilizamos diferentes tipos de cookies em nossa plataforma, cada um com funções específicas:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <h3 className="font-semibold text-white mb-2">Cookies de Sessão</h3>
                      <p className="text-sm text-gray-300">
                        Temporários, são excluídos quando você fecha o navegador. 
                        Utilizados para manter sua sessão ativa durante a navegação.
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <h3 className="font-semibold text-white mb-2">Cookies Persistentes</h3>
                      <p className="text-sm text-gray-300">
                        Permanecem em seu dispositivo por um período determinado. 
                        Utilizados para lembrar suas preferências entre visitas.
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <h3 className="font-semibold text-white mb-2">Cookies Próprios</h3>
                      <p className="text-sm text-gray-300">
                        Definidos diretamente por nosso site. 
                        Utilizados para funcionalidades essenciais da plataforma.
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <h3 className="font-semibold text-white mb-2">Cookies de Terceiros</h3>
                      <p className="text-sm text-gray-300">
                        Definidos por serviços externos que utilizamos. 
                        Incluem analytics, pagamentos e redes sociais.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="necessary-cookies">
                  <h2 className="text-2xl font-semibold text-white mb-4">3. Cookies Necessários</h2>
                  <p className="mb-4">
                    Estes cookies são essenciais para o funcionamento básico da plataforma e não podem ser desativados:
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/10 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Cookie</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Propósito</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Duração</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/20">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">next-auth.session-token</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Gerenciamento de sessão e autenticação</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">30 dias</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">csrf-token</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Proteção contra ataques CSRF</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Sessão</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">cookie-consent</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Armazena suas preferências de cookies</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">1 ano</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">rate-limit</td>
                          <td className="px-6 py-4 text-sm text-gray-300">Proteção contra abuso e spam</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">15 minutos</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section id="contact">
                  <h2 className="text-2xl font-semibold text-white mb-4">11. Contato</h2>
                  <p className="mb-4">
                    Para dúvidas sobre esta política de cookies ou para exercer seus direitos:
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                    <p><strong>Email:</strong> privacidade@colecionaveisdigitais.com.br</p>
                    <p><strong>Assunto:</strong> Política de Cookies</p>
                    <p><strong>Telefone:</strong> (11) 9999-9999</p>
                    <p><strong>Horário de atendimento:</strong> Segunda a sexta, 9h às 18h</p>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-600/20 rounded-lg border border-blue-500/30 backdrop-blur-sm">
                    <h4 className="font-semibold text-blue-300 mb-2">Seus Direitos:</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• Acessar dados coletados através de cookies</li>
                      <li>• Solicitar correção de informações incorretas</li>
                      <li>• Revogar consentimento para cookies não essenciais</li>
                      <li>• Solicitar exclusão de dados quando aplicável</li>
                      <li>• Receber informações sobre compartilhamento de dados</li>
                    </ul>
                  </div>
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-white/20">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <Link 
                    href="/" 
                    className="text-purple-300 hover:text-purple-100 transition-colors font-semibold"
                  >
                    ← Voltar ao início
                  </Link>
                  <div className="flex space-x-4 text-sm">
                    <Link href="/privacy" className="text-blue-300 hover:text-blue-100 transition-colors">
                      Política de Privacidade
                    </Link>
                    <Link href="/terms" className="text-blue-300 hover:text-blue-100 transition-colors">
                      Termos de Serviço
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}