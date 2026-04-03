import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// 数据库操作层 — 供 Server 端 API Routes 和 Server Components 调用
// 所有操作都通过传入的 supabase client 执行，自带 RLS 安全隔离
// ============================================================

// ==================== 类型定义 ====================

export interface ProfileRow {
  id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScriptRow {
  id: string;
  user_id: string;
  title: string;
  input_text: string;
  generated_text: string;
  mode: "optimize" | "expand" | "generate";
  style: "humorous" | "professional" | "inspirational" | "warm";
  platform: "douyin" | "xiaohongshu" | "shipinhao" | "general";
  target_duration: 30 | 60 | 90 | 120;
  estimated_duration: number | null;
  status: "draft" | "final" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface VoiceRow {
  id: string;
  name: string;
  gender: "male" | "female";
  description: string;
  tags: string[];
  sample_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface AudioGenerationRow {
  id: string;
  user_id: string;
  script_id: string;
  voice_id: string;
  speed: number;
  audio_url: string | null;
  duration: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface VideoTemplateRow {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  video_url: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
}

export interface UserVideoRow {
  id: string;
  user_id: string;
  original_name: string;
  video_url: string;
  cover_url: string | null;
  duration: number | null;
  resolution: string | null;
  fps: number | null;
  file_size: number | null;
  face_detected: boolean | null;
  face_quality: "excellent" | "good" | "fair" | "poor" | null;
  created_at: string;
}

export interface LipSyncTaskRow {
  id: string;
  user_id: string;
  audio_gen_id: string | null;
  video_source_type: "upload" | "template" | null;
  user_video_id: string | null;
  template_id: string | null;
  result_video_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SubtitleStyleRow {
  id: string;
  name: string;
  description: string;
  preview_url: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

export interface SubtitleRow {
  id: string;
  lip_sync_id: string;
  style_id: string | null;
  position: "top" | "center" | "bottom";
  font_size: "small" | "medium" | "large";
  font_color: string;
  background_type: "none" | "semi-transparent" | "blur";
  subtitle_data: SubtitleSegment[];
  created_at: string;
  updated_at: string;
}

export interface SubtitleSegment {
  text: string;
  start: number;
  end: number;
}

export interface CompositeTaskRow {
  id: string;
  user_id: string;
  title: string;
  script_id: string | null;
  audio_gen_id: string | null;
  lip_sync_id: string | null;
  subtitle_id: string | null;
  final_video_url: string | null;
  status:
    | "pending"
    | "script_generating"
    | "audio_generating"
    | "lipsync_processing"
    | "subtitle_rendering"
    | "completed"
    | "failed";
  current_step: "script" | "audio" | "lipsync" | "subtitle" | "completed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}


// ==================== Profiles ====================

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: { nickname?: string; avatar_url?: string | null }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}


// ==================== Scripts ====================

export async function createScript(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    title?: string;
    input_text: string;
    generated_text: string;
    mode: string;
    style?: string;
    platform?: string;
    target_duration?: number;
    estimated_duration?: number;
    status?: string;
  }
) {
  const { data, error } = await supabase
    .from("scripts")
    .insert({
      title: params.title || "未命名文案",
      input_text: params.input_text,
      generated_text: params.generated_text,
      mode: params.mode,
      style: params.style || "humorous",
      platform: params.platform || "douyin",
      target_duration: params.target_duration || 60,
      estimated_duration: params.estimated_duration ?? null,
      status: params.status || "draft",
      user_id: params.user_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ScriptRow;
}

export async function getScripts(
  supabase: SupabaseClient,
  userId: string,
  options?: { search?: string; status?: string; limit?: number; offset?: number }
) {
  let query = supabase
    .from("scripts")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,generated_text.ilike.%${options.search}%`
    );
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  query = query.limit(options?.limit || 20).range(
    options?.offset || 0,
    (options?.offset || 0) + (options?.limit || 20) - 1
  );

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ScriptRow[];
}

export async function getScript(supabase: SupabaseClient, scriptId: string) {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();
  if (error) throw error;
  return data as ScriptRow;
}

export async function updateScript(
  supabase: SupabaseClient,
  scriptId: string,
  updates: Partial<Pick<ScriptRow, "title" | "generated_text" | "status">>
) {
  const { data, error } = await supabase
    .from("scripts")
    .update(updates)
    .eq("id", scriptId)
    .select()
    .single();
  if (error) throw error;
  return data as ScriptRow;
}

export async function softDeleteScript(supabase: SupabaseClient, scriptId: string) {
  const { data, error } = await supabase.rpc("soft_delete_script", {
    p_script_id: scriptId,
  });
  if (error) throw error;
  return data;
}


// ==================== Voices ====================

export async function getVoices(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("voices")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VoiceRow[];
}

export async function getVoice(supabase: SupabaseClient, voiceId: string) {
  const { data, error } = await supabase
    .from("voices")
    .select("*")
    .eq("id", voiceId)
    .single();
  if (error) throw error;
  return data as VoiceRow;
}


// ==================== Audio Generations ====================

export async function createAudioGeneration(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    script_id: string;
    voice_id: string;
    speed?: number;
  }
) {
  const { data, error } = await supabase
    .from("audio_generations")
    .insert({
      user_id: params.user_id,
      script_id: params.script_id,
      voice_id: params.voice_id,
      speed: params.speed || 1.0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as AudioGenerationRow;
}

export async function getAudioGeneration(
  supabase: SupabaseClient,
  audioId: string
) {
  const { data, error } = await supabase
    .from("audio_generations")
    .select("*")
    .eq("id", audioId)
    .single();
  if (error) throw error;
  return data as AudioGenerationRow;
}

export async function updateAudioGeneration(
  supabase: SupabaseClient,
  audioId: string,
  updates: Partial<
    Pick<
      AudioGenerationRow,
      "audio_url" | "duration" | "status" | "error_message" | "completed_at"
    >
  >
) {
  const { data, error } = await supabase
    .from("audio_generations")
    .update(updates)
    .eq("id", audioId)
    .select()
    .single();
  if (error) throw error;
  return data as AudioGenerationRow;
}


// ==================== Video Templates ====================

export async function getVideoTemplates(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("video_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VideoTemplateRow[];
}

export async function getVideoTemplate(
  supabase: SupabaseClient,
  templateId: string
) {
  const { data, error } = await supabase
    .from("video_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (error) throw error;
  return data as VideoTemplateRow;
}


// ==================== User Videos ====================

export async function createUserVideo(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    original_name: string;
    video_url: string;
    cover_url?: string | null;
    duration?: number | null;
    resolution?: string | null;
    fps?: number | null;
    file_size?: number | null;
    face_detected?: boolean | null;
    face_quality?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("user_videos")
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data as UserVideoRow;
}

export async function getUserVideos(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_videos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserVideoRow[];
}

export async function getUserVideo(
  supabase: SupabaseClient,
  videoId: string
) {
  const { data, error } = await supabase
    .from("user_videos")
    .select("*")
    .eq("id", videoId)
    .single();
  if (error) throw error;
  return data as UserVideoRow;
}

export async function deleteUserVideo(
  supabase: SupabaseClient,
  videoId: string
) {
  const { count, error } = await supabase
    .from("user_videos")
    .delete({ count: "exact" })
    .eq("id", videoId);
  if (error) throw error;
  return count;
}


// ==================== Lip Sync Tasks ====================

export async function createLipSyncTask(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    audio_gen_id?: string | null;
    video_source_type?: "upload" | "template";
    user_video_id?: string | null;
    template_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("lip_sync_tasks")
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data as LipSyncTaskRow;
}

export async function getLipSyncTask(
  supabase: SupabaseClient,
  taskId: string
) {
  const { data, error } = await supabase
    .from("lip_sync_tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (error) throw error;
  return data as LipSyncTaskRow;
}

export async function updateLipSyncTask(
  supabase: SupabaseClient,
  taskId: string,
  updates: Partial<
    Pick<
      LipSyncTaskRow,
      "result_video_url" | "status" | "error_message" | "completed_at"
    >
  >
) {
  const { data, error } = await supabase
    .from("lip_sync_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data as LipSyncTaskRow;
}


// ==================== Subtitle Styles ====================

export async function getSubtitleStyles(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("subtitle_styles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SubtitleStyleRow[];
}


// ==================== Subtitles ====================

export async function createSubtitle(
  supabase: SupabaseClient,
  params: {
    lip_sync_id: string;
    style_id?: string | null;
    position?: string;
    font_size?: string;
    font_color?: string;
    background_type?: string;
    subtitle_data?: SubtitleSegment[];
  }
) {
  const { data, error } = await supabase
    .from("subtitles")
    .insert({
      lip_sync_id: params.lip_sync_id,
      style_id: params.style_id ?? null,
      position: params.position || "bottom",
      font_size: params.font_size || "medium",
      font_color: params.font_color || "#FFFFFF",
      background_type: params.background_type || "none",
      subtitle_data: params.subtitle_data || [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as SubtitleRow;
}

export async function getSubtitle(supabase: SupabaseClient, subtitleId: string) {
  const { data, error } = await supabase
    .from("subtitles")
    .select("*")
    .eq("id", subtitleId)
    .single();
  if (error) throw error;
  return data as SubtitleRow;
}

export async function updateSubtitle(
  supabase: SupabaseClient,
  subtitleId: string,
  updates: Partial<
    Pick<
      SubtitleRow,
      | "style_id"
      | "position"
      | "font_size"
      | "font_color"
      | "background_type"
      | "subtitle_data"
    >
  >
) {
  const { data, error } = await supabase
    .from("subtitles")
    .update(updates)
    .eq("id", subtitleId)
    .select()
    .single();
  if (error) throw error;
  return data as SubtitleRow;
}


// ==================== Composite Tasks ====================

export async function createCompositeTask(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    title?: string;
    script_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("composite_tasks")
    .insert({
      user_id: params.user_id,
      title: params.title || "未命名任务",
      script_id: params.script_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CompositeTaskRow;
}

export async function getCompositeTasks(
  supabase: SupabaseClient,
  userId: string,
  options?: { status?: string; limit?: number; offset?: number }
) {
  let query = supabase
    .from("composite_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  query = query.limit(options?.limit || 20).range(
    options?.offset || 0,
    (options?.offset || 0) + (options?.limit || 20) - 1
  );

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CompositeTaskRow[];
}

export async function getCompositeTask(
  supabase: SupabaseClient,
  taskId: string
) {
  const { data, error } = await supabase
    .from("composite_tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (error) throw error;
  return data as CompositeTaskRow;
}

export async function getCompositeTaskDetail(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_task_detail", {
    p_task_id: taskId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}

export async function updateCompositeTask(
  supabase: SupabaseClient,
  taskId: string,
  updates: Partial<
    Pick<
      CompositeTaskRow,
      | "title"
      | "script_id"
      | "audio_gen_id"
      | "lip_sync_id"
      | "subtitle_id"
      | "final_video_url"
      | "status"
      | "current_step"
      | "error_message"
      | "completed_at"
    >
  >
) {
  const { data, error } = await supabase
    .from("composite_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data as CompositeTaskRow;
}

export async function deleteCompositeTask(
  supabase: SupabaseClient,
  taskId: string
) {
  const { count, error } = await supabase
    .from("composite_tasks")
    .delete({ count: "exact" })
    .eq("id", taskId);
  if (error) throw error;
  return count;
}
