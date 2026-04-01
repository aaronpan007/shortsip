import { NextRequest, NextResponse } from "next/server";
import { generateAudio, uploadFile } from "@/lib/replicate";
import { updateTask, stepToProgress } from "@/lib/tasks";
import { downloadAndConvertAudio } from "@/lib/ffmpeg";
import type { AudioGenerateRequest, AudioGenerateResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: AudioGenerateRequest = await request.json();

    if (!body.text || !body.voice_id) {
      return NextResponse.json(
        { error: "缺少必要参数 text 或 voice_id" },
        { status: 400 }
      );
    }

    const taskId = body.task_id || crypto.randomUUID();

    if (body.task_id) {
      updateTask(taskId, {
        status: "audio_generating",
        currentStep: "audio",
        progress: 30,
      });
    }

    // 1. 调用 Replicate TTS，获取公开 URL
    const audioPublicUrl = await generateAudio({
      text: body.text,
      voice_id: body.voice_id,
      speed: body.speed,
    });

    // 2. 下载并转换为 WAV（本地备份，用于下载接口）
    const localAudioPath = await downloadAndConvertAudio(audioPublicUrl, taskId);

    // 3. 如果需要，将转换后的 WAV 也上传到 Replicate（供 lipsync 使用）
    let lipsyncAudioUrl = audioPublicUrl;
    try {
      lipsyncAudioUrl = await uploadFile(localAudioPath);
    } catch (uploadErr) {
      console.warn("上传音频到 Replicate 失败，将使用 TTS 原始 URL:", uploadErr);
      // 回退使用 TTS 原始 URL
    }

    if (body.task_id) {
      updateTask(taskId, {
        audioUrl: localAudioPath,
        audioPublicUrl: lipsyncAudioUrl,
        currentStep: "audio",
        progress: stepToProgress("audio"),
        status: "pending",
      });
    }

    const response: AudioGenerateResponse = {
      id: crypto.randomUUID(),
      task_id: taskId,
      audio_url: `/api/tasks/${taskId}/download?type=audio`,
      duration: 0,
      status: "completed",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Audio generation error:", error);
    const message = error instanceof Error ? error.message : "语音合成失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
