#!/bin/bash

echo "🛠️ Corrigindo erro EPERM do Next.js..."

# Mata processos existentes
echo "🛑 Parando processos do Next.js..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# Remove cache
echo "🗑️ Removendo cache..."
rm -rf .next
rm -rf node_modules/.cache

# Limpa npm cache
echo "🧹 Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

echo "✅ Correção aplicada!"
echo "📝 Agora execute: NEXT_TELEMETRY_DISABLED=1 npm run dev"
echo "💡 Ou adicione as variáveis no seu .env.local:"
echo "   NEXT_TELEMETRY_DISABLED=1"
echo "   DISABLE_OPENCOLLECTIVE=1"