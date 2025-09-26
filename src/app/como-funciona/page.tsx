'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

export default function ComoFunciona() {
  const [activeTab, setActiveTab] = useState('visao-geral')

  // Dados das probabilidades dos pacotes
  const packData = [
    {
      name: 'Bronze',
      price: 25,
      emoji: '🥉',
      color: 'from-amber-600 to-yellow-600',
      borderColor: 'border-amber-500',
      probabilities: [
        { rarity: 'COMUM', percentage: 60, color: 'text-gray-400' },
        { rarity: 'INCOMUM', percentage: 25, color: 'text-green-400' },
        { rarity: 'RARO', percentage: 10, color: 'text-blue-400' },
        { rarity: 'ÉPICO', percentage: 4, color: 'text-purple-400' },
        { rarity: 'LENDÁRIO', percentage: 1, color: 'text-yellow-400' }
      ]
    },
    {
      name: 'Prata',
      price: 35,
      emoji: '🥈',
      color: 'from-gray-600 to-slate-600',
      borderColor: 'border-gray-500',
      probabilities: [
        { rarity: 'COMUM', percentage: 48, color: 'text-gray-400' },
        { rarity: 'INCOMUM', percentage: 30, color: 'text-green-400' },
        { rarity: 'RARO', percentage: 15, color: 'text-blue-400' },
        { rarity: 'ÉPICO', percentage: 6, color: 'text-purple-400' },
        { rarity: 'LENDÁRIO', percentage: 1, color: 'text-yellow-400' }
      ]
    },
    {
      name: 'Ouro',
      price: 45,
      emoji: '🥇',
      color: 'from-yellow-600 to-orange-600',
      borderColor: 'border-yellow-500',
      probabilities: [
        { rarity: 'COMUM', percentage: 35, color: 'text-gray-400' },
        { rarity: 'INCOMUM', percentage: 32, color: 'text-green-400' },
        { rarity: 'RARO', percentage: 20, color: 'text-blue-400' },
        { rarity: 'ÉPICO', percentage: 10, color: 'text-purple-400' },
        { rarity: 'LENDÁRIO', percentage: 3, color: 'text-yellow-400' }
      ]
    },
    {
      name: 'Platina',
      price: 75,
      emoji: '💎',
      color: 'from-slate-600 to-zinc-600',
      borderColor: 'border-slate-500',
      probabilities: [
        { rarity: 'COMUM', percentage: 20, color: 'text-gray-400' },
        { rarity: 'INCOMUM', percentage: 30, color: 'text-green-400' },
        { rarity: 'RARO', percentage: 28, color: 'text-blue-400' },
        { rarity: 'ÉPICO', percentage: 15, color: 'text-purple-400' },
        { rarity: 'LENDÁRIO', percentage: 7, color: 'text-yellow-400' }
      ]
    },
    {
      name: 'Diamante',
      price: 95,
      emoji: '💠',
      color: 'from-cyan-600 to-blue-700',
      borderColor: 'border-cyan-500',
      probabilities: [
        { rarity: 'COMUM', percentage: 12, color: 'text-gray-400' },
        { rarity: 'INCOMUM', percentage: 20, color: 'text-green-400' },
        { rarity: 'RARO', percentage: 28, color: 'text-blue-400' },
        { rarity: 'ÉPICO', percentage: 30, color: 'text-purple-400' },
        { rarity: 'LENDÁRIO', percentage: 10, color: 'text-yellow-400' }
      ]
    }
  ]

  const scarcityLevels = [
    {
      name: 'COMMON',
      emoji: '⚪',
      penalty: 0,
      description: 'Nenhuma penalidade - chance normal de aparecer',
      color: 'text-gray-300'
    },
    {
      name: 'UNCOMMON',
      emoji: '🟢',
      penalty: 10,
      description: '10% menos chance de aparecer nos pacotes',
      color: 'text-green-300'
    },
    {
      name: 'RARE',
      emoji: '🔵',
      penalty: 20,
      description: '20% menos chance - itens mais difíceis de conseguir',
      color: 'text-blue-300'
    },
    {
      name: 'LEGENDARY',
      emoji: '🟡',
      penalty: 40,
      description: '40% menos chance - muito raros mesmo dentro da raridade',
      color: 'text-yellow-300'
    },
    {
      name: 'MYTHIC',
      emoji: '🔴',
      penalty: 50,
      description: '50% menos chance - extremamente difíceis de obter',
      color: 'text-red-300'
    },
    {
      name: 'UNIQUE',
      emoji: '🌟',
      penalty: 60,
      description: '60% menos chance + apenas 1 exemplar mundial',
      color: 'text-pink-300'
    }
  ]

  const tabs = [
    { id: 'visao-geral', label: '📖 Visão Geral', emoji: '🎯' },
    { id: 'raridades', label: '💎 Raridades & Escassez', emoji: '⚖️' },
    { id: 'pacotes', label: '📦 Tipos de Pacotes', emoji: '🎁' },
    { id: 'pacotes-gratis', label: '🎁 Pacotes Grátis', emoji: '🆓' },
    { id: 'niveis-xp', label: '⭐ Níveis XP & Conquistas', emoji: '🏆' },
    { id: 'genesis', label: '🌟 Genesis Collection', emoji: '👑' },
    { id: 'dicas', label: '💡 Dicas & Estratégias', emoji: '🧠' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/Dropa!.png" alt="Dropa!" width={100} height={50} />
              </Link>
              <div className="hidden sm:block text-gray-300">
                <span className="text-purple-400">•</span> Central de Informações
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ← Voltar ao Início
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 mb-4">
            📚 Como Funciona o Dropa!
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Entenda todos os detalhes do sistema de colecionáveis mais avançado e transparente do mercado.
            <span className="text-purple-400 font-semibold"> Nós não escondemos nada de você!</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-4 mb-8 border border-white/10">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-1">{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-6xl mx-auto">
          {/* Visão Geral */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">🎯</span>
                  O Que É o Dropa!?
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      O <span className="text-purple-400 font-semibold">Dropa!</span> é uma plataforma revolucionária de
                      colecionáveis digitais que combina a emoção de abrir pacotes com um sistema de escassez real e transparente.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      Diferente de outras plataformas, aqui você tem <span className="text-blue-400 font-semibold">transparência total</span>
                      sobre probabilidades, escassez e o funcionamento do sistema.
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-yellow-400 mb-3">🌟 Diferenciais Únicos</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• <span className="text-pink-400">Itens únicos mundiais</span> (apenas 1 exemplar)</li>
                      <li>• <span className="text-purple-400">Sistema duplo</span> raridade + escassez</li>
                      <li>• <span className="text-blue-400">Transparência total</span> das probabilidades</li>
                      <li>• <span className="text-green-400">Escassez real</span> com fornecimento limitado</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fluxo do Usuário */}
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">🚀</span>
                  Como Começar (Passo a Passo)
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-black/30 rounded-xl p-6 text-center">
                    <div className="text-5xl mb-4">1️⃣</div>
                    <h3 className="text-xl font-bold text-green-400 mb-3">Criar Conta</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Cadastre-se gratuitamente com email ou Google.
                      <span className="text-green-400 font-semibold"> Primeiro login ganha pacote grátis!</span>
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6 text-center">
                    <div className="text-5xl mb-4">2️⃣</div>
                    <h3 className="text-xl font-bold text-blue-400 mb-3">Comprar Créditos</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Use PIX para comprar créditos (moeda da plataforma).
                      <span className="text-blue-400 font-semibold"> Várias opções de pacotes!</span>
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6 text-center">
                    <div className="text-5xl mb-4">3️⃣</div>
                    <h3 className="text-xl font-bold text-purple-400 mb-3">Abrir Pacotes</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Escolha seu pacote, cruze os dedos e descubra que tesouro você vai encontrar!
                      <span className="text-purple-400 font-semibold"> Pode ser um único mundial!</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Raridades & Escassez */}
          {activeTab === 'raridades' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">⚖️</span>
                  Sistema Duplo: Raridade + Escassez
                </h2>

                <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-xl p-6 mb-8 border border-red-500/20">
                  <h3 className="text-xl font-bold text-red-400 mb-3">🚨 ATENÇÃO: Sistema Revolucionário</h3>
                  <p className="text-gray-300 leading-relaxed">
                    O Dropa! é <span className="text-yellow-400 font-bold">diferente de qualquer outra plataforma</span>.
                    Nós temos um <span className="text-purple-400 font-semibold">sistema duplo</span> que combina
                    <span className="text-blue-400 font-semibold"> raridade tradicional</span> com
                    <span className="text-pink-400 font-semibold"> níveis de escassez real</span>.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Raridades */}
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-4">💎 RARIDADES (Cores dos Itens)</h3>
                    <p className="text-gray-300 mb-4 text-sm">
                      A raridade determina a <span className="text-blue-400 font-semibold">cor do item</span> e as
                      <span className="text-purple-400 font-semibold"> chances básicas dos pacotes</span>:
                    </p>
                    <div className="space-y-3">
                      <div className="bg-gray-600/20 rounded-lg p-4 border border-gray-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">⚪</span>
                            <span className="text-gray-300 font-semibold">COMUM</span>
                          </div>
                          <span className="text-green-400 text-sm">5 créditos</span>
                        </div>
                      </div>
                      <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🟢</span>
                            <span className="text-green-300 font-semibold">INCOMUM</span>
                          </div>
                          <span className="text-green-400 text-sm">15 créditos</span>
                        </div>
                      </div>
                      <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🔵</span>
                            <span className="text-blue-300 font-semibold">RARO</span>
                          </div>
                          <span className="text-green-400 text-sm">40 créditos</span>
                        </div>
                      </div>
                      <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🟣</span>
                            <span className="text-purple-300 font-semibold">ÉPICO</span>
                          </div>
                          <span className="text-green-400 text-sm">100 créditos</span>
                        </div>
                      </div>
                      <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🟡</span>
                            <span className="text-yellow-300 font-semibold">LENDÁRIO</span>
                          </div>
                          <span className="text-green-400 text-sm">500 créditos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escassez */}
                  <div>
                    <h3 className="text-2xl font-bold text-pink-400 mb-4">🎯 ESCASSEZ (Modificadores)</h3>
                    <p className="text-gray-300 mb-4 text-sm">
                      A escassez <span className="text-pink-400 font-semibold">modifica as chances</span> dentro da mesma raridade.
                      Quanto maior a escassez, <span className="text-red-400 font-semibold">menor a chance</span> de aparecer:
                    </p>
                    <div className="space-y-3">
                      {scarcityLevels.map((level) => (
                        <div key={level.name} className={`bg-black/30 rounded-lg p-4 border border-white/10`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{level.emoji}</span>
                              <span className={`${level.color} font-semibold text-sm`}>{level.name}</span>
                            </div>
                            <span className={`text-sm font-bold ${level.penalty > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {level.penalty > 0 ? `-${level.penalty}%` : '0%'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">{level.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multiplicadores de Valor */}
                <div className="mt-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-500/20">
                  <h3 className="text-xl font-bold text-green-400 mb-4">💰 Sistema de Multiplicadores de Valor</h3>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                    O valor de cada item é calculado usando <span className="text-green-400 font-semibold">valor base da raridade</span> multiplicado por
                    <span className="text-blue-400 font-semibold"> multiplicadores de escassez</span>, criando uma economia realista onde
                    <span className="text-yellow-400 font-semibold"> escassez = valor</span>.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-3">💎 Valores Base por Raridade</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">⚪ COMUM:</span>
                          <span className="text-green-400 font-bold">5 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">🟢 INCOMUM:</span>
                          <span className="text-green-400 font-bold">15 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">🔵 RARO:</span>
                          <span className="text-green-400 font-bold">40 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">🟣 ÉPICO:</span>
                          <span className="text-green-400 font-bold">100 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-300">🟡 LENDÁRIO:</span>
                          <span className="text-green-400 font-bold">500 créditos</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-purple-400 font-semibold mb-3">⚡ Multiplicadores de Escassez</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">COMMON:</span>
                          <span className="text-white font-bold">1.0x (base)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">UNCOMMON:</span>
                          <span className="text-green-400 font-bold">1.2x (+20%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">RARE:</span>
                          <span className="text-blue-400 font-bold">1.4x (+40%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-300">LEGENDARY:</span>
                          <span className="text-yellow-400 font-bold">2.0x (+100%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-300">MYTHIC:</span>
                          <span className="text-red-400 font-bold">2.5x (+150%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pink-300">UNIQUE:</span>
                          <span className="text-pink-400 font-bold">3.0x (+200%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-4 border border-yellow-500/30">
                    <h4 className="text-yellow-400 font-semibold mb-2">🌟 Bônus Especiais:</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">👑 Itens Únicos:</span>
                        <span className="text-pink-400 font-bold">+50% adicional</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">🎫 Edições Limitadas:</span>
                        <span className="text-blue-400 font-bold">+30% adicional</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exemplo Prático */}
                <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/20">
                  <h3 className="text-xl font-bold text-blue-400 mb-4">💡 Exemplos Práticos de Valor</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-purple-400 font-semibold mb-2">📦 Mesmo Item, Escassez Diferente</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Item A: Comum/COMMON</span>
                          <span className="text-green-400">5 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Item B: Comum/UNCOMMON</span>
                          <span className="text-blue-400">6 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Item C: Comum/UNIQUE 👑</span>
                          <span className="text-pink-400">23 créditos</span>
                        </div>
                      </div>
                      <p className="text-yellow-400 text-xs mt-2">
                        * Item C é único = 5 × 3.0 × 1.5 = 23 créditos
                      </p>
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-green-400 font-semibold mb-2">🏆 Top Valores da Plataforma</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-pink-300">Lendário/UNIQUE 👑</span>
                          <span className="text-pink-400 font-bold">2.250 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-300">Lendário/MYTHIC 🎫</span>
                          <span className="text-red-400 font-bold">1.625 créditos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Épico/MYTHIC 🎫</span>
                          <span className="text-purple-400 font-bold">325 créditos</span>
                        </div>
                      </div>
                      <p className="text-cyan-400 text-xs mt-2">
                        👑 = Único | 🎫 = Limitado 1000 exemplares
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-500/30">
                    <p className="text-orange-400 text-sm text-center">
                      💡 <span className="font-semibold">Sistema Balanceado:</span> Escassez impacta diretamente no valor, 
                      criando uma economia onde <span className="text-yellow-400 font-bold">raridade = valor real</span>!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tipos de Pacotes */}
          {activeTab === 'pacotes' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">📦</span>
                  Tipos de Pacotes & Probabilidades
                </h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Cada pacote tem probabilidades diferentes. Pacotes mais caros têm
                  <span className="text-green-400 font-semibold"> maiores chances de itens raros</span>,
                  mas mesmo o Bronze pode conter <span className="text-pink-400 font-semibold">itens únicos mundiais</span>!
                </p>

                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {packData.map((pack, index) => (
                    <div key={pack.name} className={`bg-gradient-to-br ${pack.color}/20 backdrop-blur-sm rounded-2xl p-6 border ${pack.borderColor}/30 hover:scale-105 transition-transform duration-300`}>
                      <div className="text-center mb-6">
                        <div className="text-5xl mb-2">{pack.emoji}</div>
                        <h3 className="text-2xl font-bold text-white">{pack.name}</h3>
                        <p className="text-green-400 font-bold text-xl">{pack.price} créditos</p>
                      </div>

                      <div className="space-y-3">
                        {pack.probabilities.map((prob) => (
                          <div key={prob.rarity} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                            <span className={`${prob.color} font-medium text-sm`}>{prob.rarity}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full bg-gradient-to-r ${pack.color}`}
                                  style={{ width: `${prob.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-bold text-sm min-w-[40px]">{prob.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-black/30 rounded-lg">
                        <p className="text-xs text-gray-400 leading-relaxed">
                          💡 <span className="text-yellow-400">Lembre-se:</span> Estas são as chances da
                          <span className="text-blue-400"> raridade</span>. A <span className="text-pink-400">escassez </span>
                          ainda modifica as chances dentro de cada raridade!
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comparativo */}
                <div className="mt-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">📊 Comparativo Rápido</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-green-400 font-semibold mb-2">💰 Melhor Custo-Benefício</h4>
                      <p className="text-amber-400 font-bold">🥉 Bronze</p>
                      <p className="text-gray-400 text-sm">25 créditos por tentativa</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-2">⚖️ Equilibrado</h4>
                      <p className="text-yellow-400 font-bold">🥇 Ouro</p>
                      <p className="text-gray-400 text-sm">Boa chance de raros por preço justo</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-purple-400 font-semibold mb-2">🎯 Máxima Chance</h4>
                      <p className="text-cyan-400 font-bold">💠 Diamante</p>
                      <p className="text-gray-400 text-sm">10% de chance de lendários</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pacotes Grátis */}
          {activeTab === 'pacotes-gratis' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">🎁</span>
                  Sistema de Pacotes Grátis
                </h2>

                {/* Como Funciona */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">🎯 Como Ganhar Pacotes Grátis</h3>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-center space-x-3">
                        <span className="text-green-400 text-xl">✅</span>
                        <span><span className="text-green-400 font-semibold">Primeiro login:</span> Pacote grátis garantido!</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-blue-400 text-xl">🔥</span>
                        <span><span className="text-blue-400 font-semibold">Streak dia 3:</span> Pacote Bronze grátis</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-purple-400 text-xl">⚡</span>
                        <span><span className="text-purple-400 font-semibold">Streak dia 5:</span> Pacote Prata grátis</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-yellow-400 text-xl">🏆</span>
                        <span><span className="text-yellow-400 font-semibold">Streak dia 7:</span> Pacote Ouro grátis</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">🔥 Sistema de Streaks Diários</h3>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
                        <h4 className="text-blue-400 font-semibold mb-2">Como Funciona o Streak</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Faça login todos os dias consecutivos</li>
                          <li>• Não perca um dia ou volta ao dia 1</li>
                          <li>• Multiplicadores de créditos são aplicados a cada 7 dias</li>
                          <li>• Ganhe créditos diários + pacotes especiais</li>
                        </ul>
                      </div>
                      <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-lg p-4 border border-red-500/30">
                        <h4 className="text-red-400 font-semibold mb-2">⚠️ Importante</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Apenas 2 formas de ganhar pacotes grátis</li>
                          <li>• Primeiro login (uma vez apenas)</li>
                          <li>• Streaks diários nos dias 3, 5 e 7</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recompensas Diárias Detalhadas */}
                <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-6 border border-orange-500/20 mb-8">
                  <h3 className="text-xl font-bold text-orange-400 mb-4">🔥 Sistema de Recompensas Diárias</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-green-400 font-semibold mb-3">💰 Recompensas por Dia de Streak</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-gray-700/30 rounded-lg p-2">
                          <span className="text-gray-300">Dias 1-2:</span>
                          <span className="text-green-400 font-semibold">5 créditos/dia</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-700/30 rounded-lg p-2">
                          <span className="text-gray-300">Dia 3:</span>
                          <span className="text-blue-400 font-semibold">Pacote Bronze</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-700/30 rounded-lg p-2">
                          <span className="text-gray-300">Dia 4:</span>
                          <span className="text-green-400 font-semibold">10 créditos</span>
                        </div>
                        <div className="flex justify-between items-center bg-purple-700/30 rounded-lg p-2">
                          <span className="text-gray-300">Dia 5:</span>
                          <span className="text-purple-400 font-semibold">Pacote Prata</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-700/30 rounded-lg p-2">
                          <span className="text-gray-300">Dia 6:</span>
                          <span className="text-green-400 font-semibold">20 créditos</span>
                        </div>
                        <div className="flex justify-between items-center bg-yellow-700/30 rounded-lg p-2">
                          <span className="text-gray-300">Dia 7:</span>
                          <span className="text-yellow-400 font-semibold">Pacote Ouro</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-purple-400 font-semibold mb-3">⚡ Multiplicadores de Streak</h4>
                      <div className="space-y-2">
                        <div className="bg-blue-700/20 rounded-lg p-3">
                          <div className="text-blue-400 font-semibold">Streak 8+ dias</div>
                          <div className="text-gray-300 text-sm">+8% bonus em créditos</div>
                        </div>
                        <div className="bg-purple-700/20 rounded-lg p-3">
                          <div className="text-purple-400 font-semibold">Streak 15+ dias</div>
                          <div className="text-gray-300 text-sm">+15% bonus em créditos</div>
                        </div>
                        <div className="bg-yellow-700/20 rounded-lg p-3">
                          <div className="text-yellow-400 font-semibold">Streak 31+ dias</div>
                          <div className="text-gray-300 text-sm">+25% bonus em créditos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ */}
                <div className="bg-black/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">❓ Perguntas Frequentes</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-1">P: O que acontece se eu perder um dia de streak?</h4>
                      <p className="text-gray-300">R: Seu streak volta para o dia 1 e você perde os multiplicadores de bonus.</p>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-1">P: O streak reseta automaticamente após 7 dias?</h4>
                      <p className="text-gray-300">R: Sim, o ciclo de recompensas se reinicia a cada 7 dias, mas os multiplicadores continuam.</p>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-1">P: Posso acumular pacotes grátis não reclamados?</h4>
                      <p className="text-gray-300">R: Não, você deve reclamar no dia da recompensa ou perde a oportunidade.</p>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-1">P: Existe alguma outra forma de ganhar pacotes grátis?</h4>
                      <p className="text-gray-300">R: Atualmente apenas no primeiro login e nos streaks diários (dias 3, 5 e 7).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Níveis XP & Conquistas */}
          {activeTab === 'niveis-xp' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 backdrop-blur-lg rounded-3xl p-8 border border-amber-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">⭐</span>
                  Sistema de Níveis XP & Conquistas
                </h2>

                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 mb-8 border border-blue-500/20">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">🎮 Como Funciona o Sistema de XP</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    O Dropa! possui um <span className="text-amber-400 font-bold">sistema de progressão baseado em Experience Points (XP)</span>.
                    Cada conquista desbloqueada te concede uma quantidade específica de XP, que determina seu
                    <span className="text-purple-400 font-semibold"> nível de jogador</span>.
                  </p>
                  <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
                    <h4 className="text-yellow-400 font-semibold mb-2">📐 Fórmula de Nível:</h4>
                    <p className="text-gray-300 text-sm font-mono">
                      Nível = √(XP Total ÷ 100) + 1
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mt-3 text-xs">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">Nível 1</div>
                        <div className="text-gray-400">0 XP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">Nível 5</div>
                        <div className="text-gray-400">1.600 XP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold">Nível 10</div>
                        <div className="text-gray-400">8.100 XP</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sistema de Conquistas */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">🏆 Tipos de Conquistas</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-blue-400 font-semibold mb-2">📍 MILESTONE (Marco)</h4>
                        <p className="text-gray-300 text-sm mb-2">Conquistas por ações importantes pela primeira vez</p>
                        <div className="text-xs text-gray-400">Ex: Primeira abertura de pacote (+5 XP)</div>
                      </div>
                      <div className="bg-green-900/20 rounded-lg p-4">
                        <h4 className="text-green-400 font-semibold mb-2">📊 PROGRESS (Progresso)</h4>
                        <p className="text-gray-300 text-sm mb-2">Conquistas baseadas em quantidades acumuladas</p>
                        <div className="text-xs text-gray-400">Ex: Abrir 100 pacotes (+100 XP)</div>
                      </div>
                      <div className="bg-purple-900/20 rounded-lg p-4">
                        <h4 className="text-purple-400 font-semibold mb-2">⭐ RARE (Raras)</h4>
                        <p className="text-gray-300 text-sm mb-2">Conquistas por feitos especiais ou difíceis</p>
                        <div className="text-xs text-gray-400">Ex: Primeiro item lendário (+100 XP)</div>
                      </div>
                      <div className="bg-yellow-900/20 rounded-lg p-4">
                        <h4 className="text-yellow-400 font-semibold mb-2">🔥 STREAK (Sequência)</h4>
                        <p className="text-gray-300 text-sm mb-2">Conquistas por atividades consecutivas</p>
                        <div className="text-xs text-gray-400">Ex: 7 dias consecutivos (+75 XP)</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-purple-400 mb-4">📋 Categorias de Conquistas</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-gray-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📦</span>
                          <span className="text-gray-300 font-medium">COLLECTOR</span>
                        </div>
                        <span className="text-blue-400 text-sm">Colecionador</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🎁</span>
                          <span className="text-gray-300 font-medium">EXPLORER</span>
                        </div>
                        <span className="text-green-400 text-sm">Explorador</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">💰</span>
                          <span className="text-gray-300 font-medium">TRADER</span>
                        </div>
                        <span className="text-yellow-400 text-sm">Comerciante</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🏅</span>
                          <span className="text-gray-300 font-medium">MILESTONE</span>
                        </div>
                        <span className="text-purple-400 text-sm">Marcos</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📅</span>
                          <span className="text-gray-300 font-medium">DAILY</span>
                        </div>
                        <span className="text-orange-400 text-sm">Diárias</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">✨</span>
                          <span className="text-gray-300 font-medium">SPECIAL</span>
                        </div>
                        <span className="text-pink-400 text-sm">Especiais</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ranking e Benefícios */}
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/20 mb-8">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">🏆 Rankings e Benefícios</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-pink-400 font-semibold mb-3">📊 Ranking TOTAL_XP</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Seu XP total determina sua posição no ranking global da plataforma. 
                        Quanto mais conquistas você desbloqueia, mais XP acumula e mais alto fica no ranking.
                      </p>
                      <div className="bg-black/20 rounded-lg p-3">
                        <div className="text-center">
                          <div className="text-2xl mb-2">👑</div>
                          <div className="text-yellow-400 font-bold text-sm">Prestígio na Comunidade</div>
                          <div className="text-gray-400 text-xs">Mostre seu progresso para outros jogadores</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-3">🎯 Validação Automática</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        O sistema possui validação automática que garante a consistência entre suas conquistas e XP total,
                        corrigindo automaticamente qualquer inconsistência.
                      </p>
                      <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                        <div className="text-center">
                          <div className="text-2xl mb-2">✅</div>
                          <div className="text-green-400 font-bold text-sm">Sistema Confiável</div>
                          <div className="text-gray-400 text-xs">XP sempre sincronizado com conquistas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Valores de XP */}
                <div className="bg-black/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-orange-400 mb-4">💎 Exemplos de XP por Conquista</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🎉</div>
                      <div className="text-green-400 font-bold">+5 XP</div>
                      <div className="text-gray-300 text-sm">Primeira abertura</div>
                    </div>
                    <div className="bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">📦</div>
                      <div className="text-blue-400 font-bold">+25 XP</div>
                      <div className="text-gray-300 text-sm">10 itens coletados</div>
                    </div>
                    <div className="bg-purple-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🔥</div>
                      <div className="text-purple-400 font-bold">+75 XP</div>
                      <div className="text-gray-300 text-sm">Streak de 7 dias</div>
                    </div>
                    <div className="bg-yellow-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">⭐</div>
                      <div className="text-yellow-400 font-bold">+100 XP</div>
                      <div className="text-gray-300 text-sm">Primeiro lendário</div>
                    </div>
                    <div className="bg-pink-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🍀</div>
                      <div className="text-pink-400 font-bold">+200 XP</div>
                      <div className="text-gray-300 text-sm">Sortudo de primeira</div>
                    </div>
                    <div className="bg-red-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🏆</div>
                      <div className="text-red-400 font-bold">+500 XP</div>
                      <div className="text-gray-300 text-sm">Conquistas secretas</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-500/30">
                    <p className="text-orange-400 text-sm text-center">
                      💡 <span className="font-semibold">Dica:</span> Conquistas mais raras e difíceis concedem mais XP. 
                      A conquista mais valiosa dá <span className="text-yellow-400 font-bold">2.000 XP</span> (365 dias consecutivos)!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Genesis Collection */}
          {activeTab === 'genesis' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-yellow-900/40 to-purple-900/40 backdrop-blur-lg rounded-3xl p-8 border border-yellow-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">🌟</span>
                  Genesis Collection - A Primeira Era
                </h2>

                <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-xl p-6 mb-8 border border-red-500/20">
                  <h3 className="text-xl font-bold text-red-400 mb-3">🚨 COLEÇÃO HISTÓRICA</h3>
                  <p className="text-gray-300 leading-relaxed">
                    A Genesis Collection é a <span className="text-yellow-400 font-bold">primeira coleção oficial</span> da plataforma
                    e marca o início da era dos colecionáveis digitais no Dropa!.
                    <span className="text-pink-400 font-semibold"> Quando esgotada, nunca mais será reabastecida</span>.
                  </p>
                </div>

                {/* Estatísticas */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-black/30 rounded-xl p-6 text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-2">110</h3>
                    <p className="text-gray-300 text-sm">Itens na Coleção</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6 text-center">
                    <div className="text-4xl mb-3">🌟</div>
                    <h3 className="text-2xl font-bold text-pink-400 mb-2">5</h3>
                    <p className="text-gray-300 text-sm">Itens Únicos Mundiais</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6 text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-2xl font-bold text-purple-400 mb-2">7</h3>
                    <p className="text-gray-300 text-sm">Níveis de Escassez</p>
                  </div>
                </div>

                {/* Distribuição */}
                <div className="bg-black/30 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">📈 Distribuição da Genesis Collection</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-green-400 font-semibold mb-3">Por Raridade</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">⚪ COMUM:</span>
                          <span className="text-green-400">45 itens (40.9%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">🟢 INCOMUM:</span>
                          <span className="text-green-400">30 itens (27.3%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">🔵 RARO:</span>
                          <span className="text-green-400">20 itens (18.2%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">🟣 ÉPICO:</span>
                          <span className="text-green-400">8 itens (7.3%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-300">🟡 LENDÁRIO:</span>
                          <span className="text-green-400">7 itens (6.4%)</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-pink-400 font-semibold mb-3">Por Escassez</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">COMMON:</span>
                          <span className="text-green-400">75 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">UNCOMMON:</span>
                          <span className="text-blue-400">16 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">RARE:</span>
                          <span className="text-purple-400">8 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-300">LEGENDARY:</span>
                          <span className="text-orange-400">5 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-300">MYTHIC:</span>
                          <span className="text-red-400">5 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pink-300">UNIQUE:</span>
                          <span className="text-pink-400">5 itens</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itens Limitados */}
                <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/20 mb-8">
                  <h3 className="text-xl font-bold text-blue-400 mb-4">🔢 Itens de Edição Limitada</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-300 mb-4 text-sm">
                        Além dos 5 itens únicos mundiais, a Genesis Collection possui <span className="text-blue-400 font-bold">5 itens especiais de edição limitada</span>.
                        Cada um terá exatamente <span className="text-cyan-400 font-semibold">1.000 unidades numeradas</span> disponíveis.
                        <br/><br/>
                        Estes 5 itens limitados possuem <span className="text-red-400 font-semibold">escassez MYTHIC</span>, tornando-os 
                        <span className="text-purple-400 font-semibold"> os mais raros e valiosos</span> além dos únicos.
                      </p>
                      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-4 border border-yellow-500/30">
                        <h4 className="text-yellow-400 font-semibold mb-2">📝 Características:</h4>
                        <ul className="text-gray-300 text-xs space-y-1">
                          <li>• Cada unidade possui número serial único (#001 a #1000)</li>
                          <li>• Uma vez esgotadas, nunca mais serão produzidas</li>
                          <li>• Valor de colecionador aumenta com a raridade</li>
                          <li>• Certificado de autenticidade digital</li>
                        </ul>
                      </div>
                      
                      <div className="mt-4 bg-gradient-to-r from-red-900/20 to-purple-900/20 rounded-lg p-4 border border-red-500/30">
                        <h4 className="text-red-400 font-semibold mb-2">💎 Valores dos Itens MYTHIC Limitados:</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-red-300">🔥 Lendário/MYTHIC:</span>
                            <span className="text-red-400 font-bold">1.625 créditos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300">🟣 Épico/MYTHIC:</span>
                            <span className="text-purple-400 font-bold">325 créditos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300">🔵 Raro/MYTHIC:</span>
                            <span className="text-blue-400 font-bold">130 créditos</span>
                          </div>
                        </div>
                        <div className="text-center mt-2 text-yellow-400 text-xs">
                          💡 <span className="font-semibold">Total:</span> 5 itens × 1.000 exemplares = 5.000 unidades
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-cyan-400 font-semibold mb-3 text-center">🎯 Status dos Itens Limitados</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-green-900/20 rounded-lg p-2">
                          <span className="text-gray-300">📦 Itens Limitados:</span>
                          <span className="text-green-400 font-bold">5 itens</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-900/20 rounded-lg p-2">
                          <span className="text-gray-300">🔢 Unidades por Item:</span>
                          <span className="text-blue-400 font-bold">1.000 cada</span>
                        </div>
                        <div className="flex justify-between items-center bg-purple-900/20 rounded-lg p-2">
                          <span className="text-gray-300">📊 Total Disponível:</span>
                          <span className="text-purple-400 font-bold">5.000 unidades</span>
                        </div>
                        <div className="flex justify-between items-center bg-red-900/20 rounded-lg p-2">
                          <span className="text-gray-300">✨ Escassez:</span>
                          <span className="text-red-400 font-bold">Todos MYTHIC</span>
                        </div>
                        <div className="flex justify-between items-center bg-yellow-900/20 rounded-lg p-2">
                          <span className="text-gray-300">🎪 Status:</span>
                          <span className="text-yellow-400 font-bold">Em produção</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Os 5 Únicos */}
                <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-6 border border-pink-500/20">
                  <h3 className="text-xl font-bold text-pink-400 mb-4">👑 Os 5 Itens Únicos Mundiais</h3>
                  <p className="text-gray-300 mb-6 text-sm">
                    Apenas <span className="text-pink-400 font-bold">1 pessoa no mundo</span> poderá possuir cada um destes itens.
                    Quando alguém os obtém, <span className="text-red-400 font-semibold">desaparecem permanentemente</span> do sistema.
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">💎</div>
                      <h4 className="text-yellow-400 font-semibold text-sm">Cristal do Gênesis</h4>
                      <p className="text-pink-400 text-xs font-bold">2.250 créditos</p>
                      <p className="text-gray-400 text-xs">LENDÁRIO/UNIQUE 👑</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">👑</div>
                      <h4 className="text-purple-400 font-semibold text-sm">Coroa Primordial</h4>
                      <p className="text-pink-400 text-xs font-bold">2.250 créditos</p>
                      <p className="text-gray-400 text-xs">LENDÁRIO/UNIQUE 👑</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🌟</div>
                      <h4 className="text-blue-400 font-semibold text-sm">Essência da Origem</h4>
                      <p className="text-pink-400 text-xs font-bold">2.250 créditos</p>
                      <p className="text-gray-400 text-xs">LENDÁRIO/UNIQUE 👑</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🗝️</div>
                      <h4 className="text-indigo-400 font-semibold text-sm">Chave do Cosmos</h4>
                      <p className="text-pink-400 text-xs font-bold">2.250 créditos</p>
                      <p className="text-gray-400 text-xs">LENDÁRIO/UNIQUE 👑</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🔥</div>
                      <h4 className="text-red-400 font-semibold text-sm">Alma do Primeiro</h4>
                      <p className="text-pink-400 text-xs font-bold">2.250 créditos</p>
                      <p className="text-gray-400 text-xs">LENDÁRIO/UNIQUE 👑</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dicas & Estratégias */}
          {activeTab === 'dicas' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-lg rounded-3xl p-8 border border-indigo-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  <span className="text-4xl mr-3">🧠</span>
                  Dicas & Estratégias Avançadas
                </h2>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Estratégias de Pacotes */}
                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-400 mb-4">📦 Estratégias de Pacotes</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-green-400 font-semibold mb-2">🎯 Para Iniciantes</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Comece com pacotes Bronze para entender o sistema</li>
                          <li>• Foque na quantidade inicial para formar base</li>
                          <li>• Não ignore os pacotes grátis diários</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-purple-400 font-semibold mb-2">💎 Para Colecionadores</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Alterne entre Ouro e Diamante</li>
                          <li>• Foque em completar coleções específicas</li>
                          <li>• Monitore a escassez dos itens que quer</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-yellow-400 font-semibold mb-2">🏆 Para Hunters de Únicos</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Maximize quantidade de tentativas</li>
                          <li>• Diversifique tipos de pacotes</li>
                          <li>• Acompanhe quais únicos ainda existem</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Gestão de Recursos */}
                  <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">💰 Gestão de Créditos</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-blue-400 font-semibold mb-2">📊 Orçamento Semanal</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Defina quanto pode gastar por semana</li>
                          <li>• Reserve 30% para oportunidades especiais</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-yellow-400 font-semibold mb-2">🎯 ROI (Retorno)</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Bronze: Melhor custo-benefício geral</li>
                          <li>• Ouro: Equilibrio ideal para maioria</li>
                          <li>• Diamante: Para caçadores de épicos/lendários</li>
                        </ul>
                      </div>
                      <div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Dicas Avançadas */}
                <div className="mt-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">🔮 Dicas Avançadas</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-2">⏰ Timing</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Sistemas são sempre justos</li>
                        <li>• Não há "horário da sorte"</li>
                        <li>• Cada abertura é independente</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-orange-400 font-semibold mb-2">📈 Longo Prazo</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Probabilidades se equilibram com tempo</li>
                        <li>• Itens raros valorizam mais</li>
                        <li>• Paciência é recompensada</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-pink-400 font-semibold mb-2">🎪 Mentalidade</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Diversão vem primeiro</li>
                        <li>• Celebre pequenas vitórias</li>
                        <li>• Conecte-se com a comunidade</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Calculadora Simples */}
                <div className="mt-8 bg-black/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">🧮 Calculadora de Chances</h3>
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4">
                    <p className="text-gray-300 text-sm mb-4">
                      <span className="text-yellow-400 font-semibold">Exemplo:</span> Para ter ~63% de chance de pegar pelo menos 1 lendário:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-amber-400 font-bold">Bronze (1%)</div>
                        <div className="text-gray-300">~100 pacotes</div>
                        <div className="text-green-400">2.500 créditos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">Ouro (3%)</div>
                        <div className="text-gray-300">~33 pacotes</div>
                        <div className="text-green-400">1.485 créditos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-cyan-400 font-bold">Diamante (10%)</div>
                        <div className="text-gray-300">~10 pacotes</div>
                        <div className="text-green-400">950 créditos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Pronto para Começar?</h3>
            <p className="text-gray-300 mb-6">
              Agora que você entende como tudo funciona, é hora de entrar na aventura e começar sua coleção!
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/auth/signup"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                ⚡ Criar Conta Grátis
              </Link>
              <Link
                href="/auth/signin"
                className="px-8 py-3 border-2 border-purple-400 text-purple-300 hover:bg-purple-600 hover:text-white font-bold rounded-xl transition-all duration-300"
              >
                🔑 Já Tenho Conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
