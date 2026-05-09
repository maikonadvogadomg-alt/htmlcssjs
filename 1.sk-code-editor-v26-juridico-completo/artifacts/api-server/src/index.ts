import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, chmodSync, unlinkSync, mkdirSync, writeFileSync } from "node:fs";
import { join as pathJoin } from "node:path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const server = http.createServer(app);

// âââ WebSocket Terminal âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = req.url ?? "";
  if (url === "/api/ws/terminal" || url === "/ws/terminal" || url.endsWith("/ws/terminal")) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

// âââ Detectar modo de terminal disponivel ââââââââââââââââââââââââââââââââââââ
// Hierarquia:
//   1. pty_helper (C custom) â melhor: cores, resize, scrollback completo
//   2. script -q /dev/null   â bom: cria PTY sem precisar de gcc (disponÃ­vel em prod)
//   3. bash --login          â basico: sem PTY, sem cores, buffering limitado
const PTY_HELPER = path.resolve(__dirname, "../pty_helper");
const PTY_SRC    = path.resolve(__dirname, "../pty_helper.c");

type TermMode = "pty_helper" | "script" | "bash";

function detectTermMode(): TermMode {
  // Tentativa 1: compilar pty_helper.c fresh (se gcc disponivel)
  if (existsSync(PTY_SRC)) {
    try { if (existsSync(PTY_HELPER)) unlinkSync(PTY_HELPER); } catch { /* ok */ }
    for (const cc of ["gcc", "cc", "g++"]) {
      const r = spawnSync(cc, ["-O2", "-o", PTY_HELPER, PTY_SRC, "-lutil"], {
        stdio: "pipe", encoding: "utf8",
      });
      if (r.status === 0) {
        try { chmodSync(PTY_HELPER, 0o755); } catch { /* ok */ }
        logger.info({ compiler: cc }, "pty_helper compilado com sucesso");
        return "pty_helper";
      }
    }
  }

  // Tentativa 2: usar `script` (cria PTY sem gcc â disponivel em producao)
  const scriptCheck = spawnSync("which", ["script"], { stdio: "pipe", encoding: "utf8" });
  if (scriptCheck.status === 0 && scriptCheck.stdout.trim()) {
    logger.info("Terminal PTY via script command");
    return "script";
  }

  // Fallback: bash direto sem PTY
  logger.warn("Terminal em modo basico (sem PTY) â sem cores e buffering limitado");
  return "bash";
}

const TERM_MODE = detectTermMode();
logger.info({ mode: TERM_MODE }, "Modo de terminal selecionado");

// âââ Configuracao do shell ââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Workspace persistente do usuÃ¡rio â terminal comeÃ§a aqui, npm install funciona aqui
const WORKSPACE_DIR = process.env["SK_WORKSPACE_DIR"] ||
  pathJoin(process.env["HOME"] || process.env["REPL_HOME"] || "/home/runner", "sk-user-workspace");

if (!existsSync(WORKSPACE_DIR)) {
  try {
    mkdirSync(WORKSPACE_DIR, { recursive: true });
    const defaultPkg = JSON.stringify({
      name: "sk-projeto", version: "1.0.0", main: "index.js",
      scripts: { start: "node index.js", dev: "node index.js" },
      dependencies: {},
    }, null, 2);
    writeFileSync(pathJoin(WORKSPACE_DIR, "package.json"), defaultPkg, "utf8");
    logger.info({ dir: WORKSPACE_DIR }, "Workspace do usuÃ¡rio criado");
  } catch (err) {
    logger.warn({ err }, "NÃ£o foi possÃ­vel criar workspace â usando HOME como fallback");
  }
}

const cwd = existsSync(WORKSPACE_DIR) ? WORKSPACE_DIR :
  (process.env["HOME"] || process.env["REPL_HOME"] || "/home/runner");

const shellEnv = {
  ...process.env,
  TERM: "xterm-256color",
  COLORTERM: "truecolor",
  FORCE_COLOR: "3",
  LANG: "pt_BR.UTF-8",
  SHELL: process.env["SHELL"] || "/bin/bash",
};

