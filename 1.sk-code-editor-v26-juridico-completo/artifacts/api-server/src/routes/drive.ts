import { Router, type Request, type Response } from "express";
// @replit/connectors-sdk â Google Drive integration via OAuth proxy
import { ReplitConnectors } from "@replit/connectors-sdk";

const router = Router();

function getConnectors() {
  return new ReplitConnectors();
}

// ââ GET /api/drive/list ââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Lista arquivos ZIP/pasta SK Code Editor no Drive do usuÃ¡rio
router.get("/drive/list", async (_req: Request, res: Response) => {
  try {
    const connectors = getConnectors();
    const response = await connectors.proxy("google-drive", "/drive/v3/files", {
      method: "GET",
      query: {
        q: "name contains 'sk-backup' and trashed = false",
        orderBy: "modifiedTime desc",
        fields: "files(id,name,size,modifiedTime,webViewLink)",
        pageSize: "30",
      } as any,
    });
    const data = await (response as any).json();
    res.json({ files: data.files || [] });
  } catch (err: any) {
    console.error("[drive/list]", err?.message);
    res.status(500).json({ error: err?.message ?? "Erro ao listar Drive" });
  }
});

// ââ POST /api/drive/upload âââââââââââââââââââââââââââââââââââââââââââââââââ
// Body: { name: string, zipBase64: string }
// Faz upload de um ZIP como backup no Google Drive
router.post("/drive/upload", async (req: Request, res: Response) => {
  try {
    const { name, zipBase64 } = req.body;
    if (!name || !zipBase64) {
      res.status(400).json({ error: "name e zipBase64 sÃ£o obrigatÃ³rios" });
      return;
    }

    const connectors = getConnectors();
    const buffer = Buffer.from(zipBase64, "base64");

    // Upload via media simples (connector proxy)
    const uploadResponse = await connectors.proxy(
      "google-drive",
      "/upload/drive/v3/files?uploadType=media",
      {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: buffer as any,
      }
    );
    const uploadData = await (uploadResponse as any).json();
    if (!uploadData.id) throw new Error("Upload falhou â Drive nÃ£o retornou ID");

    // Renomeia o arquivo imediatamente via PATCH (corrige "Untitled")
    await connectors.proxy(
      "google-drive",
      `/drive/v3/files/${uploadData.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: "SK Code Editor â Backup automÃ¡tico" }),
        query: { fields: "id,name" } as any,
      }
    );

    // Busca link de visualizaÃ§Ã£o
    let webViewLink = "";
    try {
      const metaResp = await connectors.proxy(
        "google-drive",
        `/drive/v3/files/${uploadData.id}`,
        { method: "GET", query: { fields: "id,name,webViewLink" } as any }
      );
      const meta = await (metaResp as any).json();
      webViewLink = meta.webViewLink ?? "";
    } catch { /* link opcional */ }

    res.json({ ok: true, fileId: uploadData.id, name, webViewLink });
  } catch (err: any) {
    console.error("[drive/upload]", err?.message);
    res.status(500).json({ error: err?.message ?? "Erro ao enviar para o Drive" });
  }
});

// ââ DELETE /api/drive/delete/:fileId ââââââââââââââââââââââââââââââââââââââ
// Remove arquivo do Drive
router.delete("/drive/delete/:fileId", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const connectors = getConnectors();
    await connectors.proxy("google-drive", `/drive/v3/files/${fileId}`, {
      method: "DELETE",
    });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[drive/delete]", err?.message);
    res.status(500).json({ error: err?.message ?? "Erro ao apagar do Drive" });
  }
});

export default router;
