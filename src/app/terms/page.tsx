'use client'

import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

export default function TermsOfService() {
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
                  Termos de Serviço
                </h1>
                <p className="text-sm text-purple-200">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              <nav className="mb-8">
                <ul className="space-y-2 text-sm">
                  <li><a href="#acceptance" className="text-purple-300 hover:text-purple-100 transition-colors">1. Aceitação dos Termos</a></li>
                  <li><a href="#services" className="text-purple-300 hover:text-purple-100 transition-colors">2. Descrição dos Serviços</a></li>
                  <li><a href="#registration" className="text-purple-300 hover:text-purple-100 transition-colors">3. Registro e Conta de Usuário</a></li>
                  <li><a href="#credits" className="text-purple-300 hover:text-purple-100 transition-colors">4. Sistema de Créditos</a></li>
                  <li><a href="#collectibles" className="text-purple-300 hover:text-purple-100 transition-colors">5. Itens Colecionáveis Digitais</a></li>
                  <li><a href="#marketplace" className="text-purple-300 hover:text-purple-100 transition-colors">6. Marketplace</a></li>
                  <li><a href="#prohibited" className="text-purple-300 hover:text-purple-100 transition-colors">7. Condutas Proibidas</a></li>
                  <li><a href="#intellectual" className="text-purple-300 hover:text-purple-100 transition-colors">8. Propriedade Intelectual</a></li>
                  <li><a href="#privacy" className="text-purple-300 hover:text-purple-100 transition-colors">9. Privacidade e Proteção de Dados</a></li>
                  <li><a href="#limitation" className="text-purple-300 hover:text-purple-100 transition-colors">10. Limitação de Responsabilidade</a></li>
                  <li><a href="#termination" className="text-purple-300 hover:text-purple-100 transition-colors">11. Suspensão e Encerramento</a></li>
                  <li><a href="#modifications" className="text-purple-300 hover:text-purple-100 transition-colors">12. Modificações dos Termos</a></li>
                  <li><a href="#contact" className="text-purple-300 hover:text-purple-100 transition-colors">13. Contato</a></li>
                </ul>
              </nav>

              <div className="space-y-8 text-gray-200">
                <section id="acceptance">
                  <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
                  <p className="mb-4">
                    Ao acessar e utilizar a plataforma Colecionáveis Digitais, você concorda em estar vinculado a estes Termos de Serviço. 
                    Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
                  </p>
                  <p>
                    Estes termos constituem um acordo legal entre você e a plataforma Colecionáveis Digitais, 
                    regendo seu uso de todos os recursos e funcionalidades disponibilizados.
                  </p>
                </section>

                <section id="services">
                  <h2 className="text-2xl font-semibold text-white mb-4">2. Descrição dos Serviços</h2>
                  <p className="mb-4">
                    A plataforma Colecionáveis Digitais oferece:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Sistema de aquisição de créditos virtuais mediante pagamento</li>
                    <li>Compra de pacotes (packs) contendo itens colecionáveis digitais aleatórios</li>
                    <li>Sistema de raridade com diferentes probabilidades para cada tipo de item</li>
                    <li>Inventário pessoal para gerenciamento de itens coletados</li>
                    <li>Marketplace para comercialização entre usuários</li>
                    <li>Sistema de conquistas e rankings</li>
                    <li>Coleções temáticas e itens de edição limitada</li>
                  </ul>
                  <p>
                    Nos reservamos o direito de modificar, descontinuar ou adicionar novos recursos a qualquer momento.
                  </p>
                </section>

                <section id="contact">
                  <h2 className="text-2xl font-semibold text-white mb-4">13. Contato</h2>
                  <p className="mb-4">
                    Para dúvidas, suporte ou exercício de direitos relacionados a estes termos:
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                    <p><strong>Email:</strong> suporte@colecionaveisdigitais.com.br</p>
                    <p><strong>Telefone:</strong> (11) 9999-9999</p>
                    <p><strong>Horário de atendimento:</strong> Segunda a sexta, 9h às 18h</p>
                    <p><strong>Endereço:</strong> São Paulo, SP - Brasil</p>
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
                    <Link href="/cookies" className="text-blue-300 hover:text-blue-100 transition-colors">
                      Política de Cookies
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