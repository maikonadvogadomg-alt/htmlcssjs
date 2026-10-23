# 📋 Plano do projeto: CodeLens-local-09-10-c

_Gerado em 13/10/2026, 11:11:10 — sem IA, lendo os arquivos._

## 📊 Visão geral
| Item | Valor |
|---|---|
| Arquivos | 158 |
| Linhas | 20.826 |
| Telas/páginas | 12 |
| Rotas do backend | 58 |
| Chamadas do app | 14 |
| Tabelas do banco | 4 |
| Variáveis de ambiente | 17 |

**Linguagens:** TypeScript (React) (77), TypeScript (32), Imagem (20), JavaScript (6), JSON (5), YAML (4), Imagem SVG (3), Outros (2), HTML (2), Batch (Windows) (2), Shell (2), Ícone (1), Markdown (1), CSS (1)

## 💡 O que fazer (em ordem)
1. 🧹 Tirar a Replit de 11 arquivo(s) (🏗️ Preparar → Fazer tudo)
2. 🔌 O app chama 1 endereço(s) que o backend deste projeto NÃO tem — veja "O que falta no backend"
3. 🔐 Criar um .env.example com: AI_INTEGRATIONS_GEMINI_API_KEY, AI_INTEGRATIONS_GEMINI_BASE_URL, BASE_URL, C, DATA_DIR, DEV, LOG_LEVEL, NODE_ENV, NO_BROWSER, PATH, PORT, PREFIX… (os valores você coloca no servidor, nunca no código)
4. 🗄️ Precisa de banco de dados (4 tabela(s)) — Neon ou Supabase servem, grátis
5. 📝 Criar um README.md explicando como rodar

## 🚀 Por onde começa
- `index.html`
- `lib/api-client-react/index.ts`
- `lib/api-zod/index.ts`
- `lib/db/index.ts`
- `server/app.ts`
- `server/index.ts`
- `server/routes/index.ts`
- `src/App.tsx`
- `src/main.tsx`

## ⌨️ Comandos (package.json)
| Pasta | Comando | O que roda |
|---|---|---|
| . | `npm run desktop` | `electron .` |
| . | `npm run exe` | `electron-builder --win portable --publish never` |
| . | `npm run iniciar` | `node scripts/iniciar.mjs` |
| . | `npm run start` | `tsx server/index.ts` |
| . | `npm run build` | `vite build` |
| . | `npm run dev` | `concurrently -k -n servidor,tela -c blue,magenta "npm:dev:servidor" "npm:dev:tela"` |
| . | `npm run dev:servidor` | `tsx watch --clear-screen=false server/index.ts` |
| . | `npm run dev:tela` | `vite` |
| . | `npm run checar` | `tsc --noEmit -p tsconfig.json` |

## 📱 Telas e páginas
| Endereço | Arquivo |
|---|---|
| `/` | src/App.tsx |
| `/projects/:id` | src/App.tsx |
| `/settings` | src/App.tsx |
| `/playground` | src/App.tsx |
| `/assistant` | src/App.tsx |
| `index.html` | index.html |
| `/assistant` | src/pages/assistant.tsx |
| `/home` | src/pages/home.tsx |
| `/not-found` | src/pages/not-found.tsx |
| `/playground` | src/pages/playground.tsx |
| `/project-explorer` | src/pages/project-explorer.tsx |
| `/settings` | src/pages/settings.tsx |

