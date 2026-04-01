import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

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
        { error: `文件大小超过 ${MAX_SIZE / 1024 / 1024}MB 限制` },
        { status: 400 }
      );
    }

    // 直接用 fetch 调用 Replicate Files API（Edge Runtime 不支持 Node SDK）
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "缺少 REPLICATE_API_TOKEN 配置" }, { status: 500 });
    }

    const fileBuffer = await file.arrayBuffer();
    const blob = new Blob([fileBuffer], { type: file.type });

    const replicateRes = await fetch("https://api.replicate.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: blob,
    });

    if (!replicateRes.ok) {
      const errText = await replicateRes.text();
      console.error("Replicate upload error:", errText);
      return NextResponse.json({ error: "上传到 Replicate 失败" }, { status: 500 });
    }

    const replicateData = await replicateRes.json();

    return NextResponse.json({
      id: replicateData.id,
      filename: file.name,
      size: file.size,
      type: file.type,
      public_url: replicateData.urls?.get || replicateData.hrefs?.get,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    const message = error instanceof Error ? error.message : "视频上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
