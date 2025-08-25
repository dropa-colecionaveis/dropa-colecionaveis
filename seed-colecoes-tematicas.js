const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configuração dos temas visuais para cada coleção
const TEMAS = {
  dragoes: {
    name: 'dragoes-ancestrais',
    displayName: 'Dragões Ancestrais',
    description: 'Criaturas dracônicas lendárias de diferentes elementos e eras',
    emoji: '🐲',
    colorClass: 'from-red-500/20 to-orange-600/20',
    borderClass: 'border-red-500/30'
  },
  armas: {
    name: 'armas-misticas',
    displayName: 'Armas Místicas',
    description: 'Armas lendárias forjadas com poderes sobrenaturais',
    emoji: '⚔️',
    colorClass: 'from-steel-500/20 to-gray-600/20',
    borderClass: 'border-steel-500/30'
  },
  cristais: {
    name: 'cristais-poder',
    displayName: 'Cristais de Poder',
    description: 'Cristais energéticos extraídos de planetas distantes',
    emoji: '💎',
    colorClass: 'from-cyan-500/20 to-blue-600/20',
    borderClass: 'border-cyan-500/30'
  },
  mechas: {
    name: 'mechas-combate',
    displayName: 'Mechas de Combate',
    description: 'Robôs gigantes desenvolvidos para batalhas épicas',
    emoji: '🤖',
    colorClass: 'from-indigo-500/20 to-purple-600/20',
    borderClass: 'border-indigo-500/30'
  },
  sombrias: {
    name: 'criaturas-sombrias',
    displayName: 'Criaturas Sombrias',
    description: 'Entidades místicas das dimensões mais obscuras',
    emoji: '👻',
    colorClass: 'from-purple-900/20 to-black/40',
    borderClass: 'border-purple-900/30'
  },
  elementos: {
    name: 'elementos-primordiais',
    displayName: 'Elementos Primordiais',
    description: 'Manifestações puras dos elementos da criação',
    emoji: '🌟',
    colorClass: 'from-yellow-400/20 to-amber-500/20',
    borderClass: 'border-yellow-400/30'
  },
  guardioes: {
    name: 'guardioes-celestiais',
    displayName: 'Guardiões Celestiais',
    description: 'Seres divinos protetores dos planos superiores',
    emoji: '👼',
    colorClass: 'from-white/20 to-yellow-200/20',
    borderClass: 'border-white/30'
  }
}

