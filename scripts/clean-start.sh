#!/bin/bash

echo "🧹 Limpando cache do Next.js..."

# Para qualquer processo Node.js rodando na porta 3000
echo "🛑 Parando processos existentes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# Limpa cache do Next.js
echo "🗑️ Removendo .next..."
rm -rf .next

# Limpa cache do Node.js
echo "🗑️ Removendo node_modules/.cache..."
rm -rf node_modules/.cache

# Limpa cache do npm
echo "🗑️ Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

# Verifica se a porta 3000 está livre
echo "🔍 Verificando porta 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Porta 3000 ainda está em uso, forçando liberação..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

# Define variáveis de ambiente para prevenir erros EPERM
export NEXT_TELEMETRY_DISABLED=1
export DISABLE_OPENCOLLECTIVE=1

echo "🚀 Iniciando Next.js..."
npm run dev