import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { generateScript } from "@/lib/replicate";
import {
  createCompositeTask,
  createScript,
  updateCompositeTask,
} from "@/lib/db";
import type { ScriptGenerateRequest, ScriptGenerateResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body: ScriptGenerateRequest = await request.json();

    if (!body.input_text || body.input_text.trim().length < 10) {
      return NextResponse.json(
        { error: "输入文案至少需要10个字符" },
        { status: 400 }
      );
    }

    // 创建 composite_task
    const task = await createCompositeTask(supabase, {
      user_id: user.id,
      title: body.input_text.slice(0, 20),
    });

    await updateCompositeTask(supabase, task.id, {
      status: "script_generating",
      current_step: "script",
    });

    // 调用 AI 生成文案
    const generatedText = await generateScript({
      input_text: body.input_text,
      mode: body.mode,
      style: body.style,
      platform: body.platform,
      target_duration: body.target_duration,
    });

    const title =
      generatedText.split("\n")[0].slice(0, 30).replace(/[？！。，、]/g, "") ||
      body.input_text.slice(0, 20);

    const charCount = generatedText.replace(/\s/g, "").length;
    const estimatedDuration = Math.round((charCount / 4.5) * 10) / 10;

    // 保存文案到 DB
    const script = await createScript(supabase, {
      user_id: user.id,
      title,
      input_text: body.input_text,
      generated_text: generatedText,
      mode: body.mode,
      style: body.style,
      platform: body.platform,
      target_duration: body.target_duration,
      estimated_duration: estimatedDuration,
      status: "draft",
    });

    // 更新 composite_task 关联 script
    await updateCompositeTask(supabase, task.id, {
      title,
      script_id: script.id,
      status: "pending",
      current_step: "script",
    });

    const response: ScriptGenerateResponse = {
      id: task.id,
      title,
      input_text: body.input_text,
      generated_text: generatedText,
      estimated_duration: estimatedDuration,
      mode: body.mode,
      style: body.style,
      platform: body.platform,
      status: "draft",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Script generation error:", error);
    const message = error instanceof Error ? error.message : "文案生成失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
