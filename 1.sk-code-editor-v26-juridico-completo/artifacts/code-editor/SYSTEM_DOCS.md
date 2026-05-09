# SK Code Editor â DocumentaÃ§Ã£o do Sistema

> VersÃ£o atual Â· Editor de cÃ³digo mobile-first PWA com IA integrada

---

## Ãndice

1. [VisÃ£o Geral](#visÃ£o-geral)
2. [Arquitetura](#arquitetura)
3. [Gerenciamento de Projetos](#gerenciamento-de-projetos)
4. [Layout do Editor](#layout-do-editor)
5. [Assistente de IA](#assistente-de-ia)
6. [Terminal Integrado](#terminal-integrado)
7. [Preview ao Vivo](#preview-ao-vivo)
8. [GitHub e Git](#github-e-git)
9. [Voz e TTS](#voz-e-tts)
10. [PWA e InstalaÃ§Ã£o](#pwa-e-instalaÃ§Ã£o)
11. [FunÃ§Ãµes da IA â Capacidades e Limites](#funÃ§Ãµes-da-ia)
12. [Estrutura de Arquivos do Projeto](#estrutura-de-arquivos)

---

## VisÃ£o Geral

SK Code Editor Ã© um editor de cÃ³digo completo que roda no navegador, sem instalaÃ§Ã£o de backend. Funciona como PWA (Progressive Web App) instalÃ¡vel em Android e iOS. Todo o estado do projeto Ã© salvo no `localStorage` do navegador.

**Stack:** React 18 + Vite + TypeScript + Monaco Editor + Tailwind CSS

---

## Arquitetura

```
artifacts/code-editor/
âââ src/
â   âââ App.tsx                    # Roteamento: splash vs editor
â   âââ components/
â   â   âââ EditorLayout.tsx       # Layout 3 colunas (files|editor|AI)
â   â   âââ AIChat.tsx             # Painel de IA com escopo e voz
â   â   âââ FileTree.tsx           # Ãrvore de arquivos com menu de contexto
â   â   âââ CodeEditor.tsx         # Monaco Editor wrapper
â   â   âââ Terminal.tsx           # Terminal simulado (100+ comandos)
â   â   âââ Preview.tsx            # Iframe para preview de HTML
â   â   âââ GitHubPanel.tsx        # Clone / push para GitHub
â   â   âââ TemplateSelector.tsx   # Splash screen + lista de projetos
â   â   âââ QuickPrompt.tsx        # BotÃ£o flutuante de IA rÃ¡pida
â   â   âââ VoiceMode.tsx          # Interface de voz interativa
â   âââ lib/
â       âââ virtual-fs.ts          # Sistema de arquivos virtual (VFS)
â       âââ ai-service.ts          # 4 slots de API de IA configurÃ¡veis
â       âââ tts-service.ts         # TTS + reconhecimento de voz
â       âââ templates.ts           # 6 templates de projeto
â       âââ projects.ts            # Multi-projeto no localStorage
â       âââ zip-service.ts         # Importar/Exportar ZIP
â       âââ store.ts               # Estado persistido
```

---

## Gerenciamento de Projetos

### Criar projeto
- **Com IA:** Descreva em texto â a IA gera todos os arquivos automaticamente
- **Template:** 6 templates prontos (HTML, React, Node, Python, etc.)
- **Importar ZIP:** Sobe um arquivo .zip com a estrutura de pastas

### Lista de projetos (painel esquerdo da splash screen)
- Busca por nome
- Abrir, Copiar, Baixar ZIP, Excluir (menu â®)
- Salvo automaticamente no `localStorage`

### Auto-save
- Salva a cada 8 segundos
- Salva a cada alteraÃ§Ã£o no VFS

---

## Layout do Editor

### Estrutura 3 colunas

```
[Barra de Ãcones] [Painel de Arquivos] | [Editor de CÃ³digo] | [Painel de IA]
```

| Zona | Largura | ConteÃºdo |
|------|---------|----------|
| Strip de Ã­cones | 40px fixo | Files, GitHub, Terminal, Preview |
| Painel esquerdo | 240px (colapsÃ¡vel) | Ãrvore de arquivos ou GitHub |
| Editor central | flex-1 | Abas + Monaco Editor + status bar |
| Painel de IA | 288px (colapsÃ¡vel) | Chat, escopo, sugestÃµes |
| Painel inferior | ~55% altura | Terminal ou Preview |

### Barra de status (inferior)
- **Desfazer / Refazer** (Undo2/Redo2)
- **NavegaÃ§Ã£o histÃ³rica** â â entre arquivos visitados
- **Nome do arquivo ativo**
- **Seletor de codificaÃ§Ã£o** (UTF-8, UTF-16, Latin-1, ASCII)
- **Seletor de linguagem** (25 linguagens)
- **BotÃ£o â¶ Run** (verde) â executa o arquivo ativo no terminal ou preview

### AÃ§Ãµes do menu (â°)
- Novo Projeto
- Importar ZIP
- Exportar ZIP
- GitHub
- **Gerar DocumentaÃ§Ã£o** â cria `DOCS.md` e `README.md` no projeto
- Limpar Projeto

---

## Assistente de IA

### ConfiguraÃ§Ã£o (4 Slots)
Cada slot aceita: **OpenAI**, **Anthropic (Claude)**, **Google (Gemini)** ou **Custom / OpenRouter**

Configure em: painel de IA â âï¸ ConfiguraÃ§Ãµes

```
localStorage key: "ai-key-slots"
```

### Escopos de contexto da IA

| Escopo | O que a IA recebe |
|--------|------------------|
| ð Projeto | Todos os arquivos (atÃ© 20, 12.000 chars cada) |
| ð Pasta | Arquivos da pasta do arquivo ativo |
| ð Arquivo | Apenas o arquivo ativo (atÃ© 8.000 chars) |
| â Nenhum | Nenhum arquivo â conversa livre |

### Formato de resposta da IA

**Criar/editar arquivo** (aplicado automaticamente):
```
```filepath:caminho/arquivo.ext
conteÃºdo completo aqui
```
```

**Executar comando** (botÃ£o "Executar no Terminal"):
```
```bash
npm install express
```
```

### Tokens
- MÃ¡ximo de saÃ­da: **16.000 tokens** por resposta
- Contexto enviado: atÃ© **12.000 chars** de arquivos

### Bug Report
BotÃ£o ð no cabeÃ§alho do painel de IA â cria `.bugs/bug-TIMESTAMP.md` com contexto da conversa.

---

## Terminal Integrado

Terminal simulado em JavaScript com suporte a:

### Comandos principais
| Comando | DescriÃ§Ã£o |
|---------|-----------|
| `node arquivo.js` | Executa JS (simulado) |
| `python arquivo.py` | Executa Python (simulado) |
| `npm install pacote` | Instala pacote npm (simulado) |
| `pip install pacote` | Instala pacote pip (simulado) |
| `ls`, `cd`, `mkdir`, `rm` | NavegaÃ§Ã£o VFS |
| `cat arquivo` | Mostra conteÃºdo |
| `git init`, `git add`, `git commit` | Comandos Git |
| `youtube setup` | Gera projeto ytdl-core |
| `db neon`, `db supabase` | Templates de banco de dados |
| `help` | Lista todos os comandos |

### ExecuÃ§Ã£o em background
O terminal mantÃ©m estado mesmo ao trocar de aba. O componente fica montado na memÃ³ria.

---

## Preview ao Vivo

- **HTML:** renderiza em iframe sandboxado
- **JavaScript/TypeScript:** executa no terminal (simulado)
- **Outros:** abre o terminal com o comando correspondente

Acesse via: Ã­cone ð na barra lateral ou botÃ£o â¶ Run na status bar.

---

## GitHub e Git

### Painel GitHub
- Clone de repositÃ³rio pÃºblico (via API GitHub)
- Push de alteraÃ§Ãµes (requer token de acesso)
- Realiza commit diretamente pelo editor

### Requisitos
- Token GitHub com permissÃ£o `repo`
- RepositÃ³rio pÃºblico (clone sem token)

---

## Voz e TTS

### Entrada de voz (microfone)
- Clique no Ã­cone ð¤ no input do chat de IA
- Usa Web Speech API (nativo do navegador)
- Idioma padrÃ£o: pt-BR

### SaÃ­da de voz (TTS)
- Ativado pelo Ã­cone ð no cabeÃ§alho do chat
- Usa SpeechSynthesis API
- ConfigurÃ¡vel: idioma, velocidade
- LÃª apenas a parte textual das respostas (ignora cÃ³digo)

### Modo Voz Interativo
- BotÃ£o "Modo Voz" no chat â interface dedicada de push-to-talk

---

## PWA e InstalaÃ§Ã£o

O SK Code Editor Ã© instalÃ¡vel como aplicativo nativo:

- **Android:** banner "Adicionar Ã  tela inicial" automÃ¡tico
- **iOS/Safari:** menu compartilhar â "Adicionar Ã  tela de inÃ­cio"
- **Desktop:** Ã­cone de instalaÃ§Ã£o na barra de endereÃ§os

### Manifest
```
public/manifest.json â nome, Ã­cones, theme-color: #0d1117, display: standalone
```

---

## FunÃ§Ãµes da IA

### O que a IA pode fazer
â Criar arquivos completos e aplicÃ¡-los automaticamente no VFS  
â Editar arquivos existentes (gera o arquivo completo)  
â Sugerir comandos de terminal para o usuÃ¡rio executar  
â Instalar bibliotecas via npm/pip (comando no terminal)  
â Detectar bugs e sugerir correÃ§Ãµes  
â Gerar README, .gitignore, .env.example  
â Configurar bancos de dados (SQLite, PostgreSQL, MongoDB, Firebase, Supabase)  
â Implementar autenticaÃ§Ã£o (JWT, OAuth2, bcrypt)  
â Criar APIs REST completas  
â Gerar cÃ³digo em 25+ linguagens  

### LimitaÃ§Ãµes da IA
â NÃ£o executa cÃ³digo diretamente (apenas sugere comandos)  
â NÃ£o acessa a internet em tempo real (usa conhecimento do modelo)  
â NÃ£o pode instalar binÃ¡rios no sistema  
â NÃ£o pode ler arquivos > 12.000 chars por vez (trunca)  
â Limitado a 20 arquivos por contexto no escopo "Projeto"  
â NÃ£o tem acesso ao sistema operacional real  

---

## Estrutura de Arquivos

### VFS (Virtual File System)
Todos os arquivos vivem na memÃ³ria e no `localStorage`. NÃ£o hÃ¡ disco real.

```
localStorage keys:
  "sk-editor-projects"   â lista de projetos serializados
  "sk-editor-current"    â ID do projeto ativo
  "ai-key-slots"         â configuraÃ§Ãµes de API de IA
  "tts-config"           â configuraÃ§Ãµes de voz
```

### Pasta de Bugs
Ao clicar ð no chat de IA:
```
.bugs/
  bug-2026-01-15T14-30-00.md
  bug-2026-01-16T09-12-35.md
```

### DocumentaÃ§Ã£o gerada automaticamente
Ao clicar "Gerar DocumentaÃ§Ã£o" no menu â°:
```
DOCS.md    â estrutura do projeto, deps, scripts, limites da IA
README.md  â arquivo padrÃ£o de repositÃ³rio
```

---

*DocumentaÃ§Ã£o gerada em Abril/2026 Â· SK Code Editor v1.0*
