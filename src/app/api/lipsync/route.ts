import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  createLipSyncPrediction,
  getLipSyncPrediction,
  extractUrlFromOutput,
} from "@/lib/replicate";
import {
  getCompositeTask,
  updateCompositeTask,
  createLipSyncTask,
  updateLipSyncTask,
} from "@/lib/db";
import type { LipSyncCreateResponse, LipSyncPollResponse } from "@/lib/types";

/**
 * POST /api/lipsync
 * 创建 Replicate prediction + lip_sync_task 记录，立即返回 prediction_id
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

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

    // 验证任务属于当前用户
    const task = await getCompositeTask(supabase, body.task_id);
    if (!task || task.user_id !== user.id) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 创建 Replicate prediction
    const prediction = await createLipSyncPrediction({
      audio_url: body.audio_url,
      video_url: body.uploaded_video_url,
    });

    // 创建 lip_sync_task 记录
    const lipSyncTask = await createLipSyncTask(supabase, {
      user_id: user.id,
      audio_gen_id: task.audio_gen_id,
      video_source_type: "upload",
    });

    // 更新 composite_task
    await updateCompositeTask(supabase, body.task_id, {
      lip_sync_id: lipSyncTask.id,
      status: "lipsync_processing",
      current_step: "lipsync",
    });

    // 更新 lip_sync_task 状态为 processing
    await updateLipSyncTask(supabase, lipSyncTask.id, {
      status: "processing",
    });

    const response: LipSyncCreateResponse = {
      id: lipSyncTask.id,
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
 * 查询 prediction 状态，更新 DB，返回当前进度
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

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

    // 尝试查找对应的 lip_sync_task 和 composite_task 并更新
    // 通过 prediction_id 找不到直接对应关系，前端会继续轮询
    // 实际更新由前端在完成时触发，或通过 composite_task 的 lipsyncVideoUrl 关联

    return NextResponse.json(response);
  } catch (error) {
    console.error("Lip sync poll error:", error);
    const message = error instanceof Error ? error.message : "查询对口型状态失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
