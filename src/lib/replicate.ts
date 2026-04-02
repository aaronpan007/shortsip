import Replicate from "replicate";
import fs from "fs";
import path from "path";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/**
 * 上传本地文件到 Replicate，返回公开可访问的 URI
 * 用于将本地音频/视频文件传递给 Replicate 模型
 */
export async function uploadFile(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const file = await replicate.files.create(fileBuffer, {
    filename: path.basename(filePath),
  });
  // FileObject.urls.get 是公开可访问的下载 URL
  return file.urls.get;
}

/**
 * 文案生成 — 使用 openai/gpt-5.2
 */
export async function generateScript(params: {
  input_text: string;
  mode: string;
  style: string;
  platform: string;
  target_duration: number;
}): Promise<string> {
  const modeDesc: Record<string, string> = {
    optimize: "智能优化：保持用户原文核心意思，优化语言表达，使其更适合口播朗读",
    expand: "扩写丰富：在用户原文基础上扩展细节、增加论据和案例，使内容更加充实",
    generate: "从零生成：根据用户提供的主题描述，从零开始创作完整的口播文案",
  };

  const styleDesc: Record<string, string> = {
    humorous: "轻松幽默：语言活泼有趣，善用比喻和反转",
    professional: "专业严谨：用词精准，逻辑清晰，有权威感",
    inspirational: "激情励志：语气铿锵有力，充满感染力",
    warm: "温馨故事：以讲故事的方式娓娓道来，温暖感人",
  };

  const platformDesc: Record<string, string> = {
    douyin: "抖音：开头要有强烈吸引力，节奏快，适合竖屏观看",
    xiaohongshu: "小红书：注重价值感，适合种草和分享",
    shipinhao: "视频号：内容偏正式，适合中老年受众",
    general: "通用：不限平台，平衡各种风格",
  };

  // 中文口语约 4-5 字/秒
  const charCount = Math.round(params.target_duration * 4.5);

  const systemPrompt = `你是一位专业的短视频口播文案创作者。请根据以下要求生成文案：

【生成模式】${modeDesc[params.mode] || modeDesc.optimize}
【文案风格】${styleDesc[params.style] || styleDesc.humorous}
【目标平台】${platformDesc[params.platform] || platformDesc.general}
【目标字数】约 ${charCount} 字（对应约 ${params.target_duration} 秒口播时长）

【文案要求】
1. 语言必须口语化，适合朗读，避免书面语和长难句
2. 必须有明确的开头吸引点（Hook），如提问、反常识、数据等
3. 段落之间自然过渡，方便后续分段生成语音
4. 结尾要有总结或行动号召

请直接输出文案内容，不要输出标题、注释或额外说明。`;

  const userPrompt = `请根据以下用户提供的原文/主题，生成口播文案。

=== 用户原文开始 ===
${params.input_text}
=== 用户原文结束 ===

重要提醒：
1. 你必须基于上面的用户原文内容来生成文案，不要偏离用户给出的主题
2. 如果是"扩写丰富"模式，在用户原文基础上扩展细节和案例
3. 如果是"智能优化"模式，保持用户原文核心意思，优化表达
4. 如果是"从零生成"模式，围绕用户给出的主题从零创作
5. 请直接输出文案正文，不要输出任何解释、标题或注释`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = await replicate.run("openai/gpt-5.2", {
    input: {
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      reasoning_effort: "medium",
    },
  });

  if (typeof output === "string") return output.trim();
  if (Array.isArray(output)) return output.join("").trim();
  return JSON.stringify(output).trim();
}

/**
 * TTS 语音合成 — 使用 qwen/qwen3-tts
 * 返回音频文件的公开 URL
 */
export async function generateAudio(params: {
  text: string;
  voice_id: string;
  speed: number;
}): Promise<string> {
  // voice_id 直接就是 qwen3-tts 的 speaker 名称
  const speaker = params.voice_id || "Serena";

  // style_instruction 用于语速控制
  let styleInstruction: string | undefined;
  if (params.speed < 0.9) {
    styleInstruction = "speak slowly and calmly";
  } else if (params.speed > 1.3) {
    styleInstruction = "speak quickly with energy";
  }

  const input: Record<string, unknown> = {
    text: params.text,
    mode: "custom_voice",
    speaker: speaker,
    language: "Chinese",
  };
  if (styleInstruction) {
    input.style_instruction = styleInstruction;
  }

  const prediction = await replicate.predictions.create({
    model: "qwen/qwen3-tts",
    input,
  });
  const result = await replicate.wait(prediction);

  if (result.status === "failed") {
    throw new Error(`TTS 预测失败: ${result.error || "未知错误"}`);
  }

  // output 是字符串 URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = result.output;
  if (typeof output === "string" && output.startsWith("http")) return output;
  return extractUrlFromOutput(output);
}

/**
 * 对口型合成 — 使用 kwaivgi/kling-lip-sync
 * 返回合成视频的公开 URL
 */
export async function generateLipSync(params: {
  audio_url: string;
  video_url: string;
}): Promise<string> {
  const prediction = await replicate.predictions.create({
    model: "kwaivgi/kling-lip-sync",
    input: {
      audio_file: params.audio_url,
      video_url: params.video_url,
    },
  });
  const result = await replicate.wait(prediction);

  if (result.status === "failed") {
    throw new Error(`对口型预测失败: ${result.error || "未知错误"}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = result.output;
  if (typeof output === "string" && output.startsWith("http")) return output;
  return extractUrlFromOutput(output);
}

/**
 * 从 Replicate 模型输出中提取 URL
 */
export function extractUrlFromOutput(output: unknown): string {
  if (typeof output === "string" && output.startsWith("http")) return output;

  if (output && typeof output === "object") {
    // 尝试常见字段名
    for (const key of ["audio", "video", "output", "url", "result"]) {
      const val = (output as Record<string, unknown>)[key];
      if (typeof val === "string" && val.startsWith("http")) return val;
    }
    // 遍历所有值找 URL
    for (const val of Object.values(output as Record<string, unknown>)) {
      if (typeof val === "string" && val.startsWith("http")) return val;
    }
    // URI 类型（Replicate File 对象）
    for (const val of Object.values(output as Record<string, unknown>)) {
      if (val && typeof val === "object" && "uri" in (val as object)) {
        return (val as { uri: string }).uri;
      }
    }
  }

  throw new Error(`无法从模型输出中提取 URL: ${JSON.stringify(output)}`);
}

/**
 * 创建对口型 prediction（不等待完成）
 * 返回 Replicate prediction 对象，包含 id 和初始 status
 */
export async function createLipSyncPrediction(params: {
  audio_url: string;
  video_url: string;
}): Promise<{ id: string; status: string }> {
  const prediction = await replicate.predictions.create({
    model: "kwaivgi/kling-lip-sync",
    input: {
      audio_file: params.audio_url,
      video_url: params.video_url,
    },
  });
  return { id: prediction.id, status: prediction.status };
}

/**
 * 查询对口型 prediction 的当前状态
 * 返回完整的 Prediction 对象
 */
export async function getLipSyncPrediction(predictionId: string): Promise<{
  id: string;
  status: string;
  output: unknown;
  error: unknown;
  logs: string | null;
}> {
  const prediction = await replicate.predictions.get(predictionId);
  return {
    id: prediction.id,
    status: prediction.status,
    output: prediction.output,
    error: prediction.error,
    logs: prediction.logs ?? null,
  };
}
