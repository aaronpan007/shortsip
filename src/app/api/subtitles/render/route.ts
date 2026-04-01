import { NextRequest, NextResponse } from "next/server";
import { updateTask, stepToProgress, getTask } from "@/lib/tasks";
import { getMediaDuration, getTempFilePath } from "@/lib/ffmpeg";
import { autoSegmentText } from "@/lib/subtitle-utils";
import { renderSubtitles } from "@/lib/ffmpeg-subtitle";
import type { SubtitleRenderRequest, SubtitleRenderResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: SubtitleRenderRequest = await request.json();

    if (!body.task_id) {
      return NextResponse.json({ error: "缺少 task_id" }, { status: 400 });
    }

    const taskId = body.task_id;
    const task = getTask(taskId);

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    if (!task.finalVideoUrl) {
      return NextResponse.json({ error: "视频尚未生成，请先完成对口型合成" }, { status: 400 });
    }

    if (!task.scriptText) {
      return NextResponse.json({ error: "文案不存在" }, { status: 400 });
    }

    updateTask(taskId, {
      status: "subtitle_rendering",
      currentStep: "subtitle",
      progress: 85,
    });

    const duration = await getMediaDuration(task.finalVideoUrl);
    const segments = autoSegmentText(task.scriptText, duration);

    const outputPath = getTempFilePath(`${taskId}_subtitled.mp4`);
    await renderSubtitles(task.finalVideoUrl, segments, body.config, outputPath);

    updateTask(taskId, {
      finalVideoUrl: outputPath,
      status: "completed",
      currentStep: "completed",
      progress: stepToProgress("completed"),
    });

    const response: SubtitleRenderResponse = {
      task_id: taskId,
      video_url: `/api/tasks/${taskId}/download?type=final`,
      status: "completed",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Subtitle render error:", error);
    const message = error instanceof Error ? error.message : "字幕渲染失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
