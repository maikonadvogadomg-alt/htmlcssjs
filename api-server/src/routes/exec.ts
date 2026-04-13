import { Router } from "express";
import { execFile, exec } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { promisify } from "node:util";
import { logger } from "../lib/logger";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const router = Router();

// ─── POST /api/exec/npm-install ───────────────────────────────────────────────
// Recebe package.json do frontend, executa npm install no servidor, retorna saída
router.post("/exec/npm-install", async (req, res) => {
  const { packageJson, packages } = req.body as {
    packageJson?: string;
    packages?: string[];
  };

  let tmpDir: string | null = null;
  try {
    tmpDir = mkdtempSync(join(tmpdir(), "sk-npm-"));

    // Escreve package.json no diretório temporário
    const pkgContent = packageJson || JSON.stringify({
      name: "sk-project",
      version: "1.0.0",
      dependencies: {},
    });
    writeFileSync(join(tmpDir, "package.json"), pkgContent, "utf8");

    // Descobre onde está o npm
    const npmPath = await findNpm();
    if (!npmPath) {
      res.status(503).json({ error: "npm não encontrado no servidor. Use o gerenciador de pacotes virtual do editor." });
      return;
    }

    let cmd: string;
    if (packages && packages.length > 0) {
      // Instala pacotes específicos
      const pkgList = packages.map(p => `"${p.replace(/"/g, "")}"`).join(" ");
      cmd = `${npmPath} install ${pkgList} --save --prefix "${tmpDir}" 2>&1`;
    } else {
      // Instala tudo do package.json
      cmd = `${npmPath} install --prefix "${tmpDir}" 2>&1`;
    }

    const { stdout } = await execAsync(cmd, {
      timeout: 120_000,
      maxBuffer: 2 * 1024 * 1024,
    });

    // Lê o package.json atualizado (com versões reais)
    let updatedPkg: string | null = null;
    try {
      const pkgPath = join(tmpDir, "package.json");
      if (existsSync(pkgPath)) {
        updatedPkg = require("fs").readFileSync(pkgPath, "utf8");
      }
    } catch { /* ignora */ }

    res.json({ output: stdout, updatedPackageJson: updatedPkg });
  } catch (err: any) {
    const msg = err.stderr || err.message || String(err);
    logger.error({ err }, "Erro no npm install");
    res.status(500).json({ error: msg.slice(0, 2000) });
  } finally {
    if (tmpDir) {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignora */ }
    }
  }
});

// ─── POST /api/exec/run-node ──────────────────────────────────────────────────
// Executa um arquivo Node.js com código do frontend e retorna saída
router.post("/exec/run-node", async (req, res) => {
  const { code, filename } = req.body as { code?: string; filename?: string };
  if (!code) { res.status(400).json({ error: "Código não informado." }); return; }

  let tmpDir: string | null = null;
  try {
    tmpDir = mkdtempSync(join(tmpdir(), "sk-node-"));
    const filePath = join(tmpDir, filename || "index.js");
    writeFileSync(filePath, code, "utf8");

    const nodePath = process.execPath;
    const { stdout, stderr } = await execFileAsync(nodePath, [filePath], {
      timeout: 30_000,
      maxBuffer: 512 * 1024,
      cwd: tmpDir,
    });

    res.json({ output: stdout + (stderr ? "\n[stderr]\n" + stderr : "") });
  } catch (err: any) {
    const out = (err.stdout || "") + (err.stderr ? "\n" + err.stderr : "") || err.message || String(err);
    res.json({ output: out.slice(0, 4000), exitCode: err.code ?? 1 });
  } finally {
    if (tmpDir) {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignora */ }
    }
  }
});

// ─── POST /api/exec/run-node-vfs ─────────────────────────────────────────────
// Recebe todos os arquivos do VFS virtual, escreve em disco temporário e roda o arquivo principal.
// Permite que imports/requires funcionem entre arquivos do projeto.
router.post("/exec/run-node-vfs", async (req, res) => {
  const { files, main } = req.body as {
    files?: Record<string, string>; // { "index.js": "...", "lib/util.js": "..." }
    main?: string; // arquivo principal, ex: "index.js"
  };
  if (!files || !main) {
    res.status(400).json({ error: "Campos 'files' e 'main' são obrigatórios." });
    return;
  }

  let tmpDir: string | null = null;
  try {
    tmpDir = mkdtempSync(join(tmpdir(), "sk-vfs-"));

    // Escreve todos os arquivos preservando a estrutura de pastas
    for (const [relPath, content] of Object.entries(files)) {
      const absPath = join(tmpDir, relPath);
      mkdirSync(dirname(absPath), { recursive: true });
      writeFileSync(absPath, content as string, "utf8");
    }

    const mainPath = join(tmpDir, main);
    if (!existsSync(mainPath)) {
      res.status(400).json({ error: `Arquivo principal '${main}' não encontrado.` });
      return;
    }

    const nodePath = process.execPath;
    const { stdout, stderr } = await execFileAsync(nodePath, [mainPath], {
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
      cwd: tmpDir,
      env: { ...process.env, NODE_PATH: join(tmpDir, "node_modules") },
    });

    res.json({ output: stdout + (stderr ? "\n[stderr]\n" + stderr : "") });
  } catch (err: any) {
    const out = (err.stdout || "") + (err.stderr ? "\n" + err.stderr : "") || err.message || String(err);
    res.json({ output: out.slice(0, 8000), exitCode: err.code ?? 1 });
  } finally {
    if (tmpDir) {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignora */ }
    }
  }
});

// ─── POST /api/db/query ───────────────────────────────────────────────────────
// Executa SQL em um banco PostgreSQL/Neon a partir da connection string
router.post("/db/query", async (req, res) => {
  const { connectionString, sql } = req.body as { connectionString?: string; sql?: string };
  if (!connectionString) { res.status(400).json({ error: "connectionString obrigatório." }); return; }
  if (!sql?.trim())      { res.status(400).json({ error: "sql obrigatório." }); return; }

  try {
    const { Client } = await import("pg") as typeof import("pg");
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query(sql);
    await client.end();
    res.json({
      rows: result.rows ?? [],
      rowCount: result.rowCount ?? 0,
      fields: (result.fields ?? []).map((f: { name: string; dataTypeID: number }) => ({ name: f.name, dataTypeID: f.dataTypeID })),
      command: result.command ?? "",
    });
  } catch (err: any) {
    logger.error({ err }, "Erro ao executar query no banco");
    res.status(500).json({ error: err.message || String(err) });
  }
});

// ─── Helper: encontra npm ─────────────────────────────────────────────────────
async function findNpm(): Promise<string | null> {
  const candidates = [
    "npm",
    "/usr/local/bin/npm",
    "/usr/bin/npm",
    // Nix store paths (Replit dev)
    ...(() => {
      try {
        const p = process.env["PATH"] || "";
        return p.split(":").map(d => join(d, "npm"));
      } catch { return []; }
    })(),
  ];

  for (const c of candidates) {
    try {
      await execFileAsync(c, ["--version"], { timeout: 5000 });
      return c;
    } catch { /* tenta próximo */ }
  }
  return null;
}

export default router;
