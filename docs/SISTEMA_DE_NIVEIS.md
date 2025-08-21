# 📈 Sistema de Níveis - Colecionáveis Digitais

## Visão Geral
O sistema de níveis é baseado em XP (Experience Points) obtido através de conquistas (achievements). O usuário não ganha XP por ações repetitivas, mas sim por marcos e objetivos específicos, incentivando diversidade de atividades.

## 🧮 Fórmula Matemática

### Cálculo do Nível
```typescript
Level = Math.floor(Math.sqrt(XP / 100)) + 1
```

### XP Necessário para Cada Nível
```typescript
XP_mínimo_do_nível = (level - 1)² × 100
XP_para_próximo_nível = level² × 100
```

## 📊 Tabela de Progressão

| Nível | XP Mínimo | XP Máximo | XP para Próximo | Diferença |
|-------|-----------|-----------|-----------------|-----------|
| 1     | 0         | 99        | 100             | 100       |
| 2     | 100       | 399       | 300             | 300       |
| 3     | 400       | 899       | 500             | 500       |
| 4     | 900       | 1599      | 700             | 700       |
| 5     | 1600      | 2499      | 900             | 900       |
| 6     | 2500      | 3599      | 1100            | 1100      |
| 7     | 3600      | 4899      | 1300            | 1300      |
| 8     | 4900      | 6399      | 1500            | 1500      |
| 9     | 6400      | 7999      | 1700            | 1700      |
| 10    | 8100      | 9999      | 1900            | 1900      |
| 15    | 19600     | 24999     | 2900            | 2900      |
| 20    | 36100     | 43999     | 3900            | 3900      |
| 25    | 57600     | 67499     | 4900            | 4900      |
| 30    | 84100     | 95999     | 5900            | 5900      |
| 50    | 240100    | 259999    | 9900            | 9900      |

## 🏆 Fontes de XP (Conquistas)

### Marcos Iniciais
- **Bem-vindo!** - Criar conta: **+5 XP**
- **Primeira Abertura** - Abrir primeiro pacote: **+5 XP**
- **Primeiro Item** - Obter primeiro item: **+10 XP**
- **Primeira Compra** - Comprar primeiros créditos: **+15 XP**

### Colecionador
- **Colecionador Iniciante** - 10 itens únicos: **+25 XP**
- **Colecionador Veterano** - 100 itens únicos: **+100 XP**
- **Caçador de Raridades** - 10 itens raros+: **+50 XP**
- **Encontrador de Lendas** - Primeiro lendário: **+100 XP**
- **Mestre Completista** - Primeira coleção completa: **+150 XP**

### Explorador
- **Abridor Iniciante** - 10 pacotes: **+25 XP**
- **Abridor Experiente** - 100 pacotes: **+100 XP**
- **Sortudo de Primeira** - Lendário no primeiro pacote: **+200 XP**
- **Dedicação Semanal** - 7 dias consecutivos: **+75 XP**

### Comerciante
- **Primeira Venda** - Primeiro item vendido: **+20 XP**
- **Primeira Compra Marketplace** - Primeiro item comprado: **+20 XP**
- **Comerciante Ativo** - 50 transações: **+100 XP**
- **Grande Lucro** - Vender por 5x valor base: **+75 XP**
- **Milionário Marketplace** - 100k em vendas: **+200 XP**

### Especiais
- **Pioneiro** - Primeiros 100 usuários: **+500 XP** (secreto)
- **Coruja Noturna** - 50 pacotes 22h-6h: **+50 XP**

## 🎯 Exemplos de Progressão

### Novo Usuário - Sequência Típica
1. **Registro**: +5 XP → Nível 1 (5/100 = 5%)
2. **Primeiro pacote**: +5 XP → Nível 1 (10/100 = 10%)
3. **Primeiro item**: +10 XP → Nível 1 (20/100 = 20%)
4. **Primeira compra créditos**: +15 XP → Nível 1 (35/100 = 35%)
5. **10 itens únicos**: +25 XP → Nível 1 (60/100 = 60%)
6. **10 itens raros**: +50 XP → **Nível 2** (110/400 = 27.5%)
7. **Primeiro lendário**: +100 XP → **Nível 3** (210/400 = 52.5%)

### Usuário Experiente - Marcos Importantes
- **Nível 5** (~1600 XP): Jogador dedicado
- **Nível 10** (~8100 XP): Colecionador sério
- **Nível 20** (~36100 XP): Veterano da plataforma
- **Nível 30** (~84100 XP): Master colecionador

