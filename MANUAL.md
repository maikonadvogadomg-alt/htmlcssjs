# 📖 Manual do Desenvolvedor — SK Code Editor
> Guia em linguagem simples para entender o que cada coisa significa.
> Sem jargão técnico. Feito para você, Saulo.

---

## 🗂️ O que significa cada pasta aqui no Replit

### 📁 `artifacts/`
É a pasta principal do projeto. Dentro dela ficam as duas partes do aplicativo:

- **`api-server/`** → O **servidor** (o "motor" que roda por trás das cenas).
  Ele é quem executa comandos no terminal, faz conexão com banco de dados, e responde as chamadas do app.
  Pense nele como a **cozinha de um restaurante** — o cliente não vê, mas é ele que faz tudo funcionar.

- **`code-editor/`** → A **interface visual** (o que você vê na tela).
  É o editor de código, os painéis, os botões, a Jasmim, o terminal, o preview.
  Pense nele como o **salão do restaurante** — o que o cliente vê e usa.

---

### 📁 `src/` (dentro de cada artifact)
Significa **"source"** = código-fonte. É onde fica o código que você escreve/edita.
Nunca apague essa pasta — é o coração do projeto.

---

### 📁 `src/components/`
São as **peças visuais** da tela. Cada arquivo aqui é um "pedaço" da interface:
- `EditorLayout.tsx` → A tela principal do editor (organiza tudo)
- `AIChat.tsx` → O painel da Jasmim (assistente IA)
- `RealTerminal.tsx` → O terminal (onde você roda comandos)
- `Preview.tsx` → O painel de visualização do site/app
- `FileTree.tsx` → A árvore de arquivos (painel esquerdo)
- `GitHubPanel.tsx` → O painel de integração com o GitHub

---

### 📁 `src/routes/` (só no api-server)
São os **endereços** que o servidor responde. Como as "portas" de entrada do servidor.
Exemplos:
- `/api/exec` → Roda um comando no terminal
- `/api/db/query` → Faz uma consulta no banco de dados
- `/api/ai/chat` → Conversa com a IA (Jasmim)
- `/api/ws/terminal` → Abre o terminal ao vivo

---

### 📁 `src/lib/`
São **funções utilitárias** — ferramentas pequenas usadas em vários lugares do código.
Exemplo: `virtual-fs.ts` é o sistema de arquivos virtual (salva seus arquivos na memória do browser).

---

### 📁 `public/`
Arquivos **públicos** que o browser pode acessar diretamente:
- `manifest.json` → Configuração do PWA (ícone, nome, cor do app)
- `icons/` → Os ícones do app (aparecem na tela inicial do celular)
- Imagens e arquivos estáticos

---

### 📁 `node_modules/`
**NÃO MEXA AQUI.** São as bibliotecas externas instaladas automaticamente.
É como a "despensa" do projeto — cheia de ingredientes prontos.
Gerada automaticamente pelo `npm install` / `pnpm install`.

---

### 📁 `dist/`
Versão **compilada** do código (gerada automaticamente ao fazer o build).
Você não edita nada aqui — é criado pelo sistema na hora de publicar.

---

## 📄 O que significa cada tipo de arquivo

| Arquivo | O que é |
|---------|---------|
| `package.json` | Lista de bibliotecas usadas e comandos disponíveis (npm start, npm run build, etc.) |
| `pnpm-workspace.yaml` | Diz ao gerenciador de pacotes quais pastas fazem parte do projeto |
| `tsconfig.json` | Configuração do TypeScript (linguagem que usamos) |
| `vite.config.ts` | Configuração do servidor de desenvolvimento (serve o app no browser) |
| `.env` | Variáveis secretas (senhas, chaves de API) — nunca compartilhe esse arquivo |
| `*.tsx` | Código React (interface visual com TypeScript) |
| `*.ts` | Código TypeScript puro (lógica, sem visual) |
| `*.yaml` / `*.yml` | Arquivos de configuração (como uma lista de instruções formatada) |
| `*.md` | Markdown — texto formatado (como este manual!) |
| `index.ts` / `index.tsx` | **Ponto de entrada** — onde o programa começa a rodar |

---

## 🪝 O que são "Hooks" (`use*.ts` / `use*.tsx`)
São funções especiais do React que **guardam estado** ou **executam ações**.
Sempre começam com a palavra `use`.
Exemplos:
- `useState` → Guarda um valor que muda (ex: se o painel está aberto ou fechado)
- `useEffect` → Executa algo quando a tela carrega ou um valor muda
- `useCallback` → Otimiza uma função para não recriar desnecessariamente

---

## 🎛️ Painéis do SK Code Editor

| Painel | Como abrir | O que faz |
|--------|-----------|----------|
| **Arquivos** | Botão 📁 no rodapé | Mostra todos os arquivos do projeto |
| **Terminal** | Botão ⬛ no rodapé | Executa comandos (npm install, node server.js, etc.) |
| **Preview** | Botão 🌐 no rodapé | Mostra o site/app rodando ao vivo |
| **Jasmim (IA)** | Botão 🤖 no rodapé | Assistente de código com IA |
| **GitHub** | Menu ··· | Importa/exporta projetos do GitHub |
| **Banco de Dados** | Menu ··· | Conecta ao PostgreSQL/Neon e roda SQL |
| **Taski** | Menu ··· | Lista de tarefas do projeto |
| **Checkpoints** | Menu ··· | Histórico de versões salvas manualmente |

---

## 🧩 Glossário Rápido

| Termo | Significado simples |
|-------|-------------------|
| **API** | "Porta de comunicação" entre o app e o servidor |
| **WebSocket** | Conexão ao vivo (sem precisar ficar atualizando a página) |
| **PTY / Terminal** | Janela de linha de comando (como o Prompt do Windows, mas no Linux) |
| **VFS** | Sistema de arquivos virtual — os arquivos ficam na memória do browser |
| **PWA** | "Aplicativo instalável" — site que funciona como app no celular |
| **Build** | Processo de "empacotar" o código para publicar |
| **Deploy** | Publicar o app na internet |
| **Frontend** | A parte visual (o que o usuário vê) |
| **Backend** | A parte do servidor (o "motor" escondido) |
| **npm / pnpm** | Gerenciadores de pacotes — instalam bibliotecas externas |
| **Import** | Usar uma função/componente de outro arquivo |
| **Props** | Dados passados de um componente pai para um filho |
| **Estado (State)** | Valor que pode mudar e atualiza a tela automaticamente |
| **Render** | O processo de mostrar/atualizar a tela |

---

## 🔑 O que é o Replit (a plataforma)

O **Replit** é o ambiente onde o app roda durante o desenvolvimento. Ele fornece:
- Servidor Linux online (sem precisar de computador próprio)
- Editor de código no browser
- Gerenciamento de segredos (variáveis de ambiente)
- Publicação do app com um clique (Publish/Deploy)
- Checkpoints automáticos do código

---

*Manual gerado em 13 de abril de 2026 — SK Code Editor*
