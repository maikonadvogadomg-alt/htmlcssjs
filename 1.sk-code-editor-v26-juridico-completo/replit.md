# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Code Editor PWA (`artifacts/code-editor`)
- **Type**: React + Vite PWA
- **Preview path**: `/`
- **Description**: Mobile-first code editor (SK Code Editor) for Saulo Kenji (advogado, deficiÃªncia) with:
  - Monaco Editor for code editing
  - Virtual file system with file tree
  - **Real bash terminal via WebSocket PTY** (pty_helper.c compiled with gcc; falls back to bash if gcc unavailable in production)
  - Live HTML/CSS/JS preview
  - AI assistant "Jasmim" with full autonomous capabilities, 17-section system prompt, web search, and terminal feedback loop
  - **Web search** via `/api/search` (DuckDuckGo) and `/api/npm-search` (npm registry) - results injected into AI context
  - Voice interaction (OpenAI neural TTS via `/api/voice/speak`; Web Speech API for recognition)
  - GitHub integration (clone, push, create repos)
  - ZIP/TAR.GZ import/export
  - Checkpoint & task tracking panels
  - Project templates (HTML/CSS/JS, React, Node.js API, Python Flask, TypeScript, Empty)
  - PWA installable on mobile
  - All UI in Portuguese Brazilian (pt-BR)
- **Key deps**: `@monaco-editor/react`, `jszip`, `file-saver`, `lucide-react`, `@xterm/xterm`

### API Server (`artifacts/api-server`)
- **Type**: Node.js + Express (VM deployment for WebSocket support)
- **Port**: 8080
- **Key routes**:
  - `GET /api/healthz` â health check
  - `WS /api/ws/terminal` â real PTY terminal (pty_helper or bash fallback)
  - `GET /api/search?q=` â web search via DuckDuckGo
  - `GET /api/npm-search?q=` â npm package search
  - `POST /api/ai/chat` â AI chat proxy
- **PTY helper**: `pty_helper.c` compiled via gcc in `build.mjs`; if gcc unavailable, falls back to bash without PTY

## Key Commands

- `pnpm run typecheck` â full typecheck across all packages
- `pnpm run build` â typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` â regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` â push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` â run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