## 📐 Cálculos de Progresso

### Fórmulas Implementadas
```typescript
// Calcular nível atual
calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

// XP necessário para próximo nível
getXPForNextLevel(currentLevel: number): number {
  return (currentLevel * currentLevel - 1) * 100
}

// Progresso percentual para próximo nível
getLevelProgress(totalXP: number) {
  const currentLevel = this.calculateLevel(totalXP)
  const currentLevelXP = ((currentLevel - 1) * (currentLevel - 1)) * 100
  const nextLevelXP = (currentLevel * currentLevel) * 100
  const progressXP = totalXP - currentLevelXP
  const levelXPRange = nextLevelXP - currentLevelXP
  const progress = Math.min(100, (progressXP / levelXPRange) * 100)
  
  return {
    currentLevel,
    nextLevelXP: nextLevelXP - totalXP,
    progress
  }
}
```

### Exemplo Prático - 250 XP
```typescript
// Usuário com 250 XP total
currentLevel = Math.floor(Math.sqrt(250 / 100)) + 1 = 2
currentLevelXP = (2-1)² × 100 = 100 XP
nextLevelXP = 2² × 100 = 400 XP
progressXP = 250 - 100 = 150 XP
levelXPRange = 400 - 100 = 300 XP
progress = (150 / 300) × 100 = 50%

// Resultado: Nível 2, faltam 150 XP para nível 3 (50% completo)
```

## 🔄 Sistema de Atualização

### Processo Automático
1. **Conquista desbloqueada** → XP adicionado ao total
2. **Sistema calcula novo nível** baseado no XP atualizado
3. **Se nível mudou** → Atualiza registro no banco
4. **Log de level up** é registrado
5. **Interface atualizada** mostra novo nível

### Código de Implementação
```typescript
async addXP(userId: string, points: number): Promise<void> {
  // Atualizar XP total
  const userStats = await prisma.userStats.upsert({
    where: { userId },
    update: { totalXP: { increment: points } },
    create: { userId, totalXP: points, level: 1 }
  })

  // Calcular novo nível
  const newLevel = this.calculateLevel(userStats.totalXP + points)
  
  // Verificar se subiu de nível
  if (newLevel > userStats.level) {
    await prisma.userStats.update({
      where: { userId },
      data: { level: newLevel }
    })
    
    console.log(`📈 Level up! User ${userId} reached level ${newLevel}`)
  }
}
```

## 🎨 Exibição na Interface

### Informações Mostradas
- **Nível atual** do usuário
- **XP total** acumulado
- **XP necessário** para próximo nível
- **Progresso em %** para próximo nível
- **Barra de progresso** visual

### Locais na UI
- **Header Dashboard**: Nível compacto + XP
- **Página Achievements**: Progresso detalhado
- **Rankings**: Comparação entre usuários
- **Profile**: Estatísticas completas

## ⚖️ Balanceamento do Sistema

### Características do Design
- **Progressão exponencial**: Níveis altos requerem muito mais XP
- **XP por conquistas**: Evita farming de ações repetitivas
- **Diversidade premiada**: Diferentes tipos de conquistas
- **Marcos significativos**: Cada level up é uma conquista real

### Vantagens
- **Anti-farming**: Impossível ganhar XP infinito repetindo ações
- **Engajamento**: Incentiva explorar diferentes aspectos da plataforma
- **Senso de progressão**: Cada conquista é meaningful
- **Longevidade**: Sistema escala para usuários de longo prazo

## 🚀 Expansões Futuras

### Ideias para Implementar
- **Níveis prestígio**: Após nível 50, reset com benefícios especiais
- **Conquistas sazonais**: XP extra em eventos limitados
- **Bônus de nível**: Benefícios específicos por atingir certos níveis
- **Sistema de clãs**: XP compartilhado em grupos
- **Multiplicadores**: XP extra em dias especiais

---

## 📋 Resumo Executivo

O sistema de níveis é projetado para:
- ✅ **Incentivar variedade** de atividades
- ✅ **Recompensar dedicação** através de conquistas
- ✅ **Evitar exploits** de XP farming
- ✅ **Escalar a longo prazo** para usuários veteranos
- ✅ **Prover senso de progressão** constante mas desafiador

**Fórmula central**: `Level = floor(sqrt(XP/100)) + 1`
**Filosofia**: XP vem de conquistas, não de ações repetitivas
**Balanceamento**: Progressão exponencial com marcos significativos