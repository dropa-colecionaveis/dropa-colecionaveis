#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const documentation = {
  "items": [
    {
      "id": "cmfkcv7wi004rick6ui0j3nup",
      "name": "Função Simples Gênesis",
      "rarity": "COMUM",
      "value": 8,
      "itemNumber": 91,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv86u004tick6uzb7b1ce",
      "name": "Variável Básica Gênesis",
      "rarity": "COMUM",
      "value": 8,
      "itemNumber": 92,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv919004zick6kpsc0c6o",
      "name": "Array Nascente Gênesis",
      "rarity": "COMUM",
      "value": 9,
      "itemNumber": 95,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv8r0004xick6ki80i7rb",
      "name": "String Primeira Gênesis",
      "rarity": "COMUM",
      "value": 9,
      "itemNumber": 94,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv8gz004vick638wmvm9t",
      "name": "Estrutura Inicial Gênesis",
      "rarity": "COMUM",
      "value": 9,
      "itemNumber": 93,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv9bg0051ick6wkd9qthm",
      "name": "Operador Base Gênesis",
      "rarity": "COMUM",
      "value": 9,
      "itemNumber": 96,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv9li0053ick6aolhp004",
      "name": "Pixel Primordial Gênesis",
      "rarity": "COMUM",
      "value": 10,
      "itemNumber": 97,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv9vn0055ick6frmq8rpf",
      "name": "Método Original Gênesis",
      "rarity": "COMUM",
      "value": 10,
      "itemNumber": 98,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcva5s0057ick6fs2do00o",
      "name": "Cache Fundamental Gênesis",
      "rarity": "COMUM",
      "value": 10,
      "itemNumber": 99,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvbav005fick677feebh0",
      "name": "Condição Primária Gênesis",
      "rarity": "COMUM",
      "value": 11,
      "itemNumber": 103,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvb0g005dick60335smar",
      "name": "Fragmento de Código Gênesis",
      "rarity": "COMUM",
      "value": 11,
      "itemNumber": 102,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvag50059ick68vpciqhi",
      "name": "Byte Fundamental Gênesis",
      "rarity": "COMUM",
      "value": 11,
      "itemNumber": 100,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvaq9005bick6nr9h9z2y",
      "name": "Ponteiro Primeiro Gênesis",
      "rarity": "COMUM",
      "value": 11,
      "itemNumber": 101,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvblk005hick6v2xrptkx",
      "name": "Memória Primordial Gênesis",
      "rarity": "COMUM",
      "value": 12,
      "itemNumber": 104,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvbvs005jick6nu6fquo4",
      "name": "Objeto Raiz Gênesis",
      "rarity": "COMUM",
      "value": 12,
      "itemNumber": 105,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvcga005nick6pqj66c8z",
      "name": "Classe Inaugural Gênesis",
      "rarity": "COMUM",
      "value": 13,
      "itemNumber": 107,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvc65005lick6jsyeoqib",
      "name": "Algoritmo Embrião Gênesis",
      "rarity": "COMUM",
      "value": 13,
      "itemNumber": 106,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv4z40047ick6w87h1jkt",
      "name": "Folha Nascente Gênesis",
      "rarity": "COMUM",
      "value": 14,
      "itemNumber": 81,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvd0q005rick6pf8ousyx",
      "name": "Loop Inicial Gênesis",
      "rarity": "COMUM",
      "value": 14,
      "itemNumber": 109,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvdaw005tick6v9ouka9e",
      "name": "Bit da Origem Gênesis",
      "rarity": "COMUM",
      "value": 14,
      "itemNumber": 110,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcvcqk005pick67a1g89k9",
      "name": "Linha de Comando Gênesis",
      "rarity": "COMUM",
      "value": 14,
      "itemNumber": 108,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv5j5004bick66b70inn1",
      "name": "Graveto Primeiro Gênesis",
      "rarity": "COMUM",
      "value": 15,
      "itemNumber": 83,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv5950049ick6g5eb0s5p",
      "name": "Broto Primário Gênesis",
      "rarity": "COMUM",
      "value": 15,
      "itemNumber": 82,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv5tq004dick68tcjuksr",
      "name": "Gota de Chuva Gênesis",
      "rarity": "COMUM",
      "value": 15,
      "itemNumber": 84,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv6ek004hick622grgsmm",
      "name": "Pedra Simples Gênesis",
      "rarity": "COMUM",
      "value": 16,
      "itemNumber": 86,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv713004lick637yjh304",
      "name": "Semente Inicial Gênesis",
      "rarity": "COMUM",
      "value": 16,
      "itemNumber": 88,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv64b004fick64h7htldp",
      "name": "Partícula Base Gênesis",
      "rarity": "COMUM",
      "value": 16,
      "itemNumber": 85,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv6qx004jick6ko7cbzuw",
      "name": "Grão de Areia Gênesis",
      "rarity": "COMUM",
      "value": 16,
      "itemNumber": 87,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv7br004nick6a8owzpop",
      "name": "Fibra Natural Gênesis",
      "rarity": "COMUM",
      "value": 17,
      "itemNumber": 89,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv7m4004pick6hxkxhwnu",
      "name": "Cristal Menor Gênesis",
      "rarity": "COMUM",
      "value": 17,
      "itemNumber": 90,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuxv6002tick6uzf5enuo",
      "name": "Flauta da Aurora Gênesis",
      "rarity": "INCOMUM",
      "value": 18,
      "itemNumber": 51,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuy5h002vick6wi8jvm67",
      "name": "Frasco Ancestral Gênesis",
      "rarity": "INCOMUM",
      "value": 18,
      "itemNumber": 52,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuyfz002xick6287k8m5b",
      "name": "Kit do Pescador Gênesis",
      "rarity": "INCOMUM",
      "value": 19,
      "itemNumber": 58,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuyq4002zick6meatfu1i",
      "name": "Kit Herbal Gênesis",
      "rarity": "INCOMUM",
      "value": 19,
      "itemNumber": 59,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuzav0033ick6fxkxy5ky",
      "name": "Jarra de Barro Gênesis",
      "rarity": "INCOMUM",
      "value": 20,
      "itemNumber": 61,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuz0u0031ick6zcd11ak7",
      "name": "Isqueiro Antigo Gênesis",
      "rarity": "INCOMUM",
      "value": 20,
      "itemNumber": 60,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuzkz0035ick6wb8qyd08",
      "name": "Lupa Reveladora Gênesis",
      "rarity": "INCOMUM",
      "value": 21,
      "itemNumber": 62,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuzv10037ick6ujsmiorj",
      "name": "Moeda do Início Gênesis",
      "rarity": "INCOMUM",
      "value": 21,
      "itemNumber": 63,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv0f9003bick6n6uf4xhh",
      "name": "Partitura Sagrada Gênesis",
      "rarity": "INCOMUM",
      "value": 22,
      "itemNumber": 65,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv0500039ick691np84kq",
      "name": "Óculos da Sabedoria Gênesis",
      "rarity": "INCOMUM",
      "value": 22,
      "itemNumber": 64,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv0pl003dick6gq4nr6ce",
      "name": "Sino de Prata Gênesis",
      "rarity": "INCOMUM",
      "value": 23,
      "itemNumber": 66,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv0zq003fick64z0nhl3q",
      "name": "Tinta Especial Gênesis",
      "rarity": "INCOMUM",
      "value": 23,
      "itemNumber": 67,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv19v003hick68j47squs",
      "name": "Traje Base Gênesis",
      "rarity": "INCOMUM",
      "value": 24,
      "itemNumber": 68,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv1jw003jick6fdkgb2yq",
      "name": "Vela Aromática Gênesis",
      "rarity": "INCOMUM",
      "value": 24,
      "itemNumber": 69,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv1u2003lick6mod3mtu2",
      "name": "Apito Mágico Gênesis",
      "rarity": "INCOMUM",
      "value": 25,
      "itemNumber": 70,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv24f003nick60tnnc3fh",
      "name": "Licor Raro Gênesis",
      "rarity": "INCOMUM",
      "value": 25,
      "itemNumber": 71,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv2oy003rick603rsdsvw",
      "name": "Bandana Colorida Gênesis",
      "rarity": "INCOMUM",
      "value": 26,
      "itemNumber": 73,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv2z4003tick6ea9qrz0m",
      "name": "Remo Dourado Gênesis",
      "rarity": "INCOMUM",
      "value": 26,
      "itemNumber": 74,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv2et003pick6ley5cxfu",
      "name": "Ioiô Encantado Gênesis",
      "rarity": "INCOMUM",
      "value": 26,
      "itemNumber": 72,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv3jw003xick67bbbcsj7",
      "name": "Cinto da Força Gênesis",
      "rarity": "INCOMUM",
      "value": 27,
      "itemNumber": 76,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv39c003vick6e6cba9ma",
      "name": "Quadro Ancestral Gênesis",
      "rarity": "INCOMUM",
      "value": 27,
      "itemNumber": 75,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv44g0041ick6cxilixih",
      "name": "Envelope Selado Gênesis",
      "rarity": "INCOMUM",
      "value": 28,
      "itemNumber": 78,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv3u9003zick63t9aja49",
      "name": "Dedal Encantado Gênesis",
      "rarity": "INCOMUM",
      "value": 28,
      "itemNumber": 77,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv4or0045ick67riwzjqc",
      "name": "Pena da Fênix Gênesis",
      "rarity": "INCOMUM",
      "value": 29,
      "itemNumber": 80,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcv4em0043ick60bespnlr",
      "name": "Fivela Reluzente Gênesis",
      "rarity": "INCOMUM",
      "value": 29,
      "itemNumber": 79,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcup9e0015ick6hahhk3uh",
      "name": "Amuleto dos Ancestrais Gênesis",
      "rarity": "RARO",
      "value": 30,
      "itemNumber": 26,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuptj0019ick6mafk3ot5",
      "name": "Chave dos Mistérios Gênesis",
      "rarity": "RARO",
      "value": 31,
      "itemNumber": 28,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcupje0017ick63104b0h2",
      "name": "Bússola Mística Gênesis",
      "rarity": "RARO",
      "value": 31,
      "itemNumber": 27,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuq3j001bick6pjkqkf41",
      "name": "Diário dos Fundadores Gênesis",
      "rarity": "RARO",
      "value": 32,
      "itemNumber": 29,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuqdp001dick63eaa84xe",
      "name": "Espelho da Verdade Gênesis",
      "rarity": "RARO",
      "value": 32,
      "itemNumber": 30,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuqyg001hick6xjq7e41n",
      "name": "Globo Cristalino Gênesis",
      "rarity": "RARO",
      "value": 33,
      "itemNumber": 32,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuqnt001fick61g4x32cf",
      "name": "Frasco da Essência Gênesis",
      "rarity": "RARO",
      "value": 33,
      "itemNumber": 31,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuriw001lick6mr46swq9",
      "name": "Ídolo Dourado Gênesis",
      "rarity": "RARO",
      "value": 34,
      "itemNumber": 34,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcur8l001jick6f23bfuzw",
      "name": "Harpa Celestial Gênesis",
      "rarity": "RARO",
      "value": 34,
      "itemNumber": 33,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcurt5001nick6f0z1z6f4",
      "name": "Joia da Sabedoria Gênesis",
      "rarity": "RARO",
      "value": 35,
      "itemNumber": 35,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcus37001pick6f2gsz03o",
      "name": "Kit do Alquimista Gênesis",
      "rarity": "RARO",
      "value": 35,
      "itemNumber": 36,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuso4001tick6yhyrx3t3",
      "name": "Núcleo de Energia Gênesis",
      "rarity": "RARO",
      "value": 36,
      "itemNumber": 38,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcusdm001rick696f58zc5",
      "name": "Mapa do Tesouro Gênesis",
      "rarity": "RARO",
      "value": 36,
      "itemNumber": 37,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcut8s001xick6l9yeq5ta",
      "name": "Pedra Filosofal Gênesis",
      "rarity": "RARO",
      "value": 37,
      "itemNumber": 40,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcusyk001vick6r1k99nlp",
      "name": "Ovo do Dragão Gênesis",
      "rarity": "RARO",
      "value": 37,
      "itemNumber": 39,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcutix001zick63ws8biro",
      "name": "Quartzo Rosa Gênesis",
      "rarity": "RARO",
      "value": 38,
      "itemNumber": 41,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcutsz0021ick6berq7158",
      "name": "Relógio Temporal Gênesis",
      "rarity": "RARO",
      "value": 39,
      "itemNumber": 42,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuu3c0023ick6rz7l6put",
      "name": "Selo do Imperador Gênesis",
      "rarity": "RARO",
      "value": 40,
      "itemNumber": 43,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuude0025ick69dnmqaoj",
      "name": "Tocha Eterna Gênesis",
      "rarity": "RARO",
      "value": 40,
      "itemNumber": 44,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuunh0027ick6md205oyf",
      "name": "Urna Sagrada Gênesis",
      "rarity": "RARO",
      "value": 41,
      "itemNumber": 45,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuuzr0029ick6z2ue961r",
      "name": "Vidro Espiritual Gênesis",
      "rarity": "RARO",
      "value": 42,
      "itemNumber": 46,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuvk1002dick6w6hnm5bs",
      "name": "Lâmina Yakuza Gênesis",
      "rarity": "RARO",
      "value": 43,
      "itemNumber": 48,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuv9w002bick6d9rf7jtv",
      "name": "Xale Protetor Gênesis",
      "rarity": "RARO",
      "value": 43,
      "itemNumber": 47,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuvuc002fick6geot758s",
      "name": "Lâmpada do Gênio Gênesis",
      "rarity": "RARO",
      "value": 44,
      "itemNumber": 49,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuw4f002hick647br590b",
      "name": "Zepelim em Miniatura Gênesis",
      "rarity": "RARO",
      "value": 45,
      "itemNumber": 50,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcujjl0001ick6z5n2h2dp",
      "name": "Arco Celestial Gênesis",
      "rarity": "EPICO",
      "value": 50,
      "itemNumber": 6,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcujty0003ick68jdcnk82",
      "name": "Armadura Dracônica Gênesis",
      "rarity": "EPICO",
      "value": 52,
      "itemNumber": 7,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuk450005ick6nixqrxyr",
      "name": "Escudo Primordial Gênesis",
      "rarity": "EPICO",
      "value": 53,
      "itemNumber": 8,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuke90007ick6jpaqqpwz",
      "name": "Cristal de Mana Gênesis",
      "rarity": "EPICO",
      "value": 55,
      "itemNumber": 9,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcukp60009ick6suhpm8le",
      "name": "Anel da Sabedoria Gênesis",
      "rarity": "EPICO",
      "value": 57,
      "itemNumber": 10,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcukzl000bick6oiusxyh1",
      "name": "Botas Aladas Gênesis",
      "rarity": "EPICO",
      "value": 58,
      "itemNumber": 11,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcul9t000dick6eladbxby",
      "name": "Espada dos Ancestrais Gênesis",
      "rarity": "EPICO",
      "value": 60,
      "itemNumber": 12,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkculgw000fick62vwho1ew",
      "name": "Gema do Tempo Gênesis",
      "rarity": "EPICO",
      "value": 62,
      "itemNumber": 13,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkculu0000hick6tiaqwz1w",
      "name": "Pergaminho Antigo Gênesis",
      "rarity": "EPICO",
      "value": 63,
      "itemNumber": 14,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcum44000jick67fx1kmqq",
      "name": "Martelo dos Titãs Gênesis",
      "rarity": "EPICO",
      "value": 65,
      "itemNumber": 15,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcume6000lick6qbm3m9ez",
      "name": "Lança do Destino Gênesis",
      "rarity": "EPICO",
      "value": 66,
      "itemNumber": 16,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcumob000nick6uwx4lc98",
      "name": "Cetro Real Gênesis",
      "rarity": "EPICO",
      "value": 68,
      "itemNumber": 17,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcumyk000pick61zew8lc0",
      "name": "Elmo Dourado Gênesis",
      "rarity": "EPICO",
      "value": 70,
      "itemNumber": 18,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcun8n000rick643pjgmmi",
      "name": "Adaga das Sombras Gênesis",
      "rarity": "EPICO",
      "value": 72,
      "itemNumber": 19,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuniy000tick66mz84jhw",
      "name": "Orbe do Poder Gênesis",
      "rarity": "EPICO",
      "value": 74,
      "itemNumber": 20,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcunt4000vick62szy9ysz",
      "name": "Luvas de Ferro Gênesis",
      "rarity": "EPICO",
      "value": 77,
      "itemNumber": 21,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuo3a000xick6ssf49qgn",
      "name": "Poção da Vida Gênesis",
      "rarity": "EPICO",
      "value": 79,
      "itemNumber": 22,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuodn000zick6mkr0vh9q",
      "name": "Colar Místico Gênesis",
      "rarity": "EPICO",
      "value": 81,
      "itemNumber": 23,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuont0011ick6vp0o1eul",
      "name": "Runas Sagradas Gênesis",
      "rarity": "EPICO",
      "value": 83,
      "itemNumber": 24,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcuoz20013ick68whu9j5y",
      "name": "Talismã Protetor Gênesis",
      "rarity": "EPICO",
      "value": 85,
      "itemNumber": 25,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkg4aqg0003ic4a5ac5aj0i",
      "name": "Escudo da Eternidade Gênesis",
      "rarity": "LENDARIO",
      "value": 180,
      "itemNumber": null,
      "isLimitedEdition": true,
      "isActive": true
    },
    {
      "id": "cmfkg4b3q0005ic4af1q3bak6",
      "name": "Armadura dos Primórdios Gênesis",
      "rarity": "LENDARIO",
      "value": 220,
      "itemNumber": null,
      "isLimitedEdition": true,
      "isActive": true
    },
    {
      "id": "cmfkg4bgr0007ic4af83f7lve",
      "name": "Anel do Destino Original Gênesis",
      "rarity": "LENDARIO",
      "value": 250,
      "itemNumber": null,
      "isLimitedEdition": true,
      "isActive": true
    },
    {
      "id": "cmfkg4ad90001ic4a5nezaixa",
      "name": "Espada Primordial do Gênesis",
      "rarity": "LENDARIO",
      "value": 280,
      "itemNumber": null,
      "isLimitedEdition": true,
      "isActive": true
    },
    {
      "id": "cmfkg4btt0009ic4awd4dej27",
      "name": "Livro das Origens Gênesis",
      "rarity": "LENDARIO",
      "value": 300,
      "itemNumber": null,
      "isLimitedEdition": true,
      "isActive": true
    },
    {
      "id": "cmfkctiq6000cichgt00vz7b0",
      "name": "Chave do Cosmos Gênesis",
      "rarity": "LENDARIO",
      "value": 400,
      "itemNumber": 5,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkctidg000aichgesifl5k9",
      "name": "Essência da Origem Gênesis",
      "rarity": "LENDARIO",
      "value": 450,
      "itemNumber": 4,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcth2x0004ichgo1351zup",
      "name": "Coroa Primordial Gênesis",
      "rarity": "LENDARIO",
      "value": 450,
      "itemNumber": 1,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcthsf0008ichg04aqj2ze",
      "name": "Cristal do Gênesis",
      "rarity": "LENDARIO",
      "value": 480,
      "itemNumber": 3,
      "isLimitedEdition": false,
      "isActive": true
    },
    {
      "id": "cmfkcthfr0006ichgo3ha5o1o",
      "name": "Alma do Primeiro Gênesis",
      "rarity": "LENDARIO",
      "value": 500,
      "itemNumber": 2,
      "isLimitedEdition": false,
      "isActive": true
    }
  ],
  "packs": [
    {
      "id": "cmfkac7o3000oich6l7jwgogp",
      "name": "Pacote Bronze",
      "type": "BRONZE",
      "price": 25,
      "isActive": true
    },
    {
      "id": "cmfkac88l000pich6oyvqchta",
      "name": "Pacote Prata",
      "type": "SILVER",
      "price": 35,
      "isActive": true
    },
    {
      "id": "cmfkac8t9000qich6gbun0wkt",
      "name": "Pacote Ouro",
      "type": "GOLD",
      "price": 45,
      "isActive": true
    },
    {
      "id": "cmfkac9gi000rich6tyn598hv",
      "name": "Pacote Platina",
      "type": "PLATINUM",
      "price": 75,
      "isActive": true
    },
    {
      "id": "cmfkaca5b000sich6l6jmg2x6",
      "name": "Pacote Diamante",
      "type": "DIAMOND",
      "price": 95,
      "isActive": true
    }
  ],
  "packProbabilities": [
    {
      "packType": "BRONZE",
      "rarity": "COMUM",
      "probability": 60
    },
    {
      "packType": "BRONZE",
      "rarity": "INCOMUM",
      "probability": 25
    },
    {
      "packType": "BRONZE",
      "rarity": "RARO",
      "probability": 10
    },
    {
      "packType": "BRONZE",
      "rarity": "EPICO",
      "probability": 4
    },
    {
      "packType": "BRONZE",
      "rarity": "LENDARIO",
      "probability": 1
    },
    {
      "packType": "SILVER",
      "rarity": "COMUM",
      "probability": 48
    },
    {
      "packType": "SILVER",
      "rarity": "INCOMUM",
      "probability": 30
    },
    {
      "packType": "SILVER",
      "rarity": "RARO",
      "probability": 16
    },
    {
      "packType": "SILVER",
      "rarity": "EPICO",
      "probability": 4
    },
    {
      "packType": "SILVER",
      "rarity": "LENDARIO",
      "probability": 2
    },
    {
      "packType": "GOLD",
      "rarity": "COMUM",
      "probability": 35
    },
    {
      "packType": "GOLD",
      "rarity": "INCOMUM",
      "probability": 32
    },
    {
      "packType": "GOLD",
      "rarity": "RARO",
      "probability": 22
    },
    {
      "packType": "GOLD",
      "rarity": "EPICO",
      "probability": 8
    },
    {
      "packType": "GOLD",
      "rarity": "LENDARIO",
      "probability": 3
    },
    {
      "packType": "PLATINUM",
      "rarity": "COMUM",
      "probability": 20
    },
    {
      "packType": "PLATINUM",
      "rarity": "INCOMUM",
      "probability": 32
    },
    {
      "packType": "PLATINUM",
      "rarity": "RARO",
      "probability": 28
    },
    {
      "packType": "PLATINUM",
      "rarity": "EPICO",
      "probability": 12
    },
    {
      "packType": "PLATINUM",
      "rarity": "LENDARIO",
      "probability": 8
    },
    {
      "packType": "DIAMOND",
      "rarity": "COMUM",
      "probability": 10
    },
    {
      "packType": "DIAMOND",
      "rarity": "INCOMUM",
      "probability": 25
    },
    {
      "packType": "DIAMOND",
      "rarity": "RARO",
      "probability": 32
    },
    {
      "packType": "DIAMOND",
      "rarity": "EPICO",
      "probability": 20
    },
    {
      "packType": "DIAMOND",
      "rarity": "LENDARIO",
      "probability": 13
    }
  ],
  "creditPackages": [
    {
      "id": "cmfke4oth0000icseywv8g5s4",
      "credits": 30,
      "priceInReais": 2.00,
      "efficiency": 15.00,
      "isActive": true
    },
    {
      "id": "cmfke4p4o0001icsedh96h668",
      "credits": 85,
      "priceInReais": 5.00,
      "efficiency": 17.00,
      "isActive": true
    },
    {
      "id": "cmfke4pfx0002icseohp4trg6",
      "credits": 180,
      "priceInReais": 10.00,
      "efficiency": 18.00,
      "isActive": true
    },
    {
      "id": "cmfke4pqv0003icse4aysfh6j",
      "credits": 380,
      "priceInReais": 20.00,
      "efficiency": 19.00,
      "isActive": true
    },
    {
      "id": "cmfke4q1m0004icse4r319tif",
      "credits": 600,
      "priceInReais": 30.00,
      "efficiency": 20.00,
      "isActive": true
    },
    {
      "id": "cmfke4qch0005icsex1zte0xn",
      "credits": 1050,
      "priceInReais": 50.00,
      "efficiency": 21.00,
      "isActive": true
    },
    {
      "id": "cmfke4qn90006icsenpm8qc8o",
      "credits": 2200,
      "priceInReais": 100.00,
      "efficiency": 22.00,
      "isActive": true
    }
  ]
};

