import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Package, Download, X, Loader2, ExternalLink, Star } from "lucide-react";

interface NpmPackage {
  name: string;
  description: string;
  version: string;
  date: string;
  links?: { npm?: string; homepage?: string };
  score?: { final: number };
  downloads?: number;
}

interface PackageSearchProps {
  onInstall: (cmd: string) => void;
  onClose: () => void;
}

const CATEGORIES: { label: string; emoji: string; packages: string[] }[] = [
  {
    label: "Servidor Web",
    emoji: "🌐",
    packages: ["express", "fastify", "koa", "hapi", "restify", "polka", "h3", "hono"],
  },
  {
    label: "Banco de Dados",
    emoji: "🗄️",
    packages: ["mongoose", "prisma", "pg", "mysql2", "sqlite3", "redis", "ioredis", "drizzle-orm", "@neondatabase/serverless"],
  },
  {
    label: "Utilitários",
    emoji: "🔧",
    packages: ["lodash", "moment", "dayjs", "uuid", "nanoid", "dotenv", "zod", "joi", "yup", "date-fns", "ramda"],
  },
  {
    label: "HTTP / APIs",
    emoji: "📡",
    packages: ["axios", "node-fetch", "got", "superagent", "openai", "stripe", "undici", "@anthropic-ai/sdk", "@google/generative-ai"],
  },
  {
    label: "Autenticação",
    emoji: "🔐",
    packages: ["jsonwebtoken", "bcryptjs", "passport", "express-session", "helmet", "cors", "express-rate-limit", "cookie-parser"],
  },
  {
    label: "Dev Tools",
    emoji: "⚙️",
    packages: ["typescript", "nodemon", "ts-node", "tsx", "eslint", "prettier", "jest", "vitest", "mocha", "chai", "dotenv-cli"],
  },
  {
    label: "Frontend React",
    emoji: "⚛️",
    packages: ["react", "react-dom", "react-router-dom", "vite", "@vitejs/plugin-react", "tailwindcss", "framer-motion", "zustand", "jotai"],
  },
  {
    label: "UI / Estilo",
    emoji: "🎨",
    packages: ["tailwindcss", "@tailwindcss/vite", "shadcn-ui", "lucide-react", "react-icons", "clsx", "class-variance-authority", "radix-ui"],
  },
  {
    label: "PDF / Documentos",
    emoji: "📄",
    packages: ["pdfkit", "pdf-lib", "puppeteer", "playwright", "html-pdf-node", "docx", "exceljs", "xlsx", "mammoth"],
  },
  {
    label: "Email / SMS",
    emoji: "📧",
    packages: ["nodemailer", "@sendgrid/mail", "resend", "twilio", "mailgun-js", "postmark"],
  },
  {
    label: "Dados / Planilhas",
    emoji: "📊",
    packages: ["csv-parse", "papaparse", "xlsx", "d3", "recharts", "chart.js", "react-chartjs-2", "plotly.js"],
  },
  {
    label: "IA / ML",
    emoji: "🤖",
    packages: ["openai", "@anthropic-ai/sdk", "@google/generative-ai", "langchain", "@langchain/core", "ollama", "transformers"],
  },
  {
    label: "Upload / Storage",
    emoji: "☁️",
    packages: ["multer", "aws-sdk", "@aws-sdk/client-s3", "cloudinary", "firebase", "firebase-admin", "@supabase/supabase-js"],
  },
  {
    label: "WebSocket / RT",
    emoji: "⚡",
    packages: ["socket.io", "socket.io-client", "ws", "uWebSockets.js", "ably", "pusher-js", "liveblocks"],
  },
  {
    label: "CLI / Terminal",
    emoji: "🖥️",
    packages: ["commander", "yargs", "chalk", "ora", "inquirer", "cli-progress", "figlet", "boxen", "gradient-string"],
  },
  {
    label: "Segurança",
    emoji: "🛡️",
    packages: ["helmet", "express-rate-limit", "bcryptjs", "argon2", "crypto-js", "jsonwebtoken", "zod", "validator"],
  },
  {
    label: "Scraping / Browser",
    emoji: "🕷️",
    packages: ["puppeteer", "playwright", "cheerio", "jsdom", "axios", "node-html-parser", "selenium-webdriver"],
  },
  {
    label: "Pagamentos",
    emoji: "💳",
    packages: ["stripe", "mercadopago", "@mercadopago/sdk-js", "paypal-rest-sdk", "braintree", "adyen-cse-web"],
  },
  {
    label: "Python (pip)",
    emoji: "🐍",
    packages: ["flask", "fastapi", "django", "requests", "pandas", "numpy", "sqlalchemy", "pydantic", "uvicorn"],
  },
  {
    label: "Testes",
    emoji: "🧪",
    packages: ["jest", "vitest", "mocha", "chai", "sinon", "@testing-library/react", "cypress", "playwright", "supertest"],
  },
];

