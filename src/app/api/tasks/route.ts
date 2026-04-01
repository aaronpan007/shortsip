import { NextResponse } from "next/server";
import { getAllTasks, deleteTask } from "@/lib/tasks";
import type { Task } from "@/lib/types";

export async function GET() {
  const tasks = getAllTasks();

  const formatted = tasks.map((t: Task) => ({
    id: t.id,
    title: t.title,
    status:
      t.status === "completed"
        ? "completed"
        : t.status === "failed"
          ? "failed"
          : "processing",
    currentStep: t.currentStep,
    createdAt: new Date(t.createdAt).toLocaleString("zh-CN"),
    progress: t.progress,
    errorMessage: t.errorMessage,
  }));

  return NextResponse.json(formatted);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
    }
    const deleted = deleteTask(id);
    if (!deleted) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