async function restoreCompleteSystem() {
  try {
    console.log('🚀 Iniciando restauração completa do sistema...');

    // 1. Limpar dados existentes
    console.log('🗑️ Limpando dados existentes...');
    await prisma.userItem.deleteMany();
    await prisma.packProbability.deleteMany();
    await prisma.pack.deleteMany();
    await prisma.item.deleteMany();
    await prisma.creditPackage.deleteMany();

    // 2. Restaurar itens
    console.log('📦 Restaurando 110 itens da coleção Genesis...');
    for (const item of documentation.items) {
      await prisma.item.create({
        data: {
          id: item.id,
          name: item.name,
          rarity: item.rarity,
          value: item.value,
          itemNumber: item.itemNumber,
          isLimitedEdition: item.isLimitedEdition,
          isActive: item.isActive,
          imageUrl: `https://via.placeholder.com/300x400/4f46e5/ffffff?text=${encodeURIComponent(item.name)}`,
          scarcityLevel: item.isLimitedEdition ? "MYTHIC" : "COMMON"
        }
      });
    }

    // 3. Restaurar pacotes
    console.log('🎁 Restaurando 5 tipos de pacotes...');
    for (const pack of documentation.packs) {
      await prisma.pack.create({
        data: {
          id: pack.id,
          name: pack.name,
          type: pack.type,
          price: pack.price,
          isActive: pack.isActive
        }
      });
    }

    // 4. Restaurar probabilidades
    console.log('🎲 Restaurando probabilidades dos pacotes...');
    for (const prob of documentation.packProbabilities) {
      const pack = await prisma.pack.findFirst({
        where: { type: prob.packType }
      });
      if (pack) {
        await prisma.packProbability.create({
          data: {
            packId: pack.id,
            rarity: prob.rarity,
            percentage: prob.probability
          }
        });
      }
    }

    // 5. Restaurar pacotes de crédito
    console.log('💰 Restaurando 7 pacotes de crédito...');
    for (const creditPkg of documentation.creditPackages) {
      await prisma.creditPackage.create({
        data: {
          id: creditPkg.id,
          credits: creditPkg.credits,
          price: creditPkg.priceInReais,
          isActive: creditPkg.isActive
        }
      });
    }

    console.log('✅ Restauração completa finalizada!');
    console.log('📊 Resumo da restauração:');
    console.log(`   - 110 itens Genesis criados`);
    console.log(`   - 5 tipos de pacotes configurados`);
    console.log(`   - 25 configurações de probabilidade`);
    console.log(`   - 7 pacotes de crédito configurados`);

    // Verificação final
    const itemCount = await prisma.item.count();
    const packCount = await prisma.pack.count();
    const probCount = await prisma.packProbability.count();
    const creditCount = await prisma.creditPackage.count();

    console.log('\n🔍 Verificação final:');
    console.log(`   - Itens no banco: ${itemCount}/110`);
    console.log(`   - Pacotes no banco: ${packCount}/5`);
    console.log(`   - Probabilidades no banco: ${probCount}/25`);
    console.log(`   - Pacotes de crédito no banco: ${creditCount}/7`);

    if (itemCount === 110 && packCount === 5 && probCount === 25 && creditCount === 7) {
      console.log('🎉 Sistema completamente restaurado conforme documentação!');
    } else {
      console.log('⚠️ Alguns dados podem não ter sido restaurados corretamente.');
    }

  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreCompleteSystem();