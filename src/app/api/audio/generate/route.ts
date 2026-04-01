import { NextRequest, NextResponse } from "next/server";
import { generateAudio } from "@/lib/replicate";
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

    // 调用 Replicate TTS，获取公开 URL
    const audioPublicUrl = await generateAudio({
      text: body.text,
      voice_id: body.voice_id,
      speed: body.speed,
    });

    const response: AudioGenerateResponse = {
      id: crypto.randomUUID(),
      task_id: body.task_id || crypto.randomUUID(),
      audio_url: audioPublicUrl,
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