## 🖥️ Rotas do backend
| Método | Rota | Arquivo |
|---|---|---|
| USE | `/api` | server/app.ts |
| GET | `/` | server/app.ts |
| POST | `/ai/chat` | server/routes/ai.ts |
| POST | `/ai/analyze-file` | server/routes/ai.ts |
| POST | `/ai/analyze-folder` | server/routes/ai.ts |
| POST | `/ai/tts` | server/routes/ai.ts |
| POST | `/code-assistant` | server/routes/code-assistant.ts |
| POST | `/code/run` | server/routes/code-run.ts |
| POST | `/projects/:projectId/dev-server/start` | server/routes/dev-server.ts |
| DELETE | `/projects/:projectId/dev-server/stop` | server/routes/dev-server.ts |
| GET | `/projects/:projectId/dev-server/status` | server/routes/dev-server.ts |
| ALL | `/projects/:projectId/dev-proxy` | server/routes/dev-server.ts |
| ALL | `/projects/:projectId/dev-proxy/` | server/routes/dev-server.ts |
| ALL | `/projects/:projectId/dev-proxy/*path` | server/routes/dev-server.ts |
| ALL | `/projects/:projectId/port-proxy/:port{/*path}` | server/routes/dev-server.ts |
| POST | `/projects/:projectId/exec-stream` | server/routes/exec.ts |
| POST | `/projects/:projectId/exec` | server/routes/exec.ts |
| GET | `/projects/:projectId/files` | server/routes/files.ts |
| PUT | `/projects/:projectId/files` | server/routes/files.ts |
| DELETE | `/projects/:projectId/files` | server/routes/files.ts |
| POST | `/projects/:projectId/files/mkdir` | server/routes/files.ts |
| PATCH | `/projects/:projectId/files` | server/routes/files.ts |
| POST | `/projects/:projectId/files/copy` | server/routes/files.ts |
| GET | `/projects/:projectId/git/info` | server/routes/git.ts |
| GET | `/projects/:projectId/git/log` | server/routes/git.ts |
| GET | `/projects/:projectId/git/procurar` | server/routes/git.ts |
| GET | `/projects/:projectId/git/mudancas` | server/routes/git.ts |
| GET | `/projects/:projectId/git/arquivos` | server/routes/git.ts |
| GET | `/projects/:projectId/git/ver` | server/routes/git.ts |
| GET | `/projects/:projectId/git/diferencas` | server/routes/git.ts |
| POST | `/projects/:projectId/git/restaurar` | server/routes/git.ts |
| GET | `/projects/:projectId/git/zip` | server/routes/git.ts |
| GET | `/projects/:projectId/git/relatorio` | server/routes/git.ts |
| POST | `/projects/:projectId/git/importar-bundle` | server/routes/git.ts |
| POST | `/github/create-repo` | server/routes/github.ts |
| GET | `/github/conta` | server/routes/github.ts |
| POST | `/github/token` | server/routes/github.ts |
| DELETE | `/github/token` | server/routes/github.ts |
| GET | `/github/repos` | server/routes/github.ts |
| POST | `/github/enviar` | server/routes/github.ts |
| GET | `/healthz` | server/routes/health.ts |
| POST | `/projects/import-github` | server/routes/import-github.ts |
| GET | `/projects/:projectId/preview/status` | server/routes/preview.ts |
| GET | `/projects/:projectId/preview{/*path}` | server/routes/preview.ts |
| GET | `/projects` | server/routes/projects.ts |
| POST | `/projects` | server/routes/projects.ts |
| GET | `/` | server/routes/projects.ts |
| GET | `/api/hello` | server/routes/projects.ts |
| POST | `/projects/blank` | server/routes/projects.ts |
| GET | `/projects/:projectId` | server/routes/projects.ts |
| GET | `/projects/:projectId/download` | server/routes/projects.ts |
| DELETE | `/projects/:projectId` | server/routes/projects.ts |
| GET | `/settings` | server/routes/settings.ts |
| PUT | `/settings` | server/routes/settings.ts |
| GET | `/snippets` | server/routes/snippets.ts |
| POST | `/snippets` | server/routes/snippets.ts |
| PATCH | `/snippets/:id` | server/routes/snippets.ts |
| DELETE | `/snippets/:id` | server/routes/snippets.ts |

