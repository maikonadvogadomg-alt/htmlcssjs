# Assistente JurÃ­dico â App Mobile

App React Native (Expo) para processamento de peÃ§as jurÃ­dicas com IA.
Feito para Maikon Caldeira â OAB/MG 183712.

## Funcionalidades

### Consulta (tela principal)
- Corrigir Texto, RedaÃ§Ã£o JurÃ­dica, Verificar Lacunas
- Resumir, Revisar, Refinar, Linguagem Simples, Gerar Minuta, Analisar
- Ditado por voz (Whisper via Groq â gratuito)
- Importar arquivos de texto (suporte a arquivos grandes)
- HistÃ³rico de processamentos
- Trechos salvos (snippets)
- Exportar resultado

### Campo Livre
- Chat livre com a Jasmim (assistente jurÃ­dica IA)
- DetecÃ§Ã£o automÃ¡tica de blocos de cÃ³digo
- Importar arquivos para o contexto
- Exportar conversa completa
- Controle de tamanho da resposta (Conciso / Normal / Detalhado / MÃ¡ximo)
- Leitura em voz das respostas

### PDPJ
- Token JWT salvo localmente no dispositivo
- Teste de conexÃ£o com o portal
- InstruÃ§Ãµes de como obter o token

### TramitaÃ§Ã£o
- Acesso rÃ¡pido aos portais de consulta processual (TJMG, CNJ, STJ, STF, TRT)

### ConfiguraÃ§Ãµes
- **Chave 1 e Chave 2**: cole qualquer chave â o provedor Ã© detectado automaticamente
- Senha de acesso opcional (salva localmente)
- Banco Neon (opcional â para sincronizar entre dispositivos)
- Controle de voz (TTS) e velocidade

## Provedores suportados (auto-detectados pela chave)

| Prefixo | Provedor | Custo |
|---------|----------|-------|
| `gsk_...` | Groq (llama-3.3-70b) | **GRATUITO** |
| `AIza...` | Google Gemini 2.0 Flash | **GRATUITO** |
| `sk-or-...` | OpenRouter | Variado |
| `sk-ant...` | Anthropic Claude | Pago |
| `pplx-...` | Perplexity (busca web) | Pago |
| `xai-...` | xAI Grok | Pago |
| `sk-...` | OpenAI GPT-4o | Pago |

## Como instalar e gerar APK

### Requisitos
- Node.js 18+
- Conta no Expo (expo.dev)
- Conta no EAS (para gerar APK)

### InstalaÃ§Ã£o
```bash
npm install
npx expo start
```

### Gerar APK (Android)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Gerar APK de preview (para instalar direto no celular)
npx eas build --platform android --profile preview

# Gerar AAB para Google Play
npx eas build --platform android --profile production
```

## ConfiguraÃ§Ã£o do Banco Neon (opcional)

1. Acesse https://neon.tech e crie uma conta gratuita
2. Crie um projeto e copie a "Connection string"
3. Abra o arquivo `SQL_SETUP.sql` e execute no SQL Editor do Neon
4. Cole a Connection string nas ConfiguraÃ§Ãµes do app

## Estrutura do projeto

```
app/
  (tabs)/
    index.tsx       â Consulta principal
    campo-livre.tsx â Chat livre
    pdpj.tsx        â Token PDPJ
    tramitacao.tsx  â Links de tramitaÃ§Ã£o
    config.tsx      â ConfiguraÃ§Ãµes
  config-inicial.tsx â Primeira abertura
  login.tsx          â Tela de senha
src/
  services/
    ai.ts          â IntegraÃ§Ã£o com IA (multi-provedor)
    storage.ts     â AsyncStorage (salva tudo localmente)
    voice.ts       â TTS (texto para voz)
  components/
    ResultCard.tsx  â Card de resultado com aÃ§Ãµes
    CodeBlock.tsx   â Bloco de cÃ³digo com destaque
    VoiceButton.tsx â BotÃ£o de gravaÃ§Ã£o
  constants/
    colors.ts      â Paleta de cores
    prompts.ts     â Prompts jurÃ­dicos
SQL_SETUP.sql      â Script do banco Neon
```

## ObservaÃ§Ãµes

- **Zero dependÃªncia de servidor**: todas as chamadas de IA vÃ£o direto do celular para os provedores
- **Salvo localmente**: chaves, histÃ³rico e configuraÃ§Ãµes ficam no AsyncStorage do dispositivo
- **Sem Replit**: funciona em qualquer ambiente (Expo Go, APK, Play Store)
