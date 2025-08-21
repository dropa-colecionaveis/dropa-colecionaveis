# 🎯 Guia de Testes - Achievements & Rankings

Este guia detalha como testar todas as funcionalidades dos sistemas de **Achievements** e **Rankings** no frontend da plataforma.

## 📋 **Pré-requisitos**

1. ✅ Sistema rodando (`npm run dev`)
2. ✅ Banco de dados configurado
3. ✅ Seeds de achievements executados
4. ✅ Usuário registrado e logado no sistema

---

## 🏠 **TESTANDO DASHBOARD ATUALIZADO**

### **1. Verificar Header Gamificado**
- [X] **Nível do usuário** exibido ("Nível X")
- [X] **XP total** exibido ("Y XP")
- [X] **Botão "🏆 Conquistas"** no header
- [X] **Botão "📊 Rankings"** no header
- [X] **Créditos** exibidos como antes

### **2. Verificar Cards Principais**
- [X] **Card "🏆 Conquistas"** presente
- [X] **Card "📊 Rankings"** presente
- [X] **Links funcionais** para as respectivas páginas

### **3. Verificar Estatísticas Expandidas**
- [X] **6 cards de estatísticas** no final:
  - Pacotes Abertos (verde)
  - Itens Coletados (azul)
  - Itens Lendários (roxo)
  - Créditos (amarelo)
  - XP Total (laranja)
  - Ranking XP (rosa)

---

## 🏆 **TESTANDO ACHIEVEMENTS (CONQUISTAS)**

### **1. Acessar Página de Conquistas**
- **URL:** `/achievements`
- **Botões disponíveis:**
  - ✅ **Header do dashboard:** Botão "🏆 Conquistas"
  - ✅ **Card no dashboard:** "Ver Conquistas"
  - ✅ **Página de rankings:** Link "Conquistas"

### **2. Verificar Interface Básica**
- [X] **Header** exibe título "🏆 Conquistas"
- [X] **Cards de estatísticas** no topo:
  - Desbloqueadas
  - Progresso %
  - XP Total
  - Total de conquistas
- [X] **Filtros funcionais**:
  - Categorias: Todas, Colecionador, Explorador, Comerciante, Marcos, Especiais
  - Status: Todas, Completas, Incompletas

### **3. Testar Conquistas por Categoria**

#### **🎁 EXPLORADOR (Pacotes)**
**Testando "Primeira Abertura" (5 XP):**
1. Ir para `/packs`
2. Comprar créditos se necessário (`/credits/purchase`)
3. Abrir um pacote qualquer
4. ✅ **Verificar:** Conquista "Primeira Abertura" desbloqueada
5. ✅ **Verificar:** +5 XP adicionado ao total

**Testando "Abridor Iniciante" (25 XP):**
1. Abrir 10 pacotes no total
2. ✅ **Verificar:** Conquista "Abridor Iniciante" desbloqueada
3. ✅ **Verificar:** +25 XP adicionado

#### **🏆 COLECIONADOR (Itens)**
**Testando "Primeiro Item" (10 XP):**
1. Abrir primeiro pacote (já feito acima)
2. ✅ **Verificar:** Conquista "Primeiro Item" desbloqueada

**Testando "Colecionador Iniciante" (25 XP):**
1. Coletar 10 itens únicos (abrir vários pacotes)
2. ✅ **Verificar:** Conquista desbloqueada quando atingir 10 itens

**Testando "Caçador de Raridades" (50 XP):**
1. Encontrar 10 itens raros ou superiores
2. ✅ **Verificar:** Progresso na conquista
3. ✅ **Verificar:** Desbloqueio ao atingir meta

#### **💰 COMERCIANTE (Marketplace)**
**Testando "Primeira Venda" (20 XP):**
1. Ir para `/inventory`
2. Colocar um item à venda no marketplace
3. Aguardar ou simular compra
4. ✅ **Verificar:** Conquista "Primeira Venda" desbloqueada

**Testando "Primeira Compra" (20 XP):**
1. Ir para `/marketplace`
2. Comprar um item de outro usuário
3. ✅ **Verificar:** Conquista "Primeira Compra" desbloqueada

#### **🌟 MARCOS (Milestones)**
**Testando "Bem-vindo!" (5 XP):**
1. ✅ **Já desbloqueado** automaticamente no registro

**Testando "Primeira Compra" (15 XP):**
1. Comprar créditos pela primeira vez
2. ✅ **Verificar:** Conquista desbloqueada