// âââ WebSocket: uma sessao de terminal por conexao âââââââââââââââââââââââââââ
wss.on("connection", (ws: WebSocket) => {
  let cols = 220;
  let rows = 50;

  // ââ Keepalive: evita que o proxy de producao feche conexoes ociosas ââââââ
  // Envia um ping a cada 20s; se o cliente nao responder em 10s, encerra.
  let isAlive = true;
  ws.on("pong", () => { isAlive = true; });
  const keepAlive = setInterval(() => {
    if (!isAlive) { clearInterval(keepAlive); ws.terminate(); return; }
    isAlive = false;
    try { ws.ping(); } catch { clearInterval(keepAlive); }
  }, 20_000);
  ws.on("close", () => clearInterval(keepAlive));
  ws.on("error", () => clearInterval(keepAlive));

  // Monta o comando/args correto conforme o modo disponivel
  let shellCmd: string;
  let shellArgs: string[];

  if (TERM_MODE === "pty_helper") {
    shellCmd = PTY_HELPER;
    shellArgs = [String(rows), String(cols)];
  } else if (TERM_MODE === "script") {
    // `script -q /dev/null` cria um PTY sem precisar de gcc
    // -q: silencioso  -f: flush imediato (importante para output em tempo real)
    shellCmd = "/usr/bin/script";
    shellArgs = ["-q", "-f", "/dev/null", "--", "/bin/bash", "--login"];
  } else {
    shellCmd = "/bin/bash";
    shellArgs = ["--login"];
  }

  const shell = spawn(shellCmd, shellArgs, {
    cwd,
    env: shellEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Mensagem de boas-vindas com info do workspace (apÃ³s 500ms para o shell iniciar)
  setTimeout(() => {
    if (shell.stdin && !shell.killed) {
      shell.stdin.write(`echo -e "\\x1b[90mâââââââââââââââââââââââââââââââââââââââ\\r\\nð Workspace: ${cwd}\\r\\nð¡ 'node arquivo.js' ou 'python3 arquivo.py' â use Syncâ no editor primeiro!\\r\\nâââââââââââââââââââââââââââââââââââââââ\\x1b[0m"\r\n`);
    }
  }, 600);

  shell.on("error", (err) => {
    logger.error({ err, mode: TERM_MODE }, "Erro ao iniciar shell");
    // Se script falhou, tenta bash direto como ultimo recurso
    if (TERM_MODE === "script") {
      const fallback = spawn("/bin/bash", ["--login"], { cwd, env: shellEnv, stdio: ["pipe", "pipe", "pipe"] });
      const sendFb = (d: Buffer | string) => { if (ws.readyState === WebSocket.OPEN) ws.send(d instanceof Buffer ? d : Buffer.from(d)); };
      fallback.stdout?.on("data", (c: Buffer) => sendFb(c));
      fallback.stderr?.on("data", (c: Buffer) => sendFb(c));
      fallback.on("exit", (code) => { sendFb(`\r\n\x1b[90m[encerrado: ${code ?? 0}]\x1b[0m\r\n`); try { ws.close(); } catch { } });
      ws.on("message", (d: Buffer | string) => { try { fallback.stdin?.write(typeof d === "string" ? d : d); } catch { } });
      ws.on("close", () => { try { fallback.kill("SIGTERM"); } catch { } });
    } else {
      const msg = `\r\n\x1b[31m[Erro ao iniciar terminal: ${err.message}]\x1b[0m\r\n`;
      if (ws.readyState === WebSocket.OPEN) ws.send(Buffer.from(msg));
      ws.close();
    }
  });

  const send = (data: Buffer | string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data instanceof Buffer ? data : Buffer.from(data));
    }
  };

  shell.stdout?.on("data", (chunk: Buffer) => send(chunk));
  shell.stderr?.on("data", (chunk: Buffer) => send(chunk));

  shell.on("exit", (code: number | null) => {
    send(`\r\n\x1b[90m[processo encerrado com codigo ${code ?? 0}]\x1b[0m\r\n`);
    try { ws.close(); } catch { }
  });

  ws.on("message", (data: Buffer | string) => {
    try {
      const msg = typeof data === "string" ? data : data.toString();

      // Resize: {"type":"resize","cols":N,"rows":N}
      if (msg.startsWith("{") && msg.includes('"type":"resize"')) {
        try {
          const obj = JSON.parse(msg);
          if (obj.type === "resize" && obj.cols && obj.rows) {
            cols = Number(obj.cols);
            rows = Number(obj.rows);
            if (TERM_MODE === "pty_helper") {
              const resizeCmd = Buffer.concat([
                Buffer.from([0x00]),
                Buffer.from(`RESIZE:${rows}:${cols}\n`),
              ]);
              shell.stdin?.write(resizeCmd);
            }
          }
        } catch { /* ignore malformed resize */ }
        return;
      }

      shell.stdin?.write(typeof data === "string" ? data : data);
    } catch (err) {
      logger.warn({ err }, "Erro ao escrever no shell");
    }
  });

  ws.on("close", () => { try { shell.kill("SIGTERM"); } catch { } });
  ws.on("error", () => { try { shell.kill("SIGTERM"); } catch { } });
});

// âââ HTTP Listen ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
server.listen(port, (err?: Error) => {
  if (err) { logger.error({ err }, "Error listening"); process.exit(1); }
  logger.info({ port, mode: TERM_MODE }, "Server listening");
});
