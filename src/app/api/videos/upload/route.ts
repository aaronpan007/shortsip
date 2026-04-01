import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/replicate";
import { ensureTempDir, getTempFilePath } from "@/lib/ffmpeg";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const TEMP_DIR = "/tmp/shortsipagent";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件格式，请上传 MP4、MOV 或 WebM" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "文件大小超过 500MB 限制" },
        { status: 400 }
      );
    }

    await ensureTempDir();

    // 保存到本地临时目录
    const fileId = crypto.randomUUID();
    const ext = path.extname(file.name) || ".mp4";
    const localPath = path.join(TEMP_DIR, `${fileId}${ext}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(localPath, buffer);

    // 上传到 Replicate 获取公开 URL
    const publicUrl = await uploadFile(localPath);

    return NextResponse.json({
      id: fileId,
      filename: file.name,
      size: file.size,
      type: file.type,
      local_path: localPath,
      public_url: publicUrl,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    const message = error instanceof Error ? error.message : "视频上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