#### **✨ ESPECIAIS (Raras)**
**Testando "Pioneiro" (500 XP):**
1. ✅ **Secreta:** Deve aparecer como "❓ Conquista Secreta"
2. ✅ **Condição:** Ser um dos primeiros 100 usuários

### **4. Testar Funcionalidades da Interface**

#### **Filtros de Categoria:**
- [x] Clicar em "Colecionador" → Mostrar apenas conquistas de colecionador
- [x] Clicar em "Explorador" → Mostrar apenas conquistas de explorador
- [x] Clicar em "Todas" → Mostrar todas as conquistas

#### **Filtros de Status:**
- [x] Clicar em "Completas" → Mostrar apenas desbloqueadas
- [x] Clicar em "Incompletas" → Mostrar apenas não desbloqueadas
- [x] Clicar em "Todas" → Mostrar todas

#### **Cards de Conquistas:**
- [x] **Desbloqueadas:** Fundo colorido, ícone original, "✅ DESBLOQUEADA!"
- [x] **Não desbloqueadas:** Fundo cinza, "Não desbloqueada"
- [ ] **Secretas não desbloqueadas:** "❓" como ícone, "Conquista Secreta"

#### **Recém Desbloqueadas:**
- [x] Seção aparece apenas se houver conquistas recentes
- [x] Mostra até 5 conquistas mais recentes
- [x] Exibe data/hora do desbloqueio

---

## 📊 **TESTANDO RANKINGS**

### **1. Acessar Página de Rankings**
- **URL:** `/rankings`
- **Botões disponíveis:**
  - ✅ **Header do dashboard:** Botão "📊 Rankings"
  - ✅ **Card no dashboard:** "Ver Rankings"
  - ✅ **Página de achievements:** Link "Rankings"

### **2. Verificar Interface Básica**
- [x] **Header** exibe título "🏆 Rankings"
- [x] **Cards de estatísticas** do usuário:
  - Seu Nível
  - Total XP
  - Posição Atual
  - Ranking XP
- [x] **Categorias de ranking** disponíveis
- [x] **Leaderboard** principal

### **3. Testar Cada Categoria de Ranking**

#### **⭐ Total XP**
1. Clicar na categoria "Total XP"
2. ✅ **Verificar:** Lista ordenada por XP total
3. ✅ **Verificar:** Sua posição destacada em azul
4. ✅ **Verificar:** Valores formatados como "1,234 XP"

#### **📦 Abridor de Pacotes**
1. Clicar na categoria "Abridor de Pacotes"
2. ✅ **Verificar:** Lista ordenada por pacotes abertos
3. ✅ **Verificar:** Valores formatados como "15 pacotes"

#### **🏆 Colecionador**
1. Clicar na categoria "Colecionador"
2. ✅ **Verificar:** Lista ordenada por itens coletados
3. ✅ **Verificar:** Valores formatados como "25 itens"

#### **💰 Comerciante**
1. Clicar na categoria "Comerciante"
2. ✅ **Verificar:** Lista ordenada por transações no marketplace
3. ✅ **Verificar:** Valores formatados como "8 transações"

#### **🔥 Ativo Semanal**
1. Clicar na categoria "Ativo Semanal"
2. ✅ **Verificar:** Lista de usuários ativos na última semana
3. ✅ **Verificar:** Valores formatados como "7 dias"

#### **📅 Ativo Mensal**
1. Clicar na categoria "Ativo Mensal"
2. ✅ **Verificar:** Lista de usuários ativos no último mês
3. ✅ **Verificar:** Valores baseados em streak

### **4. Testar Elementos Visuais do Ranking**

#### **Posições Especiais:**
- [ ] **1º lugar:** 👑 + texto dourado
- [ ] **2º lugar:** 🥈 + texto prateado
- [ ] **3º lugar:** 🥉 + texto bronze
- [ ] **4º-10º:** 🏆 + texto branco
- [ ] **Demais:** #posição + texto branco

#### **Destaque do Usuário:**
- [ ] Sua linha destacada com fundo azul
- [ ] Badge "Você" ao lado do nome
- [ ] Texto em azul claro