## 📡 O que o app pede ao servidor
| Método | Endereço | Onde |
|---|---|---|
| GET | `/api${path}` | lib/api-client-react/index.ts |
| POST | `/chat/completions` | server/routes/code-assistant.ts |
| GET | `/api/hello` | server/routes/projects.ts |
| POST | `/api/ai/tts` | src/components/ai-panel.tsx |
| GET | `/api/projects/${projectId}/files` | src/components/ai-panel.tsx |
| GET | `/api/projects/${projectId}/preview/status` | src/components/preview-panel.tsx |
| GET | `/api/projects/${projectId}/dev-server/status` | src/components/preview-panel.tsx |
| POST | `/api/projects/${projectId}/dev-server/start` | src/components/preview-panel.tsx |
| DELETE | `/api/projects/${projectId}/dev-server/stop` | src/components/preview-panel.tsx |
| POST | `/api/projects/${projectId}/exec-stream` | src/components/terminal-panel.tsx |
| POST | `/api/code-assistant` | src/pages/assistant.tsx |
| POST | `/api/projects/blank` | src/pages/home.tsx |
| GET | `/api/snippets` | src/pages/playground.tsx |
| GET | `/api/projects/${projectId}/download` | src/pages/project-explorer.tsx |

## 🔌 O que falta no backend
O app chama estes endereços, mas **nenhuma rota deste projeto responde**. Ou o backend ficou na Replit, ou está em outro projeto. Para recriar, cada linha vira uma rota:

| Método | Endereço | Quem chama |
|---|---|---|
| GET | `/api${path}` | lib/api-client-react/index.ts |

## 💤 Rotas que o app não usa
- GET `/` — server/app.ts
- POST `/ai/chat` — server/routes/ai.ts
- POST `/ai/analyze-file` — server/routes/ai.ts
- POST `/ai/analyze-folder` — server/routes/ai.ts
- POST `/code/run` — server/routes/code-run.ts
- ALL `/projects/:projectId/dev-proxy` — server/routes/dev-server.ts
- ALL `/projects/:projectId/dev-proxy/` — server/routes/dev-server.ts
- ALL `/projects/:projectId/dev-proxy/*path` — server/routes/dev-server.ts
- ALL `/projects/:projectId/port-proxy/:port{/*path}` — server/routes/dev-server.ts
- POST `/projects/:projectId/exec` — server/routes/exec.ts
- POST `/projects/:projectId/files/mkdir` — server/routes/files.ts
- POST `/projects/:projectId/files/copy` — server/routes/files.ts
- GET `/projects/:projectId/git/info` — server/routes/git.ts
- GET `/projects/:projectId/git/log` — server/routes/git.ts
- GET `/projects/:projectId/git/procurar` — server/routes/git.ts
- GET `/projects/:projectId/git/mudancas` — server/routes/git.ts
- GET `/projects/:projectId/git/arquivos` — server/routes/git.ts
- GET `/projects/:projectId/git/ver` — server/routes/git.ts
- GET `/projects/:projectId/git/diferencas` — server/routes/git.ts
- POST `/projects/:projectId/git/restaurar` — server/routes/git.ts
- GET `/projects/:projectId/git/zip` — server/routes/git.ts
- GET `/projects/:projectId/git/relatorio` — server/routes/git.ts
- POST `/projects/:projectId/git/importar-bundle` — server/routes/git.ts
- POST `/github/create-repo` — server/routes/github.ts
- GET `/github/conta` — server/routes/github.ts
- POST `/github/token` — server/routes/github.ts
- DELETE `/github/token` — server/routes/github.ts
- GET `/github/repos` — server/routes/github.ts
- POST `/github/enviar` — server/routes/github.ts
- GET `/healthz` — server/routes/health.ts
- POST `/projects/import-github` — server/routes/import-github.ts
- GET `/projects/:projectId/preview{/*path}` — server/routes/preview.ts
- GET `/projects` — server/routes/projects.ts
- POST `/projects` — server/routes/projects.ts
- GET `/` — server/routes/projects.ts
- GET `/projects/:projectId` — server/routes/projects.ts
- DELETE `/projects/:projectId` — server/routes/projects.ts
- GET `/settings` — server/routes/settings.ts
- PUT `/settings` — server/routes/settings.ts
- PATCH `/snippets/:id` — server/routes/snippets.ts
- DELETE `/snippets/:id` — server/routes/snippets.ts

