'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Suporte() {
  const [activeSection, setActiveSection] = useState('primeiros-passos')
  const [searchTerm, setSearchTerm] = useState('')

  const sections = [
    {
      key: 'primeiros-passos',
      title: 'Primeiros Passos',
      icon: '🚀',
      articles: [
        { id: 1, title: 'Como criar uma conta no Dropa!', content: 'Para criar sua conta no Dropa!, clique em "Iniciar jornada" no topo da página inicial. Dê preferencia para logar com sua conta Google ou  Preencha seus dados pessoais, escolha um nome de usuário único e confirme seu email. Sua conta será ativada instantaneamente!' },
        { id: 2, title: 'Como comprar créditos', content: 'Após fazer login, acesse "Comprar Créditos" no seu dashboard. Escolha o valor desejado e pague via PIX. Seus créditos são creditados automaticamente após confirmação do pagamento.' },
        { id: 3, title: 'Como abrir seu primeiro pacote', content: 'Com créditos em sua conta, vá para "Loja de Pacotes". Escolha um tipo de pacote (Bronze, Prata, Ouro, Platina ou Diamante) e clique em "Abrir Pacote". Aproveite a animação e descubra seu item!' },
        { id: 4, title: 'Entendendo seu inventário', content: 'Acesse "Inventário" para ver todos os itens que você coletou. Você pode filtrar por raridade ou coleção' }
      ]
    },
    {
      key: 'sistema-de-raridade',
      title: 'Sistema de Raridade',
      icon: '💎',
      articles: [
        { id: 5, title: 'O que é Raridade vs Escassez?', content: 'Raridade define a dificuldade de encontrar um item (Comum, Incomum, Raro, Épico, Lendário). Escassez é outra camada de raridade, só que mais específica (Common, Uncommon, Rare, Legendary, Mythic, Unique). Um item pode ser Lendário em raridade mas Common em escassez.' },
        { id: 6, title: 'Como funciona o sistema duplo?', content: 'Cada item tem DUAS classificações independentes: Raridade (chance de aparecer nos pacotes) e Escassez define se o item é mais difícil de ser descoberto dentro da mesma raridade' },
        { id: 7, title: 'Itens Únicos: o que são?', content: 'Itens com escassez "Unique" existem apenas 1 exemplar no mundo inteiro. Apenas UMA pessoa pode possuir cada item único. Na Genesis Collection temos 5 itens únicos que valem 2.250 créditos base, cada item único.' },
        { id: 8, title: 'Probabilidades dos pacotes', content: 'Bronze: 60% Comum, 25% Incomum, 10% Raro, 4% Épico, 1% Lendário. Diamante: 32% Comum, 30% Incomum, 28% Raro, 30% Épico, 10% Lendário. Pacotes melhores = mais chances de itens raros!' }
      ]
    },
    {
      key: 'conquistas-xp',
      title: 'Conquistas & XP',
      icon: '🏆',
      articles: [
        { id: 9, title: 'Como funciona o sistema de XP?', content: 'Você ganha XP completando conquistas (5-2000 XP cada). Seu nível é calculado por: Nível = √(XP Total ÷ 100) + 1. Exemplo: 400 XP = Nível 3.' },
        { id: 10, title: 'Categorias de conquistas', content: 'Temos 6 categorias: Colecionador (coletar itens), Explorador (abrir pacotes), Comerciante (atividades de mercado), Marcos (grandes feitos), Diárias (atividades diárias), Especiais (conquistas secretas).' },
        { id: 11, title: 'Conquistas secretas', content: 'Algumas conquistas são secretas e só aparecem após serem desbloqueadas. Temos conquistas que dão até 2000 XP! Experimente diferentes ações para descobrir conquistas ocultas.' },
        { id: 12, title: 'Conquistas que dão XP', content: 'Todas as conquistas dão XP, mas algumas são mais difíceis de serem desbloqueadas. Quanto mais difícil for, mais XP você ganha.' }
      ]
    },
    {
      key: 'pagamentos',
      title: 'Pagamentos & Créditos',
      icon: '💳',
      articles: [
        { id: 13, title: 'Métodos de pagamento aceitos', content: 'Atualmente aceitamos PIX para compra de créditos. O pagamento é instantâneo e seguro. Futuramente, pretendemos implementar outras opções como cartão de crédito e PayPal.' },
        { id: 14, title: 'Como funcionam os créditos?', content: 'Créditos são a moeda interna do Dropa!. Use para comprar pacotes, participar de eventos especiais e comprar itens no marketplace. No pacote de crédito mais barato, R$2 são 30 créditos, quanto mais caro é o pacote, mais créditos você recebe, verifique a taxa de conversão dos pacotes.' },
        { id: 15, title: 'Política de reembolso', content: 'Não há política de reembolso, créditos comprados não podem ser reembolsados, mas podemos resolver qualquer problema que você possa ter.' },
        { id: 16, title: 'Segurança nos pagamentos', content: 'Todos os pagamentos são processados com criptografia TLS, PIX é processado via gateway seguro certificado.' }
      ]
    },
    {
      key: 'problemas-comuns',
      title: 'Problemas Comuns',
      icon: '🔧',
      articles: [
        { id: 17, title: 'Não recebi meus créditos após pagamento PIX', content: 'PIX pode levar até 5 minutos para processar. Verifique seu email de confirmação. Se após 10 minutos não recebeu, entre em contato enviando comprovante.' },
        { id: 18, title: 'Erro ao abrir pacotes', content: 'Certifique-se de ter créditos suficientes e conexão estável. Feche e abra o navegador. Se persistir, entre em contato.' },
        { id: 19, title: 'Item não apareceu no inventário', content: 'Alguns itens podem demorar até cerca de 30 segundos para aparecer. Atualize a página. Se não apareceu em 2 minutos, entre em contato com captura de tela do problema.' },
        { id: 20, title: 'Problemas de login', content: 'Verifique email/senha. Use "Esqueci minha senha" se necessário. Limpe cache do navegador. Tente navegador anônimo. Se persistir, entre em contato.' }
      ]
    },
    {
      key: 'marketplace',
      title: 'Marketplace',
      icon: '🛒',
      articles: [
        { id: 21, title: 'Como funciona o Marketplace?', content: 'No Marketplace é permitido a compra/venda de itens entre jogadores.' },
        { id: 22, title: 'Como funcionará a venda de itens?', content: 'Você poderá colocar seus itens à venda por créditos. Haverá taxa de transação pequena.' },
        { id: 23, title: 'Sistema de Histórico de compra e venda', content: 'É possível verificar todo o histórico de compra e venda de itens.' },
        { id: 24, title: 'Recursos avançados planejados', content: 'Leilões ao vivo, ofertas automáticas, alertas de preço, gráficos de histórico de valor, sistema de troca direta entre jogadores, iens únicos e raros terão seções especiais de destaque, sistema de avaliação de vendedores.' }
      ]
    }
  ]

  const filteredSections = sections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.articles.length > 0)

  const currentSection = sections.find(s => s.key === activeSection) || sections[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/Dropa!.png"
                alt="Dropa!"
                width={120}
                height={60}
                className="drop-shadow-lg filter drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                priority
              />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🏠 Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">📚 Central de Ajuda</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Encontre respostas para suas dúvidas sobre o Dropa! e aprenda a aproveitar ao máximo nossa plataforma.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Busque por palavras-chave ou tópicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-300">
                Mostrando resultados para: <span className="text-purple-300 font-semibold">"{searchTerm}"</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-4">
                <h3 className="text-xl font-bold text-white mb-4">📖 Tópicos</h3>
                <nav className="space-y-2">
                  {(searchTerm ? filteredSections : sections).map(section => (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                        activeSection === section.key
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/30'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{section.icon}</span>
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-400">{section.articles.length} artigos</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-4xl">{currentSection.icon}</span>
                  <h2 className="text-3xl font-bold text-white">{currentSection.title}</h2>
                </div>

                <div className="space-y-6">
                  {currentSection.articles.map(article => (
                    <div
                      key={article.id}
                      className="bg-black/20 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                        <span className="text-purple-400 mr-2">❓</span>
                        {article.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{article.content}</p>
                    </div>
                  ))}
                </div>

                {searchTerm && currentSection.articles.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-gray-300 mb-6">
                      Não encontramos artigos relacionados a "{searchTerm}". Tente termos diferentes.
                    </p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-200"
                    >
                      🔄 Limpar Busca
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Support */}
              <div className="mt-8 bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <div className="text-center">
                  <div className="text-5xl mb-4">💬</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Não encontrou o que precisa?</h3>
                  <p className="text-gray-300 mb-6">
                    Nossa equipe de suporte está pronta para ajudar você com qualquer dúvida específica.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                      href="/contato"
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      📧 Entrar em Contato
                    </Link>
                    <Link
                      href="/dashboard"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      🎮 Voltar ao Jogo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link href="/como-funciona" className="group bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-3 group-hover:animate-bounce">📚</div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Como Funciona</h3>
              <p className="text-gray-300 text-sm">Guia completo do sistema Dropa!</p>
            </Link>

            <Link href="/contato" className="group bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-3 group-hover:animate-bounce">📞</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Contato</h3>
              <p className="text-gray-300 text-sm">Fale diretamente conosco</p>
            </Link>

            <Link href="/marketplace" className="group bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-3 group-hover:animate-bounce">🛒</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">Marketplace</h3>
              <p className="text-gray-300 text-sm">Compre e venda itens</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