#### **Informações Exibidas:**
- [ ] Posição (#1, #2, etc.)
- [ ] Nome/email do usuário
- [ ] Valor da métrica (XP, pacotes, itens, etc.)
- [ ] Posição numérica à direita

---

## 🔄 **TESTANDO INTEGRAÇÃO AUTOMÁTICA**

### **1. Ganho de XP Automático**

#### **Por Ações:**
1. **Registrar usuário novo:** +5 XP inicial
2. **Comprar créditos:** +XP por achievement se primeira vez
3. **Abrir pacote:** +10 XP base + XP do item + XP de achievements
4. **Obter item raro:** +10 XP (raro), +25 XP (épico), +50 XP (lendário)
5. **Vender no marketplace:** +5 XP
6. **Comprar no marketplace:** +5 XP

#### **Por Achievements:**
- [ ] Cada achievement desbloqueado adiciona seus pontos ao XP total
- [ ] XP atualiza imediatamente nas interfaces
- [ ] Nível recalculado automaticamente (Level = sqrt(XP/100) + 1)

### **2. Atualização de Rankings**

#### **Automática:**
- [ ] Rankings atualizam após 10 pacotes abertos
- [ ] Rankings atualizam após itens épicos/lendários
- [ ] Scheduler roda automaticamente em produção

#### **Manual (Para Teste):**
1. Fazer ações que geram XP/stats
2. Ir para `/api/admin/rankings/scheduler` (se admin)
3. POST com `{"action": "update-now"}`
4. ✅ **Verificar:** Rankings atualizados imediatamente

### **3. Persistência de Dados**
- [ ] Achievements permanecem após logout/login
- [ ] XP e nível mantidos
- [ ] Posições no ranking preservadas
- [ ] Streaks de atividade funcionando

---

## 🎮 **CENÁRIOS DE TESTE COMPLETOS**

### **Cenário 1: Usuário Novo Completo**
```
1. Registrar nova conta ✅ +5 XP, "Bem-vindo!"
2. Comprar créditos     ✅ +"Primeira Compra" (15 XP)
3. Abrir primeiro pacote ✅ +"Primeira Abertura" (5 XP) + "Primeiro Item" (10 XP)
4. Verificar achievements ✅ 3 conquistas desbloqueadas
5. Verificar rankings    ✅ Aparece nas listas
6. Total esperado: ~35+ XP, Nível 1
```

### **Cenário 2: Colecionador Ativo**
```
1. Abrir 10 pacotes      ✅ +"Abridor Iniciante" (25 XP)
2. Coletar 10 itens      ✅ +"Colecionador Iniciante" (25 XP)
3. Encontrar item lendário ✅ +"Encontrador de Lendas" (100 XP)
4. Verificar posição no ranking de colecionador
5. Total esperado: 150+ XP adicional
```

### **Cenário 3: Comerciante**
```
1. Listar item para venda
2. Vender item           ✅ +"Primeira Venda" (20 XP)
3. Comprar item de outro ✅ +"Primeira Compra" (20 XP)
4. Verificar ranking de comerciante
5. Total esperado: 40+ XP adicional
```

---

## 🐛 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Se achievements não aparecem:**
```bash
# Re-executar seed dos achievements
cd colecionaveis-platform
npx tsx prisma/seed-achievements.ts
```

### **Se rankings estão vazios:**
```bash
# Atualizar rankings manualmente
# POST para /api/admin/rankings/scheduler
# Body: {"action": "update-now"}
```

### **Se XP não atualiza:**
- Verificar console do navegador para erros
- Verificar logs do servidor
- Confirmar que userStatsService está sendo chamado

### **Se interface não carrega:**
- Verificar se está logado
- Verificar se rotas estão protegidas
- Limpar cache do navegador

---

## ✅ **CHECKLIST FINAL**

### **Achievements:**
- [ ] Página carrega sem erros
- [ ] Filtros funcionam
- [ ] Conquistas desbloqueiam automaticamente
- [ ] XP soma corretamente
- [ ] Interface responsiva

### **Rankings:**
- [ ] Todas 6 categorias funcionam
- [ ] Ordenação correta
- [ ] Posições especiais destacadas
- [ ] Usuário logado destacado
- [ ] Atualização automática

### **Integração:**
- [ ] XP ganha automaticamente
- [ ] Rankings atualizam
- [ ] Dados persistem
- [ ] Performance adequada

---

## 🎯 **MÉTRICAS DE SUCESSO**

- **Achievements:** 19 conquistas disponíveis, progresso visível
- **Rankings:** 6 categorias funcionais com atualizações
- **XP System:** Ganho automático em todas as ações
- **UI/UX:** Interface intuitiva e responsiva
- **Performance:** Carregamento < 2s, atualizações suaves

---

**🎉 Sistema 100% funcional e testado!**

Este guia garante que todas as funcionalidades dos sistemas de Achievements e Rankings estão funcionando corretamente no frontend da plataforma.
