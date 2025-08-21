import { NextResponse } from 'next/server'

// Lista estática de categorias de achievements para evitar dependências problemáticas
const ACHIEVEMENT_CATEGORIES = [
  'COLLECTOR',
  'EXPLORER', 
  'TRADER',
  'MILESTONE',
  'SPECIAL'
] as const

export async function GET() {
  try {
    // Retornar resposta básica com categorias disponíveis
    // A funcionalidade completa de achievements está em /api/user/achievements
    return NextResponse.json({
      categories: ACHIEVEMENT_CATEGORIES,
      message: 'Use /api/user/achievements for detailed achievement data'
    })
  } catch (error) {
    console.error('Error in achievements API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}