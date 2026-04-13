import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

type Status = "connecting" | "connected" | "disconnected" | "error";

interface Props {
  onFallback?: () => void;
  externalCommand?: string;
  onCommandExecuted?: () => void;
  onCommandOutput?: (cmd: string, output: string, exitedClean: boolean) => void;
  onServerToggle?: (running: boolean, port?: number) => void;
  onBufferUpdate?: (buffer: string, hasError: boolean) => void;
}

// Tempo máximo que uma instalação pode demorar: 10 minutos
const CMD_TIMEOUT_MS = 600_000;

// Padrões que indicam um servidor rodando: "listening on port 3000", ":3000", "localhost:3000", etc.
const SERVER_PORT_RE = /(?:listen(?:ing)?(?:\s+on)?(?:\s+port)?|started(?:\s+on)?|running(?:\s+on)?(?:\s+port)?|\bport\b|localhost|127\.0\.0\.1|0\.0\.0\.0|Local:|Network:|➜)\s*[:\s]*(?:https?:\/\/(?:localhost|127\.0\.0\.1))?:(\d{4,5})/i;
const SERVER_STOP_RE = /(?:SIGTERM|SIGINT|server\s+(?:closed|stopped|killed)|process\s+exit)/i;

// Padrões de erro comuns em terminais
const ERROR_RE = /(?:error|erro|exception|traceback|fatal|command not found|cannot find|failed|falhou|ENOENT|EACCES|SyntaxError|TypeError|ReferenceError|ModuleNotFoundError|ImportError)/i;

