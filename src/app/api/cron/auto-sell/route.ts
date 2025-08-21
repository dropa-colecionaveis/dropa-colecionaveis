import { NextResponse } from 'next/server'
import { autoSellService } from '@/lib/auto-sell'

export async function POST(req: Request) {
  // ENDPOINT DESABILITADO - Auto-sell agora funciona apenas manualmente
  return NextResponse.json(
    { 
      error: 'Auto-sell automático foi desabilitado. Use a interface manual para venda em lote.',
      message: 'A venda automática agora funciona apenas quando acionada manualmente pelo usuário.'
    },
    { status: 410 } // 410 Gone - recurso não disponível
  )
}

// Método GET também desabilitado
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Auto-sell automático foi desabilitado. Use a interface manual para venda em lote.',
      message: 'A venda automática agora funciona apenas quando acionada manualmente pelo usuário.'
    },
    { status: 410 } // 410 Gone - recurso não disponível
  )
}