## 🗄️ Banco de dados
- **projects** — lib/db/index.ts
- **project_files** — lib/db/index.ts
- **settings** — lib/db/index.ts
- **snippets** — lib/db/index.ts

## 🔐 Variáveis de ambiente (configurar no servidor)
- `AI_INTEGRATIONS_GEMINI_API_KEY`
- `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `BASE_URL`
- `C`
- `DATA_DIR`
- `DEV`
- `LOG_LEVEL`
- `NODE_ENV`
- `NO_BROWSER`
- `PATH`
- `PORT`
- `PREFIX`
- `PROD`
- `STORAGE_PATH`
- `TTS_TOM`
- `TTS_VELOCIDADE`
- `TTS_VOZ`

_Só os nomes. Os valores (chaves, senhas) nunca vão no código nem no GitHub._

## 🤖 IA usada
- Google Gemini
- generativelanguage.googleapis.com
- api.anthropic.com
- api.groq.com
- api.openai.com
- openrouter.ai

## 🌐 Serviços de fora que ele acessa
- api.anthropic.com
- api.exemplo.com
- api.github.com
- api.groq.com
- api.mistral.ai
- api.openai.com
- api.perplexity.ai
- api.x.ai
- cdnjs.cloudflare.com
- generativelanguage.googleapis.com
- github.com
- nodejs.org
- openrouter.ai
- registry.npmjs.org
- unpkg.com

## 📦 Peças principais (dependências)
`@capacitor/android` · `@capacitor/core` · `@codemirror/autocomplete` · `@codemirror/commands` · `@codemirror/lang-css` · `@codemirror/lang-html` · `@codemirror/lang-javascript` · `@codemirror/lang-json` · `@codemirror/lang-markdown` · `@codemirror/lang-python` · `@codemirror/lang-rust` · `@codemirror/lang-sql` · `@codemirror/language` · `@codemirror/state` · `@codemirror/theme-one-dark` · `@codemirror/view` · `@electric-sql/pglite` · `@google/genai` · `@octokit/rest` · `@radix-ui/react-accordion` · `@radix-ui/react-alert-dialog` · `@radix-ui/react-aspect-ratio` · `@radix-ui/react-avatar` · `@radix-ui/react-checkbox` · `@radix-ui/react-collapsible` · `@radix-ui/react-context-menu` · `@radix-ui/react-dialog` · `@radix-ui/react-dropdown-menu` · `@radix-ui/react-hover-card` · `@radix-ui/react-label` · `@radix-ui/react-menubar` · `@radix-ui/react-navigation-menu` · `@radix-ui/react-popover` · `@radix-ui/react-progress` · `@radix-ui/react-radio-group` · `@radix-ui/react-scroll-area` · `@radix-ui/react-select` · `@radix-ui/react-separator` · `@radix-ui/react-slider` · `@radix-ui/react-slot` · `@radix-ui/react-switch` · `@radix-ui/react-tabs` · `@radix-ui/react-toast` · `@radix-ui/react-toggle` · `@radix-ui/react-toggle-group` · `@radix-ui/react-tooltip` · `@tanstack/react-query` · `adm-zip` · `class-variance-authority` · `clsx` · `cmdk` · `cors` · `date-fns` · `drizzle-orm` · `embla-carousel-react` · `express` · `highlight.js` · `input-otp` · `lucide-react` · `mime-types` · `msedge-tts` · `multer` · `next-themes` · `pino` · `pino-http` · `pino-pretty` · `react` · `react-day-picker` · `react-dom` · `react-hook-form` · `react-markdown` · `react-resizable-panels` · `recharts` · `rehype-highlight` · `remark-gfm` · `sonner` · `tailwind-merge` · `tsx` · `vaul` · `wouter` · `zod`

## 🧹 Arquivos com coisa da Replit
- lib/api-client-react/index.ts
- lib/api-zod/index.ts
- lib/db/index.ts
- server/lib/storage.ts
- server/lib/tar.ts
- server/routes/code-assistant.ts
- server/routes/projects.ts
- service-worker.js
- src/components/ui/badge.tsx
- src/components/ui/button.tsx
- vite.config.ts

## 🔁 Roteiro para recriar fora da Replit
1. Importar o projeto no Mini SK e tocar em 🏗️ Preparar → ✅ Fazer tudo (tira a Replit, cria os arquivos que faltam).
2. Backend: escolher onde ele vai ficar ligado (Render/Railway grátis) — ou pedir à IA para transformar as rotas em funções do Netlify/Vercel, usando a tabela "O que falta no backend".
3. Banco: criar no Neon ou Supabase e colocar o endereço na variável de ambiente do servidor.
4. Variáveis: cadastrar 17 variável(is) no servidor (lista acima).
5. Testar a prévia; se der erro, 🤖 Mandar os erros para a IA.
6. App: 📲 Instalável (PWA), 📦 APK ou 🖥️ Desktop (.exe) pelo 🏗️ Preparar.

## 🌳 Árvore de arquivos
```
├─ 📁 .github/
│  └─ 📁 workflows/
│     ├─ apk-capacitor.yml
│     ├─ desktop-exe.yml
│     ├─ teste.yml
│     └─ windows.yml
├─ 📁 electron/
│  ├─ main.cjs
│  └─ preload.cjs
├─ 📁 icons/
│  ├─ apple-touch-icon.png
│  ├─ icon-128.png
│  ├─ icon-144.png
│  ├─ icon-152.png
│  ├─ icon-16.png
│  ├─ icon-180.png
│  ├─ icon-192.png
│  ├─ icon-32.png
│  ├─ icon-384.png
│  ├─ icon-48.png
│  ├─ icon-512.png
│  ├─ icon-72.png
│  ├─ icon-96.png
│  ├─ icon.svg
│  ├─ maskable-192.png
│  ├─ maskable-512.png
│  └─ maskable.svg
├─ 📁 lib/
│  ├─ 📁 api-client-react/
│  │  └─ index.ts
│  ├─ 📁 api-zod/
│  │  └─ index.ts
│  └─ 📁 db/
│     └─ index.ts
├─ 📁 public/
│  ├─ 📁 icons/
│  │  ├─ icon-192.png
│  │  ├─ icon-512.png
│  │  ├─ icon.ico.png
│  │  └─ icon.png
│  ├─ favicon.svg
│  ├─ manifest.json
│  ├─ opengraph.jpg
│  └─ sw.js
├─ 📁 scripts/
│  ├─ abrir-pronto.mjs
│  └─ iniciar.mjs
├─ 📁 server/
│  ├─ 📁 lib/
│  │  ├─ devServerRegistry.ts
│  │  ├─ gemini-ponte.ts
│  │  ├─ logger.ts
│  │  ├─ persistFiles.ts
│  │  ├─ shell.ts
│  │  ├─ storage.ts
│  │  ├─ tar.ts
│  │  └─ tts.ts
│  ├─ 📁 routes/
│  │  ├─ ai.ts
│  │  ├─ code-assistant.ts
│  │  ├─ code-run.ts
│  │  ├─ dev-server.ts
│  │  ├─ exec.ts
│  │  ├─ files.ts
│  │  ├─ git.ts
│  │  ├─ github.ts
│  │  ├─ health.ts
│  │  ├─ import-github.ts
│  │  ├─ index.ts
│  │  ├─ preview.ts
│  │  ├─ projects.ts
│  │  ├─ settings.ts
│  │  └─ snippets.ts
│  ├─ app.ts
│  └─ index.ts
├─ 📁 src/
│  ├─ 📁 components/
│  │  ├─ 📁 ui/
│  │  │  ├─ accordion.tsx
│  │  │  ├─ alert-dialog.tsx
│  │  │  ├─ alert.tsx
│  │  │  ├─ aspect-ratio.tsx
│  │  │  ├─ avatar.tsx
│  │  │  ├─ badge.tsx
│  │  │  ├─ breadcrumb.tsx
│  │  │  ├─ button-group.tsx
│  │  │  ├─ button.tsx
│  │  │  ├─ calendar.tsx
│  │  │  ├─ card.tsx
│  │  │  ├─ carousel.tsx
│  │  │  ├─ chart.tsx
│  │  │  ├─ checkbox.tsx
│  │  │  ├─ collapsible.tsx
│  │  │  ├─ command.tsx
│  │  │  ├─ context-menu.tsx
│  │  │  ├─ dialog.tsx
│  │  │  ├─ drawer.tsx
│  │  │  ├─ dropdown-menu.tsx
│  │  │  ├─ empty.tsx
│  │  │  ├─ field.tsx
│  │  │  ├─ form.tsx
│  │  │  ├─ hover-card.tsx
│  │  │  ├─ input-group.tsx
│  │  │  ├─ input-otp.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ item.tsx
│  │  │  ├─ kbd.tsx
│  │  │  ├─ label.tsx
│  │  │  ├─ menubar.tsx
│  │  │  ├─ navigation-menu.tsx
│  │  │  ├─ pagination.tsx
│  │  │  ├─ popover.tsx
│  │  │  ├─ progress.tsx
│  │  │  ├─ radio-group.tsx
│  │  │  ├─ resizable.tsx
│  │  │  ├─ scroll-area.tsx
│  │  │  ├─ select.tsx
│  │  │  ├─ separator.tsx
│  │  │  ├─ sheet.tsx
│  │  │  ├─ sidebar.tsx
│  │  │  ├─ skeleton.tsx
│  │  │  ├─ slider.tsx
│  │  │  ├─ sonner.tsx
│  │  │  ├─ spinner.tsx
│  │  │  ├─ switch.tsx
│  │  │  ├─ table.tsx
│  │  │  ├─ tabs.tsx
│  │  │  ├─ textarea.tsx
│  │  │  ├─ toast.tsx
│  │  │  ├─ toaster.tsx
│  │  │  ├─ toggle-group.tsx
│  │  │  ├─ toggle.tsx
│  │  │  └─ tooltip.tsx
│  │  ├─ ai-panel.tsx
│  │  ├─ code-editor.tsx
│  │  ├─ code-viewer.tsx
│  │  ├─ error-boundary.tsx
│  │  ├─ file-tree.tsx
│  │  ├─ git-history-modal.tsx
│  │  ├─ github-conta.tsx
│  │  ├─ github-deploy-modal.tsx
│  │  ├─ layout.tsx
│  │  ├─ packages-panel.tsx
│  │  ├─ preview-panel.tsx
│  │  ├─ terminal-panel.tsx
│  │  └─ theme-provider.tsx
│  ├─ 📁 hooks/
│  │  ├─ use-file-ops.ts
│  │  ├─ use-mobile.tsx
│  │  └─ use-toast.ts
│  ├─ 📁 lib/
│  │  └─ utils.ts
│  ├─ 📁 pages/
│  │  ├─ assistant.tsx
│  │  ├─ home.tsx
│  │  ├─ not-found.tsx
│  │  ├─ playground.tsx
│  │  ├─ project-explorer.tsx
│  │  └─ settings.tsx
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ 📁 windows/
│  └─ Abrir-CodeLens.bat
├─ .gitignore
├─ .npmrc
├─ 404.html
├─ capacitor.config.json
├─ favicon.ico
├─ index.html
├─ iniciar.bat
├─ iniciar.sh
├─ LEIA-ME.md
├─ manifest.json
├─ package.json
├─ service-worker.js
├─ termux-atalho.sh
├─ tsconfig.json
└─ vite.config.ts
```
