import { prisma } from './prisma'

export interface RankingPerformanceMetrics {
  queryExecutionTime: number
  cacheHitRate: number
  totalUsers: number
  totalRankings: number
  categoryCounts: Record<string, number>
  recommendations: string[]
}

export class RankingPerformanceMonitor {
  private static instance: RankingPerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private cacheStats = { hits: 0, misses: 0 }

  static getInstance(): RankingPerformanceMonitor {
    if (!this.instance) {
      this.instance = new RankingPerformanceMonitor()
    }
    return this.instance
  }

  // Track query execution times
  trackQuery(queryName: string, executionTime: number): void {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, [])
    }
    
    const times = this.metrics.get(queryName)!
    times.push(executionTime)
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift()
    }
  }

  // Track cache hits/misses
  trackCacheHit(): void {
    this.cacheStats.hits++
  }

  trackCacheMiss(): void {
    this.cacheStats.misses++
  }

  // Get performance statistics
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [queryName, times] of this.metrics.entries()) {
      if (times.length === 0) continue
      
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length
      const max = Math.max(...times)
      const min = Math.min(...times)
      
      stats[queryName] = {
        averageMs: Math.round(avg * 100) / 100,
        maxMs: Math.round(max * 100) / 100,
        minMs: Math.round(min * 100) / 100,
        sampleCount: times.length
      }
    }

    const total = this.cacheStats.hits + this.cacheStats.misses
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0

    return {
      queries: stats,
      cache: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        hitRate: Math.round(hitRate * 100) / 100
      }
    }
  }

  // Get comprehensive performance report
  async getPerformanceReport(): Promise<RankingPerformanceMetrics> {
    const startTime = Date.now()
    
    // Get database statistics
    const [totalUsers, totalRankings, categoryStats] = await Promise.all([
      prisma.user.count({
        where: {
          role: { notIn: ['ADMIN', 'SUPER_ADMIN'] }
        }
      }),
      prisma.ranking.count(),
      this.getCategoryStats()
    ])

    const queryExecutionTime = Date.now() - startTime
    const total = this.cacheStats.hits + this.cacheStats.misses
    const cacheHitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0

    // Generate performance recommendations
    const recommendations = this.generateRecommendations()

    return {
      queryExecutionTime,
      cacheHitRate,
      totalUsers,
      totalRankings,
      categoryCounts: categoryStats,
      recommendations
    }
  }

  private async getCategoryStats(): Promise<Record<string, number>> {
    const stats = await prisma.ranking.groupBy({
      by: ['category'],
      _count: { category: true }
    })

    const result: Record<string, number> = {}
    for (const stat of stats) {
      result[stat.category] = stat._count.category
    }

    return result
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()

    // Check query performance
    for (const [queryName, queryStats] of Object.entries(stats.queries)) {
      if ((queryStats as any).averageMs > 1000) {
        recommendations.push(`${queryName} query is slow (${(queryStats as any).averageMs}ms avg) - consider optimizing`)
      }
    }

    // Check cache performance
    if (stats.cache.hitRate < 80 && stats.cache.misses > 50) {
      recommendations.push('Cache hit rate is low - consider increasing cache TTL or warming cache')
    }

    // Check database indexes
    if (this.metrics.has('calculateGlobalRanking') && 
        (this.metrics.get('calculateGlobalRanking')![this.metrics.get('calculateGlobalRanking')!.length - 1] > 2000)) {
      recommendations.push('Global ranking calculation is slow - ensure database indexes are created')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No immediate optimizations needed.')
    }

    return recommendations
  }

  // Reset statistics
  reset(): void {
    this.metrics.clear()
    this.cacheStats = { hits: 0, misses: 0 }
  }

  // Utility method to wrap queries with performance tracking
  async trackQueryExecution<T>(
    queryName: string, 
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    try {
      const result = await queryFn()
      const endTime = performance.now()
      this.trackQuery(queryName, endTime - startTime)
      return result
    } catch (error) {
      const endTime = performance.now()
      this.trackQuery(`${queryName}_error`, endTime - startTime)
      throw error
    }
  }
}

export const performanceMonitor = RankingPerformanceMonitor.getInstance()