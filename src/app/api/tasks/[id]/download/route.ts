import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getCompositeTask } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const task = await getCompositeTask(supabase, id);

    if (!task || task.user_id !== user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    const type = request.nextUrl.searchParams.get("type") || "final";
    const isDownload = request.nextUrl.searchParams.get("download") === "true";

    let videoUrl: string | null = null;
    let filename: string;

    switch (type) {
      case "video":
        // lipsync 视频 - 从 lip_sync_tasks 获取（通过 composite_task 的 lip_sync_id）
        // 简化：直接用 final_video_url
        videoUrl = task.final_video_url;
        filename = `${task.title}_lipsync.mp4`;
        break;
      default:
        videoUrl = task.final_video_url;
        filename = `${task.title}_final.mp4`;
        break;
    }

    if (!videoUrl) {
      return NextResponse.json({ error: "文件尚未生成" }, { status: 404 });
    }

    // 如果是下载模式，302 重定向到公开 URL
    if (isDownload) {
      return NextResponse.redirect(videoUrl);
    }

    // 预览模式：返回视频 URL 供前端使用
    // 返回 JSON 让前端自行决定如何处理
    return NextResponse.json({ url: videoUrl, filename });
  } catch (error) {
    console.error("Failed to get download:", error);
    return NextResponse.json({ error: "获取下载链接失败" }, { status: 500 });
  }
}
