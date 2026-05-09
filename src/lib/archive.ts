import pako from "pako";

export interface ArchiveFile {
  path: string;
  content: ArrayBuffer;
}

/* ââ TAR parser âââââââââââââââââââââââââââââââââââââââââââ */
function readString(buf: Uint8Array, offset: number, len: number): string {
  let s = "";
  for (let i = offset; i < offset + len; i++) {
    if (buf[i] === 0) break;
    s += String.fromCharCode(buf[i]);
  }
  return s;
}

export function parseTar(buffer: ArrayBuffer): ArchiveFile[] {
  const bytes = new Uint8Array(buffer);
  const files: ArchiveFile[] = [];
  let offset = 0;

  while (offset + 512 <= bytes.length) {
    const header = bytes.slice(offset, offset + 512);
    const name = readString(header, 0, 100).trim();
    const prefix = readString(header, 345, 155).trim();
    const fullName = prefix ? prefix + "/" + name : name;
    if (!fullName || fullName === "./" || fullName === ".") { offset += 512; continue; }

    const sizeStr = readString(header, 124, 12).trim();
    const size = sizeStr ? parseInt(sizeStr, 8) : 0;
    const typeFlag = String.fromCharCode(header[156]);
    offset += 512;

    if ((typeFlag === "0" || typeFlag === "\0" || typeFlag === "") && size > 0) {
      const content = buffer.slice(offset, offset + size);
      const cleanPath = fullName.replace(/^\.\//, "").replace(/^[^/]+\//, "");
      if (cleanPath) files.push({ path: cleanPath, content });
    }

    offset += Math.ceil(size / 512) * 512;
  }
  return files;
}

/* ââ Detect & extract any archive ââââââââââââââââââââââââ */
export async function extractArchive(file: File): Promise<ArchiveFile[]> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (e) {
    const code = e instanceof DOMException ? ` (cÃ³digo ${e.code})` : "";
    throw new Error(`Falha ao ler o arquivo${code}. Tente um ZIP menor ou use GitHub.`);
  }
  const name = file.name.toLowerCase();

  // TAR.GZ / TGZ
  if (name.endsWith(".tar.gz") || name.endsWith(".tgz")) {
    const decompressed = pako.ungzip(new Uint8Array(buffer)).buffer;
    return parseTar(decompressed);
  }

  // TAR.BZ2 â not supported natively, graceful error
  if (name.endsWith(".tar.bz2") || name.endsWith(".tbz2")) {
    throw new Error("Formato .tar.bz2 nÃ£o suportado. Use .tar.gz ou .zip.");
  }

  // Plain TAR
  if (name.endsWith(".tar")) {
    return parseTar(buffer);
  }

  // ZIP (default)
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.entries(zip.files);

  // Pastas que nunca precisam ir para o APK
  const SKIP = /(?:^|\/)(node_modules|\.git|\.svn|\.hg|__pycache__|\.DS_Store)(?:\/|$)/i;

  const keys = entries.filter(([, v]) => !v.dir).map(([k]) => k);

  // Remove apenas o prefixo raiz Ãºnico que o GitHub/ZIP adiciona (ex: "repo-main/")
  // Nunca restringe a dist/ ou qualquer subpasta â importa TUDO
  const tops = [...new Set(keys.map(k => k.split("/")[0]))];
  const prefix = tops.length === 1 ? tops[0] + "/" : "";

  const result: ArchiveFile[] = [];
  for (const [path, entry] of entries) {
    if (entry.dir) continue;
    if (SKIP.test(path)) continue;
    const rel = prefix ? path.slice(prefix.length) : path;
    if (!rel) continue;
    result.push({ path: rel, content: await entry.async("arraybuffer") });
  }
  return result;
}

/* ââ Guess config (package.json + Android + Capacitor + Expo) ââ */
export function guessConfig(files: ArchiveFile[], fallbackName: string) {
  let name = fallbackName.replace(/\.(zip|tar\.gz|tgz|tar)$/i, "").replace(/[_-]/g, " ");
  let id = "com.meuapp." + fallbackName.replace(/\.(zip|tar\.gz|tgz|tar)$/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();

  function decode(f: ArchiveFile): string {
    try { return new TextDecoder("utf-8", { fatal: false }).decode(f.content); } catch { return ""; }
  }

  // 1. package.json
  const pkgFile = files.find(f => f.path === "package.json" || f.path.endsWith("/package.json"));
  if (pkgFile) {
    try {
      const pkg = JSON.parse(decode(pkgFile));
      if (pkg.name) { name = pkg.name; id = "com.meuapp." + pkg.name.replace(/[^a-z0-9]/gi, "").toLowerCase(); }
    } catch {}
  }

  // 2. capacitor.config.ts/js/json
  const capFile = files.find(f => /capacitor\.config\.(ts|js|json)$/.test(f.path));
  if (capFile) {
    const txt = decode(capFile);
    const idM = txt.match(/appId\s*[:=]\s*['"`]([^'"`]+)['"`]/);
    const nmM = txt.match(/appName\s*[:=]\s*['"`]([^'"`]+)['"`]/);
    if (idM) id = idM[1];
    if (nmM) name = nmM[1];
  }

  // 3. app.json (Expo)
  const appJson = files.find(f => f.path === "app.json" || f.path.endsWith("/app.json"));
  if (appJson) {
    try {
      const j = JSON.parse(decode(appJson));
      const expo = j.expo ?? j;
      if (expo.name) name = expo.name;
      if (expo.android?.package) id = expo.android.package;
    } catch {}
  }

  // 4. AndroidManifest.xml
  const manifest = files.find(f => f.path.endsWith("AndroidManifest.xml"));
  if (manifest) {
    const txt = decode(manifest);
    const m = txt.match(/package\s*=\s*["']([^"']+)["']/);
    if (m) id = m[1];
    const lm = txt.match(/android:label\s*=\s*["']([^"'@]+)["']/);
    if (lm) name = lm[1];
  }

  // 5. app/build.gradle
  const gradle = files.find(f => /app[/\\]build\.gradle(\.kts)?$/.test(f.path));
  if (gradle) {
    const txt = decode(gradle);
    const m = txt.match(/applicationId\s+["']([^"']+)["']/);
    if (m) id = m[1];
  }

  // 6. settings.gradle
  const settings = files.find(f => /settings\.gradle(\.kts)?$/.test(f.path));
  if (settings) {
    const txt = decode(settings);
    const m = txt.match(/rootProject\.name\s*=\s*["']([^"']+)["']/);
    if (m && !name) name = m[1];
  }

  return { name: name || fallbackName, id };
}
