import { NextRequest, NextResponse } from "next/server";
import { generateScript } from "@/lib/replicate";
import { createTask, updateTask, stepToProgress } from "@/lib/tasks";
import type { ScriptGenerateRequest, ScriptGenerateResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ScriptGenerateRequest = await request.json();

    if (!body.input_text || body.input_text.trim().length < 10) {
      return NextResponse.json(
        { error: "输入文案至少需要10个字符" },
        { status: 400 }
      );
    }

    const task = createTask(body.input_text.slice(0, 20));
    updateTask(task.id, {
      status: "script_generating",
      progress: 5,
    });

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

    updateTask(task.id, {
      title,
      scriptText: generatedText,
      currentStep: "script",
      progress: stepToProgress("script"),
      status: "pending",
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
