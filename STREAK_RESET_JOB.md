# Sistema de Reset Automático de Streaks

## 📋 Como Funciona

O sistema implementa o comportamento baseado em **dias de calendário** (horário Brasil):

1. **Login no mesmo dia**: Apenas atualiza `lastActivityAt`, streak não muda
2. **Login consecutivo**: Login em dias consecutivos → streak incrementa +1
3. **Quebra de sequência**: Usuário não faz login durante um dia completo → streak resetado para 0
4. **Novo início**: Login após reset → streak vai de 0 para 1  
5. **Histórico**: `longestStreak` sempre preserva o melhor recorde

### Exemplos:
- **Login**: 29/08 às 22:00 → streak = 1
- **Login**: 30/08 às 00:05 → streak = 2 ✅ (novo dia)
- **Sem login no dia 31/08 completo** → streak resetado para 0
- **Login**: 01/09 qualquer hora → streak = 1 (nova sequência)

## 🤖 Job Automático

### Arquivo Criado
- `src/lib/streak-reset-job.ts` - Serviço que reseta streaks inativos
- `src/app/api/streaks/reset-inactive/route.ts` - API endpoint para executar o job

### Como o Job Funciona
```typescript
// Executa diariamente (recomendado: 06:00 Brasil) e:
// 1. Identifica usuários com currentStreak > 0
// 2. Verifica se NÃO fizeram login durante o dia anterior COMPLETO (00:00-23:59)
// 3. Reseta currentStreak para 0 (quebrou a sequência)
// 4. Preserva longestStreak
// 5. Invalida cache de rankings
```

## 🕐 Configuração do Cron Job

### Opção 1: Vercel Cron Jobs
Adicione no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/streaks/reset-inactive",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Opção 2: External Cron Service
Configure um serviço externo (como cron-job.org) para fazer POST para:

```
POST https://seu-dominio.com/api/streaks/reset-inactive
Authorization: Bearer YOUR_CRON_SECRET
```

### Variáveis de Ambiente
Adicione no `.env`:

```bash
CRON_SECRET=seu-secret-super-seguro-aqui
```

## 🧪 Teste Manual

### Em Desenvolvimento
```bash
# Chamar via GET (apenas em dev)
curl http://localhost:3000/api/streaks/reset-inactive
```

### Em Produção
```bash
# Chamar via POST com autorização
curl -X POST https://seu-dominio.com/api/streaks/reset-inactive \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Logs do Job

O job produz logs detalhados:
```
🔄 Starting streak reset job...
🇧🇷 Current time (Brasil): 29/08/2025, 06:00:00
⏰ Cutoff time (Brasil): 28/08/2025, 06:00:00
📊 Found 15 users with broken streaks
✅ Reset 15 user streaks to 0
🗄️ Rankings cache invalidated
✅ Streak reset job completed successfully
```

## ✅ Validação

O sistema foi testado e validado:
- ✅ Reset automático funciona corretamente
- ✅ Login após reset inicia nova sequência em 1
- ✅ Horário de Brasília usado para todos os cálculos
- ✅ `longestStreak` preservado
- ✅ Rankings invalidados automaticamente

## 🚀 Status: Pronto para Produção

O sistema está completamente implementado e testado. Basta configurar o cron job para executar diariamente às 6h da manhã (ou horário de sua escolha).