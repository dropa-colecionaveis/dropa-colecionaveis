'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Contato() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    priority: 'normal'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const categories = [
    { value: 'suporte-tecnico', label: '🔧 Suporte Técnico', description: 'Problemas com login, pacotes, inventário' },
    { value: 'pagamentos', label: '💳 Pagamentos', description: 'Questões sobre créditos, PIX, reembolsos' },
    { value: 'itens-perdidos', label: '📦 Itens Perdidos', description: 'Item não apareceu, erro ao abrir pacote' },
    { value: 'sugestoes', label: '💡 Sugestões', description: 'Ideias para melhorar a plataforma' },
    { value: 'parcerias', label: '🤝 Parcerias', description: 'Propostas comerciais, colaborações' },
    { value: 'outros', label: '❓ Outros', description: 'Dúvidas gerais ou outros assuntos' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simular envio do formulário
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <div className="text-6xl mb-6 animate-bounce">✅</div>
          <h2 className="text-2xl font-bold text-white mb-4">Mensagem Enviada!</h2>
          <p className="text-gray-300 mb-6">
            Recebemos sua mensagem e entraremos em contato em breve. 
            Tempo médio de resposta: <span className="text-green-400 font-semibold">24 horas</span>.
          </p>
          <div className="flex flex-col space-y-3">
            <Link
              href="/suporte"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-200"
            >
              📚 Acessar Central de Ajuda
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-200"
            >
              🏠 Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
                href="/suporte"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                📚 Central de Ajuda
              </Link>
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
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">📞 Fale Conosco</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Nossa equipe está pronta para ajudar! Envie sua mensagem e retornaremos em até 24 horas.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-4">
                <h3 className="text-xl font-bold text-white mb-6">📋 Informações de Contato</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
                    <span className="text-2xl">📧</span>
                    <div>
                      <div className="text-white font-medium">Email</div>
                      <div className="text-gray-300 text-sm">suporte@dropa.com</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <div className="text-white font-medium">Horário</div>
                      <div className="text-gray-300 text-sm">24/7 via formulário</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="text-white font-medium">Resposta</div>
                      <div className="text-gray-300 text-sm">Até 24 horas</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30">
                  <div className="text-blue-400 font-bold mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Dica
                  </div>
                  <p className="text-gray-300 text-sm">
                    Antes de entrar em contato, verifique nossa <Link href="/suporte" className="text-blue-400 hover:text-blue-300 underline">Central de Ajuda</Link> - sua dúvida pode já ter resposta lá!
                  </p>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30">
                  <div className="text-green-400 font-bold mb-2 flex items-center">
                    <span className="mr-2">🚨</span>
                    Emergência
                  </div>
                  <p className="text-gray-300 text-sm">
                    Para problemas urgentes com pagamentos ou itens perdidos, marque como "Alta Prioridade" no formulário.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">📝 Enviar Mensagem</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-white font-medium mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-white font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label htmlFor="category" className="block text-white font-medium mb-2">
                      Categoria *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {formData.category && (
                      <p className="mt-2 text-sm text-gray-400">
                        {categories.find(c => c.value === formData.category)?.description}
                      </p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Prioridade
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'baixa', label: '🟢 Baixa', desc: 'Dúvida geral' },
                        { value: 'normal', label: '🟡 Normal', desc: 'Problema comum' },
                        { value: 'alta', label: '🔴 Alta', desc: 'Urgente' }
                      ].map(priority => (
                        <label key={priority.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="priority"
                            value={priority.value}
                            checked={formData.priority === priority.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                            formData.priority === priority.value
                              ? 'border-purple-400/50 bg-purple-600/20'
                              : 'border-white/20 bg-black/20 hover:border-white/30'
                          }`}>
                            <div className="font-medium text-white text-sm">{priority.label}</div>
                            <div className="text-xs text-gray-400">{priority.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-white font-medium mb-2">
                      Assunto *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                      placeholder="Resumo do seu problema ou dúvida"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-white font-medium mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 resize-none"
                      placeholder="Descreva detalhadamente seu problema, incluindo passos que levaram ao erro, mensagens de erro, horário que ocorreu, etc. Quanto mais informações, melhor poderemos ajudar!"
                    />
                    <div className="mt-2 text-right text-sm text-gray-400">
                      {formData.message.length}/1000 caracteres
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 px-8 py-4 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        isSubmitting
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl'
                      } text-white`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span>
                          Enviando...
                        </span>
                      ) : (
                        '📧 Enviar Mensagem'
                      )}
                    </button>
                    
                    <Link
                      href="/suporte"
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 text-center"
                    >
                      📚 Central de Ajuda
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* FAQ Quick Access */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">❓ Perguntas Frequentes</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '💳', title: 'Não recebi meus créditos', desc: 'PIX pode demorar até 5 minutos' },
                { icon: '📦', title: 'Erro ao abrir pacote', desc: 'Verifique conexão e créditos' },
                { icon: '🎒', title: 'Item não apareceu', desc: 'Aguarde até 30 segundos' },
                { icon: '🔒', title: 'Problemas de login', desc: 'Use "Esqueci minha senha"' },
                { icon: '💰', title: 'Como comprar créditos', desc: 'Acesse "Comprar Créditos"' },
                { icon: '🏆', title: 'Conquistas não apareceram', desc: 'Algumas são secretas' }
              ].map((faq, index) => (
                <div key={index} className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
                  <div className="text-3xl mb-2">{faq.icon}</div>
                  <h3 className="text-white font-bold text-sm mb-1">{faq.title}</h3>
                  <p className="text-gray-400 text-xs">{faq.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}