@echo off
echo 🛠️ Corrigindo erro EPERM do Next.js...

REM Mata processos existentes
echo 🛑 Parando processos do Next.js...
taskkill /f /im node.exe 2>nul

REM Remove cache
echo 🗑️ Removendo cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Define variáveis de ambiente
echo 🔧 Configurando variáveis de ambiente...
set NEXT_TELEMETRY_DISABLED=1
set DISABLE_OPENCOLLECTIVE=1

echo ✅ Correção aplicada! Agora execute: npm run dev
pause