'use client'

import { useState, useEffect } from 'react'

interface AutoSellConfig {
  sellCommon: boolean
  sellUncommon: boolean
  sellRare: boolean
  sellEpic: boolean
  sellLegendary: boolean
  keepQuantity: number
  sellLimitedEd: boolean
}

// Fixed selling percentages by rarity (cannot be changed by users)
// Sistema Equilibrado - reduz regressividade e torna mais justo para itens raros
const FIXED_SELLING_PERCENTAGES = {
  COMUM: 35,      // 35% de 5 créditos = 1.75 → 2 créditos (perda 60%)
  INCOMUM: 40,    // 40% de 15 créditos = 6 créditos (perda 60%)
  RARO: 45,       // 45% de 40 créditos = 18 créditos (perda 55%)
  EPICO: 50,      // 50% de 100 créditos = 50 créditos (perda 50%)
  LENDARIO: 55    // 55% de 500 créditos = 275 créditos (perda 45%)
} as const


interface AutoSellPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function AutoSellPanel({ isOpen, onClose }: AutoSellPanelProps) {
  const [config, setConfig] = useState<AutoSellConfig>({
    sellCommon: true,
    sellUncommon: true,
    sellRare: false,
    sellEpic: false,
    sellLegendary: false,
    keepQuantity: 1,
    sellLimitedEd: false
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
      setSaleCompleted(false) // Reset ao abrir o modal
    }
  }, [isOpen])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/user/auto-sell/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Error fetching auto-sell config:', error)
    }
  }

  const handleClose = () => {
    // Se uma venda foi concluída, atualizar a página para refletir as mudanças no inventário
    if (saleCompleted) {
      window.location.reload()
    } else {
      onClose()
    }
  }


  const saveConfig = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user/auto-sell/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setMessage('✅ Configurações salvas com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(`❌ Erro: ${error.error}`)
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error saving auto-sell config:', error)
      setMessage('❌ Erro ao salvar configurações')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  const getPreview = async () => {
    try {
      setLoadingPreview(true)
      const response = await fetch('/api/user/auto-sell/preview', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
        if (data.totalItems > 0) {
          setShowConfirmation(true)
        } else {
          setMessage(`ℹ️ ${data.message}`)
          setTimeout(() => setMessage(''), 5000)
        }
      } else {
        setMessage('❌ Erro ao obter prévia dos itens')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error getting preview:', error)
      setMessage('❌ Erro ao obter prévia dos itens')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoadingPreview(false)
    }
  }

  const processNow = async () => {
    try {
      setProcessing(true)
      const response = await fetch('/api/user/auto-sell/process', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(`✅ Venda concluída! ${data.message} - Fechando modal...`)
        setShowConfirmation(false)
        setPreviewData(null)
        setSaleCompleted(true) // Marcar que a venda foi concluída
        
        // Fechar o modal automaticamente após 2 segundos e atualizar a página
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage('❌ Erro ao processar venda automática')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error processing auto-sell:', error)
      setMessage('❌ Erro ao processar venda automática')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setProcessing(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-gray-400'
      case 'INCOMUM': return 'text-green-400'
      case 'RARO': return 'text-blue-400'
      case 'EPICO': return 'text-purple-400'
      case 'LENDARIO': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">🤖 Venda em Lote</h2>
              <p className="text-gray-300">Configure a venda em lote dos seus itens (acionamento manual)</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`${saleCompleted ? 'bg-green-500/20 border-green-500/30' : 'bg-blue-500/20 border-blue-500/30'} border rounded-lg p-3 mb-6`}>
              <div className={`${saleCompleted ? 'text-green-400' : 'text-blue-400'} text-sm`}>{message}</div>
            </div>
          )}


          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">

              {/* Rarity Settings */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">💎 Configurações por Raridade</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Os percentuais de venda são fixos pelo sistema e não podem ser alterados
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'Common', rarity: 'COMUM', sell: 'sellCommon', baseValue: 5 },
                    { key: 'Uncommon', rarity: 'INCOMUM', sell: 'sellUncommon', baseValue: 15 },
                    { key: 'Rare', rarity: 'RARO', sell: 'sellRare', baseValue: 40 },
                    { key: 'Epic', rarity: 'EPICO', sell: 'sellEpic', baseValue: 100 },
                    { key: 'Legendary', rarity: 'LENDARIO', sell: 'sellLegendary', baseValue: 500 }
                  ].map(({ key, rarity, sell, baseValue }) => {
                    const percentage = FIXED_SELLING_PERCENTAGES[rarity as keyof typeof FIXED_SELLING_PERCENTAGES]
                    const calculatedValue = baseValue * percentage / 100
                    const sellValue = Math.ceil(calculatedValue) // Arredondar para cima como no cálculo real
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config[sell as keyof AutoSellConfig] as boolean}
                            onChange={(e) => setConfig({ ...config, [sell]: e.target.checked })}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className={`font-semibold ${getRarityColor(rarity)}`}>
                            {rarity}
                          </span>
                        </label>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-300">
                            Valor Base: <span className="text-white font-semibold">{baseValue} créditos</span>
                          </span>
                          <span className="text-gray-300">
                            Percentual: <span className="text-purple-400 font-semibold">{percentage}%</span>
                          </span>
                          <span className="text-gray-300">
                            Venda: <span className="text-green-400 font-semibold">{sellValue} créditos</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Protection Settings */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">🛡️ Proteção de Coleções</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      <span className="flex items-center space-x-2">
                        <span>🔒</span>
                        <span>Manter Quantidade por Tipo</span>
                      </span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.keepQuantity}
                        onChange={(e) => {
                          const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                          setConfig({ ...config, keepQuantity: value })
                        }}
                        className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                      />
                      <span className="text-gray-300 text-sm">item(ns) de cada tipo</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      ✅ Protege suas coleções mantendo sempre pelo menos esta quantidade de cada item
                    </p>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={config.sellLimitedEd}
                        onChange={(e) => setConfig({ ...config, sellLimitedEd: e.target.checked })}
                        className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500 mt-1"
                      />
                      <div>
                        <span className="text-yellow-400 font-semibold text-sm">🏆 Vender Edições Limitadas</span>
                        <p className="text-xs text-gray-400 mt-1">
                          ⚠️ Edições limitadas são únicas e numeradas. Uma vez vendidas, você pode não conseguir outra igual.
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <h5 className="text-green-400 font-semibold text-sm mb-2 flex items-center">
                      <span className="mr-2">💡</span>
                      Dicas de Proteção
                    </h5>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Manter 2-3 itens garante melhor proteção para coleções completas</li>
                      <li>• Edições limitadas são desabilitadas por padrão (recomendado)</li>
                      <li>• Você pode proteger itens específicos individualmente no inventário</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">

              {/* Action Buttons */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">⚡ Ações</h4>
                <div className="space-y-3">
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
                  </button>
                  
                  <button
                    onClick={getPreview}
                    disabled={loadingPreview}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {loadingPreview ? '🔍 Analisando...' : '🔍 Ver Itens para Vender'}
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">💡 Dicas</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Os percentuais são fixos pelo sistema e já otimizados</li>
                  <li>• Comece vendendo apenas itens comuns e incomuns</li>
                  <li>• "Manter Quantidade" protege suas coleções (mínimo 1 de cada tipo)</li>
                  <li>• Edições limitadas são protegidas por padrão</li>
                  <li>• "Ver Itens para Vender" mostra exatamente o que será vendido</li>
                  <li>• Itens são vendidos IMEDIATAMENTE e removidos do inventário</li>
                  <li>• A venda em lote é totalmente manual - só ocorre quando você clicar em "Ver Itens para Vender"</li>
                  <li>• Não há execução automática - você tem controle total sobre quando vender</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && previewData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">🔍 Confirmação de Venda Automática</h3>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Summary */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{previewData.totalItems}</div>
                    <div className="text-sm text-gray-300">Itens para Vender</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{previewData.totalCredits}</div>
                    <div className="text-sm text-gray-300">Créditos a Receber</div>
                  </div>
                </div>
                <div className="text-center mt-3 text-white font-medium">
                  {previewData.message}
                </div>
              </div>

              {/* Items List */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
                {previewData.items.map((item: any) => (
                  <div key={item.id} className={`rounded-lg p-4 border-2 ${getRarityColor(item.rarity)} bg-white/5`}>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-2xl overflow-hidden">
                        {item.imageUrl && item.imageUrl !== '/items/default.jpg' ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerHTML = '🏆'
                            }}
                          />
                        ) : (
                          <span className="text-2xl">🏆</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-white mb-1">{item.name}</h4>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${getRarityColor(item.rarity)}`}>
                        {item.rarity}
                      </div>
                      {item.isLimitedEdition && (
                        <div className="text-yellow-400 text-xs mb-2">🏆 Edição Limitada</div>
                      )}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Valor Base:</span>
                          <span className="text-white">{item.baseValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Venda:</span>
                          <span className="text-green-400 font-bold">{item.salePrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 mb-6">
                <div className="text-orange-400 font-semibold mb-2">⚠️ Atenção</div>
                <div className="text-gray-300 text-sm">
                  • Os itens serão vendidos IMEDIATAMENTE e removidos do seu inventário
                  • Os créditos serão adicionados à sua conta automaticamente
                  • Esta ação não pode ser desfeita
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={processNow}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {processing ? '🤖 Vendendo...' : '✅ Confirmar Venda'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}