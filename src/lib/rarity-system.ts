import { Rarity } from '@prisma/client'
import { prisma } from './prisma'

interface PackProbability {
  rarity: Rarity
  percentage: number
}

// Cache simples para itens por raridade
let itemsCache: Record<Rarity, any[]> | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function getCachedItemsByRarity(): Promise<Record<Rarity, any[]>> {
  const now = Date.now()
  
  // Se cache válido, retornar
  if (itemsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return itemsCache
  }
  
  // Buscar todos os itens ativos
  const allItems = await prisma.item.findMany({
    where: { isActive: true }
  })
  
  // Organizar por raridade
  const itemsByRarity: Record<Rarity, any[]> = {
    COMUM: [],
    INCOMUM: [],
    RARO: [],
    EPICO: [],
    LENDARIO: []
  }
  
  allItems.forEach(item => {
    if (itemsByRarity[item.rarity]) {
      itemsByRarity[item.rarity].push(item)
    }
  })
  
  // Atualizar cache
  itemsCache = itemsByRarity
  cacheTimestamp = now
  
  return itemsByRarity
}

export function clearItemsCache(): void {
  itemsCache = null
  cacheTimestamp = 0
}

export function selectRandomRarity(probabilities: PackProbability[]): Rarity {
  // Normalize probabilities to ensure they add up to 100
  const total = probabilities.reduce((sum, prob) => sum + prob.percentage, 0)
  const normalizedProbs = probabilities.map(prob => ({
    ...prob,
    percentage: (prob.percentage / total) * 100
  }))

  // Generate random number between 0 and 100
  const random = Math.random() * 100

  // Find which rarity range the random number falls into
  let cumulative = 0
  for (const prob of normalizedProbs) {
    cumulative += prob.percentage
    if (random <= cumulative) {
      return prob.rarity
    }
  }

  // Fallback to most common rarity (shouldn't happen)
  return normalizedProbs[0].rarity
}

export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case Rarity.COMUM:
      return '#6B7280' // gray-500
    case Rarity.INCOMUM:
      return '#10B981' // green-500
    case Rarity.RARO:
      return '#3B82F6' // blue-500
    case Rarity.EPICO:
      return '#8B5CF6' // purple-500
    case Rarity.LENDARIO:
      return '#F59E0B' // yellow-500
    default:
      return '#6B7280'
  }
}

export function getRarityName(rarity: Rarity | string): string {
  const rarityValue = typeof rarity === 'string' ? rarity as Rarity : rarity
  switch (rarityValue) {
    case Rarity.COMUM:
      return 'Comum'
    case Rarity.INCOMUM:
      return 'Incomum'
    case Rarity.RARO:
      return 'Raro'
    case Rarity.EPICO:
      return 'Épico'
    case Rarity.LENDARIO:
      return 'Lendário'
    default:
      return 'Desconhecido'
  }
}

export function getRarityColorFromString(rarity: string): string {
  switch (rarity) {
    case 'COMUM':
      return 'text-gray-400 bg-gray-500/20 border-gray-500'
    case 'INCOMUM':
      return 'text-green-400 bg-green-500/20 border-green-500'
    case 'RARO':
      return 'text-blue-400 bg-blue-500/20 border-blue-500'
    case 'EPICO':
      return 'text-purple-400 bg-purple-500/20 border-purple-500'
    case 'LENDARIO':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500'
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500'
  }
}