// Dados das coleções e seus itens
const COLECOES_DADOS = {
  dragoes: {
    tema: TEMAS.dragoes,
    colecao: {
      name: 'Dragões Ancestrais',
      description: 'Uma coleção épica das criaturas dracônicas mais poderosas que já existiram. Desde dragões jovens até os ancestrais primordiais que moldaram o mundo.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Filhote de Dragão de Fogo', description: 'Um jovem dragão com chamas douradas nascentes', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Dragão Verde da Floresta', description: 'Protetor das florestas antigas com escamas esmeralda', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Dragão Azul dos Ventos', description: 'Controlador das correntes de ar e tempestades menores', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Dragão Branco do Gelo', description: 'Habitante das montanhas geladas com hálito congelante', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Dragão Marrom da Terra', description: 'Guardião das cavernas subterrâneas e minas preciosas', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Dragão Carmesim das Chamas', description: 'Senhor das forjas vulcânicas com poder de fusão', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Dragão Índigo das Tempestades', description: 'Comandante dos raios e trovões celestiais', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Dragão Prateado da Lua', description: 'Guardião noturno com poderes lunares místicos', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Dragão Dourado do Sol', description: 'Portador da luz solar e calor purificador', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Dragão Roxo dos Cristais', description: 'Protetor de gemas místicas com escamas cristalizadas', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Dragão Negro das Sombras', description: 'Mestre da escuridão e manipulador de pesadelos', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Dragão Coral dos Oceanos', description: 'Soberano dos mares profundos e correntes marítimas', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Dragão Esmeralda da Vida', description: 'Portador da essência vital e regeneração natural', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Dragão Ônix da Destruição', description: 'Devastador implacável com poder de aniquilação', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Dragão Opalino do Tempo', description: 'Manipulador temporal com escamas que refletem eras', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Dragão Celestial das Estrelas', description: 'Guardião do cosmos com poder estelar infinito', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Dragão Infernal dos Abismos', description: 'Senhor das chamas eternas e tormentos infernais', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Dragão Dimensional do Vazio', description: 'Viajante entre dimensões com controle espacial', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Dragão Espectral da Morte', description: 'Ceifador de almas com poder sobre vida e morte', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Dragão Arcano da Magia Pura', description: 'Fonte primordial de toda energia mágica existente', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Bahamut, o Dragão Rei Platinado', description: 'O primeiro de todos os dragões, criador das leis dracônicas', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Tiamat, a Dragoa das Cinco Cabeças', description: 'Encarnação do caos primordial e mãe dos dragões malignos', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Ouroboros, o Dragão Eterno', description: 'Símbolo do ciclo infinito, devora a própria cauda', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'Jormungandr, a Serpente Mundial', description: 'Dragão colossal que circunda todos os mundos conhecidos', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Akatosh, o Dragão do Tempo Primordial', description: 'Criador do tempo linear e guardião da continuidade cósmica', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  },

  armas: {
    tema: TEMAS.armas,
    colecao: {
      name: 'Armas Místicas',
      description: 'Lâminas forjadas em forjas divinas, arcos élficos milenares e machados de guerra lendários. Cada arma conta uma história de heróis e batalhas épicas.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Espada de Ferro Comum', description: 'Uma lâmina básica forjada por ferreiros novatos', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Arco de Madeira Simples', description: 'Arco rudimentar feito de carvalho jovem', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Machado de Lenhador', description: 'Ferramenta robusta adaptada para combate', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Adaga de Cobre', description: 'Lâmina curta com cabo de couro desgastado', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Lança de Pedra', description: 'Arma primitiva com ponta de obsidiana afiada', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Lâmina Flamejante', description: 'Espada que se inflama ao comando do portador', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Arco Élfico da Precisão', description: 'Nunca erra o alvo pretendido pelo arqueiro', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Machado dos Ventos Cortantes', description: 'Cria rajadas de vento com cada golpe', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Adaga do Assassino Sombrio', description: 'Torna-se invisível nas sombras da noite', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Tridente do Maremoto', description: 'Controla as marés e correntes oceânicas', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Excalibur Menor', description: 'Réplica da lendária espada do Rei Arthur', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Arco da Lua Crescente', description: 'Flechas se multiplicam sob a luz lunar', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Mjolnir dos Anões', description: 'Martelo de guerra que convoca relâmpagos', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Katana do Dragão Adormecido', description: 'Lâmina forjada com escama de dragão anciã', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Cajado do Arquimago', description: 'Amplifica o poder mágico do usuário', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Durandal, a Espada Sagrada', description: 'Lâmina abençoada que corta até mesmo o mal puro', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Arco do Caçador de Deuses', description: 'Usado para derrubar divindades menores', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Machado da Fúria Berserker', description: 'Aumenta a força a cada inimigo derrotado', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Glaive da Tempestade Eterna', description: 'Corta através do tempo e espaço', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Orbe da Aniquilação', description: 'Destrói a existência no nível molecular', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Excalibur Original', description: 'A verdadeira espada na pedra, forjada pelos deuses', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Gungnir, Lança de Odin', description: 'Nunca erra e sempre retorna ao portador', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Mjolnir Verdadeiro', description: 'Martelo de Thor que controla todos os elementos', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'Kusanagi, a Espada da Serpente', description: 'Lâmina divina extraída da cauda de Yamata-no-Orochi', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Gram, Destruidora de Destinos', description: 'Quebra maldições e reescreve profecias', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  },

  cristais: {
    tema: TEMAS.cristais,
    colecao: {
      name: 'Cristais de Poder',
      description: 'Cristais energéticos coletados dos confins do universo. Cada cristal contém energia pura de diferentes dimensões e planetas exóticos.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Fragmento de Quartzo', description: 'Pedaço básico de cristal com energia mínima', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Cristal de Energia Azul', description: 'Fonte de energia para dispositivos básicos', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Esfera de Luz Menor', description: 'Ilumina pequenas áreas com luz suave', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Pedra de Cura Básica', description: 'Acelera a recuperação de ferimentos leves', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Cristal de Comunicação', description: 'Permite conversas a curta distância', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Cristal Piroelétrico', description: 'Gera chamas controladas através de energia mental', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Gema Crioestática', description: 'Congela líquidos e reduz temperatura ambiente', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Prisma Eletromagnético', description: 'Manipula campos magnéticos e correntes elétricas', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Cristal Gravitacional', description: 'Altera localmente a força da gravidade', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Núcleo de Teletransporte', description: 'Permite viagens instantâneas curtas', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Cristal de Distorção Temporal', description: 'Acelera ou retarda o fluxo do tempo local', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Gema da Transmutação', description: 'Transforma matéria em nível molecular', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Orbe da Invisibilidade', description: 'Torna o portador imperceptível aos sentidos', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Cristal da Regeneração', description: 'Restaura completamente tecidos e órgãos', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Núcleo Psiônico', description: 'Amplifica poderes telepáticos e telecinéticos', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Cristal da Vida Eterna', description: 'Concede imortalidade ao portador digno', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Gema do Controle Mental', description: 'Domina completamente mentes fracas', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Orbe da Ressurreição', description: 'Traz os mortos de volta à vida', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Cristal da Onisciência', description: 'Revela conhecimento de qualquer assunto', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Núcleo da Onipotência', description: 'Realiza desejos dentro de limitações universais', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Cristal Primordial da Criação', description: 'Fragmento da força que criou o universo', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Gema do Multiverso', description: 'Acessa realidades alternativas infinitas', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Orbe da Singularidade', description: 'Controla buracos negros e eventos cósmicos', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'Cristal da Consciência Universal', description: 'Conecta com a mente coletiva de toda vida', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Núcleo do Big Bang', description: 'Poder de criar e destruir universos inteiros', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  },

  mechas: {
    tema: TEMAS.mechas,
    colecao: {
      name: 'Mechas de Combate',
      description: 'Máquinas de guerra colossais desenvolvidas para batalhas interplanetárias. Desde scouts de reconhecimento até destroyers titânicos.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Scout MK-I', description: 'Unidade de reconhecimento básica para patrulhamento', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Worker Bot Alpha', description: 'Robô industrial adaptado para combate leve', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Defense Drone', description: 'Drone autônomo para proteção de perímetro', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Transport Mech', description: 'Mecha logístico com blindagem básica', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Training Bot', description: 'Simulador para treino de pilotos novatos', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Assault Trooper', description: 'Infantaria mecânica com armamento pesado', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Sniper Unit Delta', description: 'Especialista em eliminação a longa distância', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Shield Guardian', description: 'Protetor com escudos de energia avançada', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Stealth Infiltrator', description: 'Sistema de camuflagem óptica ativo', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Repair Specialist', description: 'Unidade de suporte técnico e manutenção', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Heavy Tank Destroyer', description: 'Artilharia pesada com canhões railgun', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Aerial Combat Wing', description: 'Transformador terra-ar com mísseis guiados', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Plasma Cannon Bearer', description: 'Portador de arma de plasma devastadora', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Electronic Warfare Unit', description: 'Hacker de sistemas inimigos avançado', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Berserker Assault', description: 'Máquina de combate corpo a corpo brutal', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Titan Class Destroyer', description: 'Colosso de guerra com múltiplos sistemas', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Quantum Phase Mech', description: 'Viaja através de dimensões quânticas', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Planet Cracker', description: 'Capaz de partir planetas ao meio', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Neural Link Commander', description: 'Controla exércitos inteiros simultaneamente', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Temporal Guardian', description: 'Protege a linha temporal de paradoxos', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Gundam Zero Genesis', description: 'O primeiro mecha perfeito jamais construído', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Megatron Supremus', description: 'Líder transformer com poder absoluto', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Evangelion Unit-01', description: 'Bio-mecha com alma humana incorporada', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'Mazinger Z Infinitus', description: 'Super robô com energia ilimitada', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Voltron Ultimate', description: 'Cinco leões que se tornam um defensor universal', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  },

  sombrias: {
    tema: TEMAS.sombrias,
    colecao: {
      name: 'Criaturas Sombrias',
      description: 'Entidades místicas que habitam as dimensões mais obscuras da existência. Seres de pesadelo e horror que desafiam a compreensão humana.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Sombra Rastejante', description: 'Espírito menor que se alimenta de medos infantis', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Wisp Melancólico', description: 'Alma perdida que vaga pelos cemitérios', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Esqueleto Guerreiro', description: 'Soldado morto-vivo com armadura enferrujada', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Morcego Vampírico', description: 'Criatura noturna sedenta por sangue fresco', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Aranha das Trevas', description: 'Aracnídeo gigante que tece teias espectrais', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Banshee Lamentosa', description: 'Espírito feminino cujo grito prenuncia morte', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Ghoul Devorador', description: 'Morto-vivo faminto por carne humana', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Poltergeist Travesso', description: 'Fantasma que move objetos com fúria', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Wraith Sombrio', description: 'Espectro que drena a força vital', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Nightmare Crawler', description: 'Ser que invade sonhos para atormentar', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Lich Menor', description: 'Mago morto-vivo com conhecimento arcano', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Demônio Succubus', description: 'Sedutora que rouba almas através do desejo', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Reaper Sombrío', description: 'Ceifador menor que colhe vidas marcadas', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Vampire Lord', description: 'Nobre vampiro com séculos de poder', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Shadow Elemental', description: 'Manifestação pura da escuridão primordial', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Death Knight', description: 'Cavaleiro maldito com poder necromântico', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Archdemônio Inferior', description: 'Senhor menor dos infernos ardentes', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Lich King Aspirante', description: 'Pretendente ao trono da não-vida', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Ancient Wraith', description: 'Espírito milenar com ódio condensado', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Void Walker', description: 'Entidade que caminha entre dimensões', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Azathoth, o Caos Nuclear', description: 'Deus primordial da loucura e destruição', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Cthulhu, o Grande Antigo', description: 'Entidade cósmica adormecida sob o oceano', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Mefistófeles Supremo', description: 'Lorde dos contratos diabólicos supremos', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'A Morte Personificada', description: 'Encarnação absoluta do fim de toda vida', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Nyx, Deusa da Noite Eterna', description: 'Mãe primordial de todas as trevas', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  },

  elementos: {
    tema: TEMAS.elementos,
    colecao: {
      name: 'Elementos Primordiais',
      description: 'Manifestações puras dos elementos fundamentais que criaram e sustentam todo o universo conhecido.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Chama Básica', description: 'Pequena manifestação do elemento fogo', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Gota Purificada', description: 'Essência líquida do elemento água', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Brisa Suave', description: 'Corrente gentil do elemento ar', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Pedregulho Sólido', description: 'Fragmento resistente do elemento terra', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Raio de Sol', description: 'Feixe menor do elemento luz', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Pira Controlada', description: 'Fogueira que obedece à vontade mental', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Tsunami Miniatura', description: 'Onda poderosa em escala reduzida', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Tornado Pessoal', description: 'Ciclone que gira ao redor do usuário', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Terremoto Localizado', description: 'Tremor de terra em área específica', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Vácuo Sombrio', description: 'Espaço onde a luz é completamente absorvida', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Inferno Vulcânico', description: 'Lava primordial com calor extremo', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Maremoto Glacial', description: 'Gelo que surge dos oceanos profundos', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Tempestade Elétrica', description: 'Raios que dançam no ar controladamente', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Avalanche Telúrica', description: 'Montanha que se move por vontade própria', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Eclipse Solar', description: 'Escuridão que engole a luz temporariamente', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Supernova Controlada', description: 'Explosão estelar em miniatura', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Oceano Dimensional', description: 'Água que conecta múltiplas realidades', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Vento Cósmico', description: 'Brisa que carrega poeira de estrelas', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Núcleo Planetário', description: 'Coração sólido de um mundo morto', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Buraco Branco', description: 'Oposto do buraco negro, cria matéria', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Fogo da Criação', description: 'Chama que deu origem ao Big Bang', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Água da Vida Eterna', description: 'Líquido primordial que criou toda vida', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Sopro Divino', description: 'Primeiro ar respirado pelos deuses', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'Terra Mãe Original', description: 'Solo do qual nasceu o primeiro mundo', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Luz da Verdade Absoluta', description: 'Iluminação que revela toda realidade', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  },

  guardioes: {
    tema: TEMAS.guardioes,
    colecao: {
      name: 'Guardiões Celestiais',
      description: 'Seres divinos protetores dos planos superiores. Anjos e arcanjos que vigiam e protegem a ordem cósmica.',
      maxItems: 25
    },
    itens: [
      // COMUM (5 itens - 5 créditos)
      { name: 'Querubim Menor', description: 'Anjo infantil guardião de inocentes', rarity: 'COMUM', value: 5, itemNumber: 1 },
      { name: 'Mensageiro Alado', description: 'Porta-voz divino com asas douradas', rarity: 'COMUM', value: 5, itemNumber: 2 },
      { name: 'Guardião Noviço', description: 'Protetor iniciante ainda em treinamento', rarity: 'COMUM', value: 5, itemNumber: 3 },
      { name: 'Anjo da Cura', description: 'Portador de bênçãos restauradoras', rarity: 'COMUM', value: 5, itemNumber: 4 },
      { name: 'Sentinela Diurna', description: 'Vigilante que protege durante o dia', rarity: 'COMUM', value: 5, itemNumber: 5 },

      // INCOMUM (5 itens - 15 créditos)
      { name: 'Anjo da Justiça', description: 'Executor da lei divina nos mortais', rarity: 'INCOMUM', value: 15, itemNumber: 6 },
      { name: 'Portador da Verdade', description: 'Revelador de mentiras e falsidades', rarity: 'INCOMUM', value: 15, itemNumber: 7 },
      { name: 'Guardião dos Sonhos', description: 'Protetor que afasta pesadelos', rarity: 'INCOMUM', value: 15, itemNumber: 8 },
      { name: 'Anjo Guerreiro', description: 'Combatente celestial com espada flamejante', rarity: 'INCOMUM', value: 15, itemNumber: 9 },
      { name: 'Serafim Jovem', description: 'Ser de seis asas cantante de hinos', rarity: 'INCOMUM', value: 15, itemNumber: 10 },

      // RARO (5 itens - 40 créditos)
      { name: 'Arcanjo Protetor', description: 'General celestial comandante de legiões', rarity: 'RARO', value: 40, itemNumber: 11 },
      { name: 'Trono Celestial', description: 'Ser rodante de múltiplas faces e olhos', rarity: 'RARO', value: 40, itemNumber: 12 },
      { name: 'Anjo da Destruição', description: 'Executor da ira divina justificada', rarity: 'RARO', value: 40, itemNumber: 13 },
      { name: 'Portador da Palavra', description: 'Voz que carrega comandos divinos', rarity: 'RARO', value: 40, itemNumber: 14 },
      { name: 'Guardião do Tempo', description: 'Protetor da linha temporal sagrada', rarity: 'RARO', value: 40, itemNumber: 15 },

      // ÉPICO (5 itens - 100 créditos)
      { name: 'Miguel, Comandante Supremo', description: 'Líder dos exércitos celestiais', rarity: 'EPICO', value: 100, itemNumber: 16 },
      { name: 'Gabriel, Anunciador Divino', description: 'Mensageiro das profecias importantes', rarity: 'EPICO', value: 100, itemNumber: 17 },
      { name: 'Rafael, Curador Supremo', description: 'Médico celestial de todas as enfermidades', rarity: 'EPICO', value: 100, itemNumber: 18 },
      { name: 'Uriel, Guardião da Sabedoria', description: 'Portador do conhecimento divino', rarity: 'EPICO', value: 100, itemNumber: 19 },
      { name: 'Raguel, Executor da Justiça', description: 'Punidor de anjos caídos e demônios', rarity: 'EPICO', value: 100, itemNumber: 20 },

      // LENDÁRIO (5 itens - 500 créditos)
      { name: 'Metatron, Escriba Divino', description: 'Registrador de todos os atos cósmicos', rarity: 'LENDARIO', value: 500, itemNumber: 21 },
      { name: 'Sandalphon, Guardião da Oração', description: 'Coletor de súplicas e orações humanas', rarity: 'LENDARIO', value: 500, itemNumber: 22 },
      { name: 'Chamuel, Buscador de Almas', description: 'Encontra almas perdidas em todos os planos', rarity: 'LENDARIO', value: 500, itemNumber: 23 },
      { name: 'Zadkiel, Anjo da Liberdade', description: 'Libertador de correntes físicas e espirituais', rarity: 'LENDARIO', value: 500, itemNumber: 24 },
      { name: 'Raziel, Guardião dos Mistérios', description: 'Conhecedor de todos os segredos divinos', rarity: 'LENDARIO', value: 500, itemNumber: 25 }
    ]
  }
}

async function criarTema(temaConfig) {
  let tema = await prisma.theme.findUnique({
    where: { name: temaConfig.name }
  })
  
  if (!tema) {
    tema = await prisma.theme.create({
      data: {
        name: temaConfig.name,
        displayName: temaConfig.displayName,
        description: temaConfig.description,
        emoji: temaConfig.emoji,
        colorClass: temaConfig.colorClass,
        borderClass: temaConfig.borderClass,
        isActive: true,
        isSystem: false
      }
    })
    console.log(`✅ Tema criado: ${tema.displayName}`)
  } else {
    console.log(`✅ Tema encontrado: ${tema.displayName}`)
  }
  
  return tema
}

async function criarColecao(colecaoConfig, temaId) {
  let colecao = await prisma.collection.findUnique({
    where: { name: colecaoConfig.name }
  })
  
  if (!colecao) {
    colecao = await prisma.collection.create({
      data: {
        name: colecaoConfig.name,
        description: colecaoConfig.description,
        themeId: temaId,
        maxItems: colecaoConfig.maxItems,
        isActive: true,
        isLimited: false
      }
    })
    console.log(`📚 Coleção criada: ${colecao.name}`)
  } else {
    console.log(`📚 Coleção encontrada: ${colecao.name}`)
  }
  
  return colecao
}

async function criarItens(itens, colecaoId) {
  let itensCounter = 0
  
  for (const itemData of itens) {
    const existingItem = await prisma.item.findFirst({
      where: {
        name: itemData.name,
        collectionId: colecaoId
      }
    })
    
    if (!existingItem) {
      await prisma.item.create({
        data: {
          name: itemData.name,
          description: itemData.description,
          imageUrl: `/uploads/items/${itemData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
          rarity: itemData.rarity,
          value: itemData.value,
          collectionId: colecaoId,
          itemNumber: itemData.itemNumber,
          isActive: true
        }
      })
      itensCounter++
    }
  }
  
  return itensCounter
}

async function seedColecoesTematicas() {
  try {
    console.log('🌟 Iniciando criação das coleções temáticas...\n')
    
    let totalItens = 0
    let totalColecoes = 0
    
    // Processar cada coleção
    for (const [chave, dados] of Object.entries(COLECOES_DADOS)) {
      console.log(`🎨 Processando: ${dados.colecao.name}`)
      
      // 1. Criar tema
      const tema = await criarTema(dados.tema)
      
      // 2. Criar coleção
      const colecao = await criarColecao(dados.colecao, tema.id)
      
      // 3. Criar itens
      const itensCounter = await criarItens(dados.itens, colecao.id)
      
      console.log(`   └─ ${itensCounter} itens criados\n`)
      
      totalItens += itensCounter
      if (itensCounter > 0) totalColecoes++
    }
    
    console.log('🎉 SEED COMPLETO! ')
    console.log('═══════════════════════════════════')
    console.log(`📊 Total de coleções criadas: ${totalColecoes}`)
    console.log(`🎯 Total de itens criados: ${totalItens}`)
    console.log('═══════════════════════════════════')
    console.log('\n📋 RESUMO DAS COLEÇÕES:')
    
    Object.values(COLECOES_DADOS).forEach((dados, index) => {
      console.log(`${index + 1}. ${dados.tema.emoji} ${dados.colecao.name}`)
      console.log(`   └─ ${dados.tema.description}`)
    })
    
    console.log('\n🎲 Sistema de Raridades por Coleção:')
    console.log('   • COMUM: 5 itens (5 créditos cada)')
    console.log('   • INCOMUM: 5 itens (15 créditos cada)')
    console.log('   • RARO: 5 itens (40 créditos cada)')
    console.log('   • ÉPICO: 5 itens (100 créditos cada)')
    console.log('   • LENDÁRIO: 5 itens (500 créditos cada)')
    console.log('   • TOTAL: 25 itens únicos por coleção\n')
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o seed
seedColecoesTematicas()