interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

// Cache em memória para rate limiting
const rateLimitCache = new Map<string, RateLimitEntry>()

// Configurações de rate limiting por endpoint
const RATE_LIMITS = {
  payment_create: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas em 15 minutos
  payment_status: { max: 30, windowMs: 5 * 60 * 1000 }, // 30 verificações em 5 minutos
  default: { max: 10, windowMs: 10 * 60 * 1000 } // 10 requests em 10 minutos
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS = 'default'
): RateLimitResult {
  const now = Date.now()
  const config = RATE_LIMITS[endpoint]
  const key = `${endpoint}:${identifier}`

  // Limpar entradas expiradas periodicamente
  if (Math.random() < 0.01) { // 1% de chance
    cleanupExpiredEntries()
  }

  let entry = rateLimitCache.get(key)

  // Se não existe ou expirou, criar nova entrada
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    }
    rateLimitCache.set(key, entry)

    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: entry.resetTime
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar se excedeu o limite
  if (entry.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime
  }
}

// Função para limpar entradas expiradas
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now > entry.resetTime) {
      rateLimitCache.delete(key)
    }
  }
}

// Função para obter estatísticas de rate limiting
export function getRateLimitStats() {
  const now = Date.now()
  const activeEntries = Array.from(rateLimitCache.entries())
    .filter(([_, entry]) => now <= entry.resetTime)

  return {
    totalEntries: rateLimitCache.size,
    activeEntries: activeEntries.length,
    endpoints: Object.keys(RATE_LIMITS),
    oldestEntry: activeEntries.length > 0
      ? Math.min(...activeEntries.map(([_, entry]) => entry.firstRequest))
      : null
  }
}

// Função para reset manual (útil para testes)
export function resetRateLimit(identifier?: string, endpoint?: string) {
  if (identifier && endpoint) {
    const key = `${endpoint}:${identifier}`
    rateLimitCache.delete(key)
  } else {
    rateLimitCache.clear()
  }
}