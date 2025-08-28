// Cache for recent activities (3 minutes for better UX)
const activityCache = new Map<string, { data: any, expireAt: number }>()
const CACHE_TTL = 3 * 60 * 1000 // 3 minutes

export function getActivityCache(cacheKey: string, now: number) {
  const cached = activityCache.get(cacheKey)
  if (cached && cached.expireAt > now) {
    return cached.data
  }
  return null
}

export function setActivityCache(cacheKey: string, data: any, now: number) {
  activityCache.set(cacheKey, {
    data,
    expireAt: now + CACHE_TTL
  })
}

// 🚀 Utility function to clear cache when activities are updated
export function clearActivityCache(userId: string) {
  const keysToDelete = Array.from(activityCache.keys()).filter(key => 
    key.includes(`activities_${userId}`)
  )
  keysToDelete.forEach(key => activityCache.delete(key))
  console.log(`🗑️ Cleared ${keysToDelete.length} activity cache entries for user ${userId}`)
}

// 🚀 Clear cache on server restart/deployment
export function clearAllActivityCache() {
  const size = activityCache.size
  activityCache.clear()
  console.log(`🗑️ Cleared ${size} activity cache entries`)
}

// Clean old cache entries periodically
export function cleanExpiredCache(now: number) {
  if (activityCache.size > 50) {
    const entries = Array.from(activityCache.entries())
    entries.forEach(([key, value]) => {
      if (value.expireAt <= now) {
        activityCache.delete(key)
      }
    })
  }
}