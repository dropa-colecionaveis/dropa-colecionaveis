// Cache simples em memória para achievement queries frequentes
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class AchievementCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    // Invalidar chaves que correspondem ao padrão
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Cache específico para user achievements
  getUserAchievements(userId: string): any[] | null {
    return this.get(`user_achievements:${userId}`)
  }

  setUserAchievements(userId: string, achievements: any[], ttl = this.DEFAULT_TTL): void {
    this.set(`user_achievements:${userId}`, achievements, ttl)
  }

  invalidateUserAchievements(userId: string): void {
    this.invalidate(`user_achievements:${userId}`)
  }

  // Cache para achievement stats
  getAchievementStats(): any | null {
    return this.get('achievement_stats')
  }

  setAchievementStats(stats: any, ttl = this.DEFAULT_TTL): void {
    this.set('achievement_stats', stats, ttl)
  }

  // Cache para user stats
  getUserStats(userId: string): any | null {
    return this.get(`user_stats:${userId}`)
  }

  setUserStats(userId: string, stats: any, ttl = this.DEFAULT_TTL): void {
    this.set(`user_stats:${userId}`, stats, ttl)
  }

  invalidateUserStats(userId: string): void {
    this.invalidate(`user_stats:${userId}`)
  }

  // Cache para achievement counts
  getAchievementCount(userId: string, achievementType: string): number | null {
    return this.get(`achievement_count:${userId}:${achievementType}`)
  }

  setAchievementCount(userId: string, achievementType: string, count: number, ttl = this.DEFAULT_TTL): void {
    this.set(`achievement_count:${userId}:${achievementType}`, count, ttl)
  }

  // Invalidar cache quando achievement é desbloqueado
  onAchievementUnlocked(userId: string): void {
    this.invalidateUserAchievements(userId)
    this.invalidateUserStats(userId)
    this.invalidate('achievement_stats') // Invalidar stats globais
    this.invalidate(`achievement_count:${userId}`) // Invalidar contadores do usuário
  }

  // Invalidar cache quando achievements são modificados/adicionados (para admin)
  onAchievementModified(): void {
    this.invalidate('all_achievements') // Invalidar lista de conquistas
    this.invalidate('achievement_stats') // Invalidar stats globais
    // Invalidar todos os caches de usuários pois podem ter novas conquistas disponíveis
    this.invalidate('user_achievements:')
    this.invalidate('user_stats:')
    this.invalidate('achievement_count:')
  }

  // Estatísticas do cache
  getStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    }
  }

  // Limpeza automática de entradas expiradas
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const achievementCache = new AchievementCache()

// Auto-cleanup a cada 10 minutos
setInterval(() => {
  achievementCache.cleanup()
}, 10 * 60 * 1000)

export default achievementCache