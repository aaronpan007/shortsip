import { NextRequest, NextResponse } from "next/server";
import { generateLipSync } from "@/lib/replicate";
import type { LipSyncResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.task_id) {
      return NextResponse.json({ error: "缺少 task_id" }, { status: 400 });
    }

    if (!body.uploaded_video_url) {
      return NextResponse.json(
        { error: "请先上传视频" },
        { status: 400 }
      );
    }

    if (!body.audio_url) {
      return NextResponse.json(
        { error: "音频尚未生成，请先完成语音合成" },
        { status: 400 }
      );
    }

    // 调用 Replicate lip-sync
    const resultVideoUrl = await generateLipSync({
      audio_url: body.audio_url,
      video_url: body.uploaded_video_url,
    });

    const response: LipSyncResponse = {
      id: crypto.randomUUID(),
      task_id: body.task_id,
      video_url: resultVideoUrl,
      status: "completed",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Lip sync error:", error);
    const message = error instanceof Error ? error.message : "对口型合成失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
