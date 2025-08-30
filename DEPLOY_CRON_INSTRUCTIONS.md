# 🚀 Deploy Instructions - Cron Job Setup

## ✅ Configuração Completa Realizada

Os seguintes arquivos foram criados/modificados:

### 📁 Arquivos Adicionados:
- `vercel.json` - Configuração do cron job
- `src/lib/streak-reset-job.ts` - Serviço de reset de streaks
- `src/app/api/streaks/reset-inactive/route.ts` - API endpoint

### ⚙️ Configuração no vercel.json:
```json
{
  "crons": [
    {
      "path": "/api/streaks/reset-inactive",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule**: `0 9 * * *` = 09:00 UTC = **06:00 Brasil** (diariamente)

## 🔐 Variáveis de Ambiente - IMPORTANTE!

### 1. No Vercel Dashboard:
Adicione a seguinte variável de ambiente:

```
CRON_SECRET=streak-reset-2025-ultra-secure-key-colecionaveis-platform-prod
```

**Como adicionar:**
1. Vá para o projeto no Vercel
2. Settings > Environment Variables
3. Adicione: `CRON_SECRET` com o valor acima
4. Salve e faça redeploy

### 2. Verificação Local:
Para testar localmente, a variável já está no `.env`

## 🤖 Como o Cron Job Funciona

### Execução Automática:
- **Quando**: Todo dia às 06:00 (horário de Brasília)
- **O que faz**: 
  1. Identifica usuários com `currentStreak > 0`
  2. Verifica se NÃO fizeram login durante o dia anterior completo
  3. Reseta `currentStreak` para 0
  4. Preserva `longestStreak`
  5. Invalida cache de rankings

### Logs de Exemplo:
```
🔄 Starting streak reset job...
🇧🇷 Current date (Brasil): 30/08/2025
📅 Yesterday (Brasil): 29/08/2025
📊 Found 15 users with broken streaks
✅ Reset 15 user streaks to 0
🗄️ Rankings cache invalidated
✅ Streak reset job completed successfully
```

## 🧪 Teste Manual

### Em Desenvolvimento:
```bash
curl http://localhost:3000/api/streaks/reset-inactive
```

### Em Produção:
```bash
curl -X POST https://seu-dominio.com/api/streaks/reset-inactive \
  -H "Authorization: Bearer streak-reset-2025-ultra-secure-key-colecionaveis-platform-prod"
```

## 📊 Monitoramento

### No Vercel:
1. Vá para Functions tab
2. Procure por `/api/streaks/reset-inactive`
3. Veja logs de execução diária
4. Verifique erros ou sucessos

### Indicadores de Sucesso:
- ✅ Status 200
- ✅ Message: "Streak reset job completed successfully" 
- ✅ Usuários inativos resetados para 0
- ✅ Rankings invalidados

## 🚨 Troubleshooting

### Se o cron não executar:
1. Verifique se `CRON_SECRET` está configurado no Vercel
2. Verifique se o deploy foi feito após adicionar `vercel.json`
3. Verifique logs de Functions no Vercel

### Se retornar 401 Unauthorized:
1. `CRON_SECRET` não está configurado
2. Valor da variável não confere

### Se retornar 500 Error:
1. Erro de conexão com banco de dados
2. Erro na lógica do timezone
3. Verificar logs detalhados no Vercel

## ✅ Status: Pronto para Deploy!

O sistema está completamente configurado. Após o deploy com a variável de ambiente, o cron job funcionará automaticamente todos os dias às 06:00 (horário de Brasília).