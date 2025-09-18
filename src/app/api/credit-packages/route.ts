import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache settings for better performance
export const revalidate = 60 // 1 minute  
export const runtime = 'nodejs'

// GET - Lista pacotes ativos para uso no sistema de compras
export async function GET() {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        credits: true,
        price: true,
        isPopular: true,
        displayOrder: true
      }
    })

    // Mapear para o formato esperado pelo sistema existente
    const formattedPackages = packages.map((pkg, index) => ({
      id: index + 1, // Manter compatibilidade com IDs numéricos
      dbId: pkg.id, // ID real do banco para referência
      credits: pkg.credits,
      price: pkg.price,
      popular: pkg.isPopular,
      isPopular: pkg.isPopular // Adicionar ambos os campos para compatibilidade
    }))

    const response = NextResponse.json({ packages: formattedPackages })
    
    // Set cache headers for better performance  
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300')
    
    return response
  } catch (error) {
    console.error('Error fetching active credit packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}