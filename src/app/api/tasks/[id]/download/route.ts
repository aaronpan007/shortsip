import { NextRequest, NextResponse } from "next/server";
import { getTask } from "@/lib/tasks";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = getTask(id);

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get("type") || "final";

  let filePath: string | undefined;
  let contentType: string;
  let filename: string;

  switch (type) {
    case "audio":
      filePath = task.audioUrl;
      contentType = "audio/wav";
      filename = `${task.title}_audio.wav`;
      break;
    case "video":
      filePath = task.lipsyncVideoUrl;
      contentType = "video/mp4";
      filename = `${task.title}_lipsync.mp4`;
      break;
    default:
      filePath = task.finalVideoUrl || task.lipsyncVideoUrl;
      contentType = "video/mp4";
      filename = `${task.title}_final.mp4`;
      break;
  }

  if (!filePath) {
    return NextResponse.json({ error: "文件尚未生成" }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    // 如果有 download 查询参数或 Accept 头为空，返回 attachment；否则返回 inline 以支持 video 标签预览
    const isDownload = request.nextUrl.searchParams.get("download") === "true"
      || request.headers.get("accept")?.includes("application/octet-stream");

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": isDownload
          ? `attachment; filename="${encodeURIComponent(filename)}"`
          : "inline",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
  }
}