export default function PackageSearch({ onInstall, onClose }: PackageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NpmPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [isPython, setIsPython] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const searchNpm = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setError(""); return; }
    setLoading(true);
    setError("");
    setActiveCategory(null);
    try {
      const res = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=20`
      );
      if (!res.ok) throw new Error("Erro ao buscar");
      const data = await res.json();
      setResults(
        data.objects?.map((o: any) => ({
          name: o.package.name,
          description: o.package.description,
          version: o.package.version,
          date: o.package.date,
          links: o.package.links,
          score: o.score,
        })) ?? []
      );
    } catch {
      setError("Não foi possível buscar pacotes. Verifique a conexão.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCategory = useCallback(async (pkgs: string[], label: string) => {
    const python = label === "Python (pip)";
    setIsPython(python);
    setActiveCategory(label);
    setQuery("");
    setLoading(true);
    setError("");
    try {
      if (python) {
        // Para Python, monta lista estática (PyPI não tem CORS fácil)
        const staticPy: NpmPackage[] = pkgs.map(name => ({
          name,
          description: getPyDesc(name),
          version: "latest",
          date: "",
          links: { npm: `https://pypi.org/project/${name}/` },
        }));
        setResults(staticPy);
        setLoading(false);
        return;
      }
      const fetched = await Promise.all(
        pkgs.slice(0, 10).map(async name => {
          try {
            const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
            if (!r.ok) return null;
            const d = await r.json();
            return { name: d.name, description: d.description, version: d.version, date: d.date, links: d.links } as NpmPackage;
          } catch { return null; }
        })
      );
      setResults(fetched.filter(Boolean) as NpmPackage[]);
    } catch {
      setError("Erro ao carregar categoria.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setActiveCategory(null);
    setIsPython(false);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => searchNpm(val), 500);
  };

  const handleInstall = (name: string, dev = false) => {
    const cmd = isPython
      ? `pip install ${name}`
      : dev ? `npm install -D ${name}` : `npm install ${name}`;
    setInstalling(name + (dev ? ":dev" : ""));
    onInstall(cmd);
    setTimeout(() => setInstalling(null), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9990] bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[9999] pb-safe" onClick={e => e.stopPropagation()}>
        <div className="bg-[#1a2413] border-t border-gray-700/60 rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">

          {/* Handle */}
          <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-700/40 shrink-0">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-yellow-400" />
              <p className="text-[15px] font-bold text-white">Biblioteca de Pacotes</p>
              <span className="text-[10px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded-full">npm + pip</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-gray-500">
              <X size={17} />
            </button>
          </div>

          {/* Search input */}
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0d1409] border border-gray-700/50 rounded-2xl focus-within:border-yellow-600/60 transition-colors">
              <Search size={15} className="text-gray-600 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") searchNpm(query); }}
                placeholder="Buscar qualquer pacote npm ou biblioteca..."
                className="flex-1 bg-transparent outline-none text-[13px] text-gray-200 placeholder-gray-700"
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); setActiveCategory(null); setIsPython(false); }} className="text-gray-700 hover:text-gray-400">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          {!query && (
            <div className="px-4 pb-2 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => searchCategory(cat.packages, cat.label)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${activeCategory === cat.label
                      ? "bg-yellow-600/20 border-yellow-500/60 text-yellow-300"
                      : "bg-[#141c0d] border-gray-700/40 text-gray-400 hover:border-gray-600/60 hover:text-gray-200"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[13px]">Buscando...</span>
              </div>
            )}

            {error && (
              <div className="py-6 text-center">
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            {!loading && !error && results.length === 0 && !query && !activeCategory && (
              <div className="py-6 text-center">
                <Package size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-[13px] text-gray-500">Busque por nome ou escolha uma categoria</p>
                <p className="text-[11px] text-gray-700 mt-1">Ex: "express", "axios", "mongoose", "flask"</p>
                <p className="text-[10px] text-gray-800 mt-3">20 categorias • npm + pip • instalação com 1 clique</p>
              </div>
            )}

            {!loading && results.map(pkg => (
              <div key={pkg.name} className="py-3 border-b border-gray-800/50 last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-gray-100 font-mono">{pkg.name}</span>
                      {pkg.version !== "latest" && (
                        <span className="text-[10px] text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded font-mono">v{pkg.version}</span>
                      )}
                      {pkg.score && pkg.score.final > 0.7 && (
                        <span className="text-[9px] text-yellow-500 flex items-center gap-0.5">
                          <Star size={9} fill="currentColor" /> popular
                        </span>
                      )}
                      {isPython && (
                        <span className="text-[9px] text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">pip</span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{pkg.description}</p>
                    )}
                  </div>
                  {pkg.links?.npm && (
                    <a href={pkg.links.npm} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-700 hover:text-blue-400 mt-0.5">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleInstall(pkg.name)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${installing === pkg.name
                      ? "bg-green-600/20 border border-green-500/30 text-green-400"
                      : "bg-yellow-600/15 border border-yellow-600/30 text-yellow-300 hover:bg-yellow-600/25 active:scale-95"
                    }`}
                  >
                    <Download size={11} />
                    {installing === pkg.name ? "Instalando..." : isPython ? "pip install" : "npm install"}
                  </button>
                  {!isPython && (
                    <button
                      onClick={() => handleInstall(pkg.name, true)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${installing === pkg.name + ":dev"
                        ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                        : "bg-gray-800/40 border-gray-700/40 text-gray-500 hover:text-gray-300 hover:border-gray-600/60 active:scale-95"
                      }`}
                    >
                      {installing === pkg.name + ":dev" ? "Instalando..." : "-D (dev)"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function getPyDesc(name: string): string {
  const descs: Record<string, string> = {
    flask: "Microframework web leve e flexível para Python",
    fastapi: "Framework web moderno, rápido, baseado em type hints",
    django: "Framework web completo, baterias incluídas",
    requests: "Biblioteca HTTP simples e elegante para Python",
    pandas: "Análise e manipulação de dados poderosa",
    numpy: "Computação numérica e arrays multidimensionais",
    sqlalchemy: "ORM e toolkit SQL para Python",
    pydantic: "Validação de dados via type hints do Python",
    uvicorn: "Servidor ASGI leve e ultra-rápido",
    aiohttp: "HTTP assíncrono para Python",
    celery: "Fila de tarefas distribuídas",
    redis: "Biblioteca cliente Redis para Python",
    pillow: "Manipulação de imagens (PIL Fork)",
    matplotlib: "Visualização e gráficos científicos",
    scikit_learn: "Machine learning para Python",
    pytest: "Framework de testes simples e poderoso",
    black: "Formatador de código Python sem opiniões",
    httpx: "Cliente HTTP moderno com suporte async",
    alembic: "Migrações de banco de dados para SQLAlchemy",
  };
  return descs[name] || `Pacote Python: ${name}`;
}
