import { NextRequest, NextResponse } from "next/server";
import { generateLipSync } from "@/lib/replicate";
import { updateTask, stepToProgress, getTask } from "@/lib/tasks";
import { downloadVideo, mergeLipSyncWithFullAudio } from "@/lib/ffmpeg";
import type { LipSyncResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.task_id) {
      return NextResponse.json({ error: "缺少 task_id" }, { status: 400 });
    }

    const taskId = body.task_id;
    const task = getTask(taskId);

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    if (!body.uploaded_video_url) {
      return NextResponse.json(
        { error: "请先上传视频" },
        { status: 400 }
      );
    }

    if (!task.audioPublicUrl) {
      return NextResponse.json(
        { error: "音频尚未生成，请先完成语音合成" },
        { status: 400 }
      );
    }

    updateTask(taskId, {
      status: "lipsync_processing",
      currentStep: "lipsync",
      progress: 55,
    });

    // 调用 Replicate lip-sync
    const resultVideoUrl = await generateLipSync({
      audio_url: task.audioPublicUrl,
      video_url: body.uploaded_video_url,
    });

    // 下载 lipsync 结果视频
    const lipsyncPath = await downloadVideo(
      resultVideoUrl,
      taskId,
      "_lipsync_raw.mp4"
    );

    // 如果有本地 TTS 音频，用 FFmpeg 合并完整音频到 lipsync 视频
    let finalPath = lipsyncPath;
    if (task.audioUrl) {
      try {
        finalPath = `/tmp/shortsipagent/${taskId}_lipsync.mp4`;
        await mergeLipSyncWithFullAudio(lipsyncPath, task.audioUrl, finalPath);
      } catch (mergeErr) {
        console.warn("FFmpeg 合并音频失败，使用原始 lipsync 视频:", mergeErr);
        finalPath = lipsyncPath;
      }
    }

    updateTask(taskId, {
      lipsyncVideoUrl: finalPath,
      finalVideoUrl: finalPath,
      currentStep: "completed",
      progress: stepToProgress("completed"),
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    const response: LipSyncResponse = {
      id: crypto.randomUUID(),
      task_id: taskId,
      video_url: `/api/tasks/${taskId}/download?type=final`,
      status: "completed",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Lip sync error:", error);
    const message = error instanceof Error ? error.message : "对口型合成失败，请重试";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