export default function RealTerminal({ onFallback, externalCommand, onCommandExecuted, onCommandOutput, onServerToggle, onBufferUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [runningCmd, setRunningCmd] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onServerToggleRef = useRef(onServerToggle);
  useEffect(() => { onServerToggleRef.current = onServerToggle; }, [onServerToggle]);
  const onBufferUpdateRef = useRef(onBufferUpdate);
  useEffect(() => { onBufferUpdateRef.current = onBufferUpdate; }, [onBufferUpdate]);
  // Buffer global de todo o output do terminal (últimos 6000 chars)
  const globalBufferRef = useRef<string>("");
  const bufferFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Captura de output: acumula tudo que vem do terminal enquanto roda um cmd
  const currentCmdRef = useRef<string | null>(null);
  const outputBufferRef = useRef<string>("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quando ficar 4s sem saída, considera que o comando terminou
  const scheduleOutputFlush = (cmd: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      const out = outputBufferRef.current.slice(0, 8000); // máx 8k chars
      const clean = out.includes("$") || out.includes("#") || out.includes("✓") || out.includes("added ");
      onCommandOutput?.(cmd, out, clean);
      currentCmdRef.current = null;
      outputBufferRef.current = "";
      setRunningCmd(null);
    }, 4000);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
      theme: {
        background: "#141c0d",
        foreground: "#c8dda8",
        cursor: "#88c060",
        cursorAccent: "#141c0d",
        selectionBackground: "#3d5c28",
        black: "#141c0d",
        red: "#e06c75",
        green: "#88c060",
        yellow: "#e5c07b",
        blue: "#61afef",
        magenta: "#c678dd",
        cyan: "#56b6c2",
        white: "#abb2bf",
        brightBlack: "#5c6370",
        brightRed: "#e06c75",
        brightGreen: "#98c379",
        brightYellow: "#e5c07b",
        brightBlue: "#61afef",
        brightMagenta: "#c678dd",
        brightCyan: "#56b6c2",
        brightWhite: "#ffffff",
      },
      allowProposedApi: true,
      scrollback: 10000,
      convertEol: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);
    termRef.current = term;

    setTimeout(() => {
      try { fitAddon.fit(); } catch { }
    }, 50);

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/api/ws/terminal`;

    let connectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      setStatus("connecting");
      term.writeln("\x1b[90m[Conectando ao terminal...]\x1b[0m\r\n");

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setStatus("error");
          term.writeln("\r\n\x1b[31m[Conexão esgotou — servidor não respondeu em 6s]\x1b[0m");
          term.writeln("\x1b[33m[Clique em ↺ Reconectar na barra acima para tentar de novo]\x1b[0m\r\n");
          term.writeln("\x1b[90m[Ou aguarde — voltando ao terminal básico...]\x1b[0m\r\n");
          onFallback?.();
        }
      }, 6000);

      ws.onopen = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        setStatus("connected");
        term.writeln("\x1b[32m[Terminal bash conectado ✓]\x1b[0m\r\n");
      };

      ws.onmessage = (e: MessageEvent) => {
        let text = "";
        if (e.data instanceof ArrayBuffer) {
          const arr = new Uint8Array(e.data);
          term.write(arr);
          text = new TextDecoder().decode(arr);
        } else {
          term.write(e.data as string);
          text = e.data as string;
        }

        // Remove códigos ANSI para ter texto limpo
        const plain = text.replace(/\x1b\[[0-9;]*[mGKHJA-Za-z]/g, "").replace(/\r/g, "");

        // Detecta servidor Node.js iniciado: "listening on port 3000", ":3000", etc.
        const portMatch = plain.match(SERVER_PORT_RE);
        if (portMatch) {
          const port = Number(portMatch[1]);
          if (port >= 1024 && port < 65535) {
            onServerToggleRef.current?.(true, port);
          }
        }
        // Detecta quando servidor para
        if (SERVER_STOP_RE.test(plain)) {
          onServerToggleRef.current?.(false);
        }

        // ── Buffer global: acumula TODO output do terminal ──
        globalBufferRef.current = (globalBufferRef.current + plain).slice(-6000);
        const hasErr = ERROR_RE.test(plain);
        // Debounce: dispara onBufferUpdate 1.5s após última saída
        if (bufferFlushTimerRef.current) clearTimeout(bufferFlushTimerRef.current);
        bufferFlushTimerRef.current = setTimeout(() => {
          onBufferUpdateRef.current?.(globalBufferRef.current, hasErr || ERROR_RE.test(globalBufferRef.current.slice(-1000)));
        }, 1500);

        // Captura output enquanto há um comando rodando
        if (currentCmdRef.current) {
          outputBufferRef.current += plain;
          scheduleOutputFlush(currentCmdRef.current);
        }
      };

      ws.onclose = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        setStatus("disconnected");
        setRunningCmd(null);
        currentCmdRef.current = null;
        term.writeln("\r\n\x1b[90m[Sessão encerrada]\x1b[0m\r\n");
      };

      ws.onerror = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        setStatus("error");
        setRunningCmd(null);
        term.writeln("\r\n\x1b[31m[Não foi possível conectar ao servidor de terminal]\x1b[0m");
        term.writeln("\x1b[33m[Voltando ao terminal simulado...]\x1b[0m\r\n");
        setTimeout(() => onFallback?.(), 1500);
      };
    };

    term.onData((data: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const ro = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch { }
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN && term.cols && term.rows) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    connect();

    return () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      if (runTimerRef.current) clearTimeout(runTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (bufferFlushTimerRef.current) clearTimeout(bufferFlushTimerRef.current);
      ro.disconnect();
      wsRef.current?.close();
      wsRef.current = null;
      term.dispose();
      termRef.current = null;
    };
  }, []);

  // Executa comandos externos (vindos da IA ou dos botões de ação)
  useEffect(() => {
    if (!externalCommand) return;
    const ws = wsRef.current;
    const term = termRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      const t = setTimeout(() => {
        const ws2 = wsRef.current;
        if (ws2 && ws2.readyState === WebSocket.OPEN) {
          sendCmd(ws2, term, externalCommand);
        }
      }, 1000);
      return () => clearTimeout(t);
    }

    sendCmd(ws, term, externalCommand);
    onCommandExecuted?.();
  }, [externalCommand]);

  function sendCmd(ws: WebSocket, term: Terminal | null, cmd: string) {
    if (term) {
      term.writeln(`\r\n\x1b[32m▶ Executando:\x1b[0m \x1b[33m${cmd}\x1b[0m`);
    }
    setRunningCmd(cmd);
    currentCmdRef.current = cmd;
    outputBufferRef.current = "";

    ws.send(cmd + "\n");
    onCommandExecuted?.();

    // Timeout máximo: 10 minutos (npm install pode demorar)
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    runTimerRef.current = setTimeout(() => {
      setRunningCmd(null);
      if (currentCmdRef.current === cmd) {
        const out = outputBufferRef.current.slice(0, 8000);
        onCommandOutput?.(cmd, out + "\n[Timeout — comando excedeu 10 minutos]", false);
        currentCmdRef.current = null;
        outputBufferRef.current = "";
      }
    }, CMD_TIMEOUT_MS);
  }

  const handleReconnect = () => {
    const term = termRef.current;
    if (!term) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const newWs = new WebSocket(`${proto}//${window.location.host}/api/ws/terminal`);
    wsRef.current = newWs;
    newWs.binaryType = "arraybuffer";
    setStatus("connecting");
    term.writeln("\r\n\x1b[90m[Reconectando...]\x1b[0m\r\n");

    newWs.onopen = () => {
      setStatus("connected");
      term.writeln("\x1b[32m[Reconectado ✓]\x1b[0m\r\n");
    };
    newWs.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) term.write(new Uint8Array(e.data));
      else term.write(e.data as string);
    };
    newWs.onclose = () => { setStatus("disconnected"); setRunningCmd(null); };
    newWs.onerror = () => { setStatus("error"); setRunningCmd(null); };
    newWs.addEventListener("open", () => {
      term.onData((data: string) => {
        if (newWs.readyState === WebSocket.OPEN) newWs.send(data);
      });
    });
  };

  const statusDot: Record<Status, string> = {
    connecting: "bg-yellow-400 animate-pulse",
    connected: "bg-green-400",
    disconnected: "bg-gray-500",
    error: "bg-red-500",
  };
  const statusLabel: Record<Status, string> = {
    connecting: "conectando...",
    connected: "bash ativo",
    disconnected: "desconectado",
    error: "erro",
  };

  return (
    <div className="h-full flex flex-col bg-[#141c0d] overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-[#1c2714] border-b border-gray-700/30 shrink-0 min-h-[28px]">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[status]}`} />
        <span className="text-[11px] text-gray-500">{statusLabel[status]}</span>

        {runningCmd && (
          <div className="flex items-center gap-1.5 ml-1">
            <div className="flex gap-0.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s` }} />
              ))}
            </div>
            <span className="text-[10px] text-yellow-300 font-mono max-w-[180px] truncate">
              ⏳ {runningCmd.length > 35 ? runningCmd.slice(0, 35) + "…" : runningCmd}
            </span>
            <span className="text-[9px] text-yellow-700">(aguardando até 10min)</span>
          </div>
        )}

        <div className="flex-1" />

        {(status === "disconnected" || status === "error" || status === "connecting") && (
          <button
            onClick={handleReconnect}
            className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all active:scale-95 ${
              status === "error" ? "text-red-300 border-red-700/50 hover:bg-red-900/20 bg-red-900/10" :
              status === "connecting" ? "text-yellow-300 border-yellow-700/40 hover:bg-yellow-900/20" :
              "text-green-400 border-green-700/30 hover:border-green-600/50"
            }`}
          >
            ↺ Reconectar
          </button>
        )}
      </div>

      {/* xterm container */}
      <div ref={containerRef} className="flex-1 overflow-hidden p-1" />
    </div>
  );
}
