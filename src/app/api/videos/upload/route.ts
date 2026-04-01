import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Replicate from "replicate";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const TEMP_DIR = "/tmp/shortsipagent";
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk（安全低于 Vercel 4.5MB 限制）

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ========== 初始化上传 ==========
    if (action === "init") {
      const { filename, filetype, totalSize, totalChunks } = body;
      if (!filename || !totalSize || !totalChunks) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }
      const uploadId = crypto.randomUUID();
      await fs.mkdir(TEMP_DIR, { recursive: true });
      return NextResponse.json({
        upload_id: uploadId,
        chunk_size: CHUNK_SIZE,
      });
    }

    // ========== 上传分片 ==========
    if (action === "chunk") {
      const { upload_id, chunk_index, data } = body;
      if (!upload_id || chunk_index === undefined || !data) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      await fs.mkdir(TEMP_DIR, { recursive: true });
      const chunkPath = path.join(TEMP_DIR, `${upload_id}_chunk_${chunk_index}`);
      const buffer = Buffer.from(data, "base64");
      await fs.writeFile(chunkPath, buffer);
      return NextResponse.json({ ok: true });
    }

    // ========== 完成上传，转存 Replicate ==========
    if (action === "complete") {
      const { upload_id, filename, filetype, totalChunks } = body;
      if (!upload_id || !filename || !totalChunks) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      await fs.mkdir(TEMP_DIR, { recursive: true });

      // 合并所有分片
      const finalPath = path.join(TEMP_DIR, `${upload_id}_${filename}`);
      const writeStream = await fs.open(finalPath, "w");
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(TEMP_DIR, `${upload_id}_chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.writeFile(chunkData);
        await fs.unlink(chunkPath); // 清理分片
      }
      await writeStream.close();

      // 上传到 Replicate
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!,
      });
      const fileBuffer = await fs.readFile(finalPath);
      const uploaded = await replicate.files.create(fileBuffer, {
        filename,
      });

      // 清理最终文件
      await fs.unlink(finalPath).catch(() => {});

      return NextResponse.json({
        id: uploaded.id,
        filename,
        public_url: uploaded.urls.get,
      });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    console.error("Video upload error:", error);
    const message = error instanceof Error ? error.message : "视频上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
