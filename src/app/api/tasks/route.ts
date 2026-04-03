import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getCompositeTasks, updateCompositeTask, deleteCompositeTask } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const tasks = await getCompositeTasks(supabase, user.id, { limit: 50 });

    const formatted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status:
        t.status === "completed"
          ? "completed"
          : t.status === "failed"
            ? "failed"
            : "processing",
      currentStep: t.current_step,
      createdAt: new Date(t.created_at).toLocaleString("zh-CN"),
      completedAt: t.completed_at
        ? new Date(t.completed_at).toLocaleString("zh-CN")
        : null,
      progress:
        t.status === "completed"
          ? 100
          : t.current_step === "script"
            ? 25
            : t.current_step === "audio"
              ? 50
              : t.current_step === "lipsync"
                ? 75
                : t.current_step === "subtitle"
                  ? 90
                  : 0,
      errorMessage: t.error_message,
      // 附加字段用于下载/预览
      lipsyncVideoUrl: t.final_video_url || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "获取任务列表失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
    }

    const count = await deleteCompositeTask(supabase, id);
    if (!count) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { id, final_video_url, status, current_step } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (final_video_url !== undefined) updates.final_video_url = final_video_url;
    if (status !== undefined) updates.status = status;
    if (current_step !== undefined) updates.current_step = current_step;
    if (status === "completed") updates.completed_at = new Date().toISOString();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
    }

    const updated = await updateCompositeTask(supabase, id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "更新任务失败" }, { status: 500 });
  }
}
