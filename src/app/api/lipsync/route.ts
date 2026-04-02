import { NextRequest, NextResponse } from "next/server";
import {
  createLipSyncPrediction,
  getLipSyncPrediction,
  extractUrlFromOutput,
} from "@/lib/replicate";
import type { LipSyncCreateResponse, LipSyncPollResponse } from "@/lib/types";

/**
 * POST /api/lipsync
 * 仅创建 Replicate prediction 并立即返回 prediction_id，不等待完成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.task_id) {
      return NextResponse.json({ error: "缺少 task_id" }, { status: 400 });
    }

    if (!body.uploaded_video_url) {
      return NextResponse.json({ error: "请先上传视频" }, { status: 400 });
    }

    if (!body.audio_url) {
      return NextResponse.json(
        { error: "音频尚未生成，请先完成语音合成" },
        { status: 400 }
      );
    }

    // 仅创建 prediction，不等待完成
    const prediction = await createLipSyncPrediction({
      audio_url: body.audio_url,
      video_url: body.uploaded_video_url,
    });

    const response: LipSyncCreateResponse = {
      id: crypto.randomUUID(),
      task_id: body.task_id,
      prediction_id: prediction.id,
      status: prediction.status as LipSyncCreateResponse["status"],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Lip sync create error:", error);
    const message = error instanceof Error ? error.message : "对口型合成创建失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/lipsync?prediction_id=xxx
 * 查询 prediction 状态，返回当前进度
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get("prediction_id");

    if (!predictionId) {
      return NextResponse.json(
        { error: "缺少 prediction_id 参数" },
        { status: 400 }
      );
    }

    const prediction = await getLipSyncPrediction(predictionId);

    const response: LipSyncPollResponse = {
      prediction_id: prediction.id,
      status: prediction.status as LipSyncPollResponse["status"],
    };

    if (prediction.status === "succeeded" && prediction.output) {
      response.video_url = extractUrlFromOutput(prediction.output);
    }

    if (prediction.status === "failed") {
      response.error = prediction.error
        ? String(prediction.error)
        : "对口型合成失败";
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Lip sync poll error:", error);
    const message = error instanceof Error ? error.message : "查询对口型状态失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
