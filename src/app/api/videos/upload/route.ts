import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB（Vercel Serverless body 限制）

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
        { error: `文件大小超过 ${MAX_SIZE / 1024 / 1024}MB 限制（Vercel 部署限制）` },
        { status: 400 }
      );
    }

    // 直接将文件 buffer 上传到 Replicate，不写本地磁盘
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await replicate.files.create(fileBuffer, {
      filename: file.name,
    });

    return NextResponse.json({
      id: uploaded.id,
      filename: file.name,
      size: file.size,
      type: file.type,
      public_url: uploaded.urls.get,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    const message = error instanceof Error ? error.message : "视频上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
