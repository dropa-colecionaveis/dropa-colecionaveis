import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const { prisma } = await import('@/lib/prisma')
    // Basic application info
    const appInfo = {
      name: 'Colecionáveis Platform',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid
    }

    // Database health check
    let dbStatus = 'healthy'
    let dbLatency = 0
    
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatency = Date.now() - dbStart
    } catch (error) {
      dbStatus = 'unhealthy'
      console.error('Database health check failed:', error)
    }

    // Memory usage
    const memoryUsage = process.memoryUsage()
    const memoryInfo = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    }

    // System health
    const healthData = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      application: appInfo,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`
      },
      memory: memoryInfo,
      responseTime: `${Date.now() - startTime}ms`,
      checks: {
        database: dbStatus === 'healthy',
        memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9,
        uptime: process.uptime() > 10 // At least 10 seconds uptime
      }
    }

    // Determine HTTP status
    const httpStatus = healthData.status === 'healthy' ? 200 : 503

    return NextResponse.json(healthData, { status: httpStatus })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}