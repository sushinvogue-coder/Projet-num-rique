// app/api/convert/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";

export const runtime = "nodejs";          // ⚠ obligatoire: pas d’Edge
export const maxDuration = 300;           // marge (secondes)
export const dynamic = "force-dynamic";   // évite cache côté dev

async function ensureFFTools() {
  const ffmpegStatic = (await import("ffmpeg-static")).default as string | null;
  const ffprobeStatic = (await import("ffprobe-static")).path as string | null;
  if (!ffmpegStatic || !ffprobeStatic) throw new Error("ffmpeg-static / ffprobe-static manquants");
  ffmpeg.setFfmpegPath(ffmpegStatic);
  ffmpeg.setFfprobePath(ffprobeStatic);
}

function convertToMp4(inPath: string, outPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inPath)
      // profils web-compatibles
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-movflags +faststart",     // démarrage progressif
        "-pix_fmt yuv420p",         // compat navigateurs
        "-preset veryfast",         // vitesse raisonnable
        "-crf 23"                   // qualité (plus bas = mieux)
      ])
.on("error", (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))))
.on("end", () => resolve())
      .save(outPath);
  });
}

export async function POST(req: Request) {
  try {
    await ensureFFTools();

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "convert-"));
    const base = crypto.randomBytes(8).toString("hex");
    const inPath = path.join(tmpDir, `${base}-in`);
    const outPath = path.join(tmpDir, `${base}-out.mp4`);
    await fs.writeFile(inPath, Buffer.from(arrayBuffer));

    await convertToMp4(inPath, outPath);
    const out = await fs.readFile(outPath);

    // nettoyage best-effort
    fs.unlink(inPath).catch(() => {});
    fs.unlink(outPath).catch(() => {});
    fs.rmdir(tmpDir).catch(() => {});

const safeName = (file.name || "video").replace(/\.[^.]+$/, "") + ".mp4";

// Buffer (Node) -> ArrayBuffer (BodyInit compatible)
const body: ArrayBuffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);

return new NextResponse(body, {
  headers: {
    "Content-Type": "video/mp4",
    "Content-Disposition": `attachment; filename="${safeName}"`,
    "Cache-Control": "no-store",
  },
});

  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
