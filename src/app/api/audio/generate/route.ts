import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { generateAudio } from "@/lib/replicate";
import {
  getCompositeTask,
  updateCompositeTask,
  createAudioGeneration,
  updateAudioGeneration,
} from "@/lib/db";
import type { AudioGenerateRequest, AudioGenerateResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body: AudioGenerateRequest = await request.json();

    if (!body.text || !body.voice_id) {
      return NextResponse.json(
        { error: "缺少必要参数 text 或 voice_id" },
        { status: 400 }
      );
    }

    if (!body.task_id) {
      return NextResponse.json(
        { error: "缺少 task_id，请先生成文案" },
        { status: 400 }
      );
    }

    // 验证任务属于当前用户
    const task = await getCompositeTask(supabase, body.task_id);
    if (!task || task.user_id !== user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 更新任务状态
    await updateCompositeTask(supabase, body.task_id, {
      status: "audio_generating",
      current_step: "audio",
    });

    // 调用 Replicate TTS
    const audioPublicUrl = await generateAudio({
      text: body.text,
      voice_id: body.voice_id,
      speed: body.speed,
    });

    // 保存音频生成记录（需要 script_id，从 task 获取）
    let audioGenId: string;
    if (task.script_id) {
      const audioGen = await createAudioGeneration(supabase, {
        user_id: user.id,
        script_id: task.script_id,
        voice_id: body.voice_id,
        speed: body.speed,
      });
      await updateAudioGeneration(supabase, audioGen.id, {
        audio_url: audioPublicUrl,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      audioGenId = audioGen.id;
      await updateCompositeTask(supabase, body.task_id, {
        audio_gen_id: audioGen.id,
      });
    } else {
      audioGenId = crypto.randomUUID();
    }

    const response: AudioGenerateResponse = {
      id: audioGenId,
      task_id: body.task_id,
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
