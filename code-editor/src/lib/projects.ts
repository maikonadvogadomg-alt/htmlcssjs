export interface Project {
  id: string;
  name: string;
  files: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "sk-editor-projects";
const CURRENT_KEY = "sk-editor-current";

export function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function saveProjects(projects: Project[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentProjectId(id: string | null): void {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
}

export function createProject(name: string, files: Record<string, string>): Project {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    files,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function upsertProject(projects: Project[], project: Project): Project[] {
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    const next = [...projects];
    next[idx] = { ...project };
    return next;
  }
  return [project, ...projects];
}

export function duplicateProject(project: Project): Project {
  return {
    ...project,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: project.name + " (cópia)",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function getProjectStats(files: Record<string, string>) {
  const count = Object.keys(files).length;
  const size = Object.values(files).reduce((a, c) => a + c.length, 0);
  return { count, size: size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B` };
}
