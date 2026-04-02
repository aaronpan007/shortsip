// ============ 文案生成 ============

export interface ScriptGenerateRequest {
  input_text: string;
  mode: "optimize" | "expand" | "generate";
  style: "humorous" | "professional" | "inspirational" | "warm";
  platform: "douyin" | "xiaohongshu" | "shipinhao" | "general";
  target_duration: number;
}

export interface ScriptGenerateResponse {
  id: string;
  title: string;
  input_text: string;
  generated_text: string;
  estimated_duration: number;
  mode: string;
  style: string;
  platform: string;
  status: "draft";
}

// ============ 语音生成 ============

export interface AudioGenerateRequest {
  text: string;
  voice_id: string;
  speed: number;
  task_id?: string;
}

export interface AudioGenerateResponse {
  id: string;
  task_id: string;
  audio_url: string;
  duration: number;
  status: "completed";
}

// ============ 对口型合成 ============

export interface LipSyncRequest {
  audio_url: string;
  video_source: "upload" | "template";
  template_id?: string;
  uploaded_video_url?: string;
  task_id?: string;
}

export interface LipSyncResponse {
  id: string;
  task_id: string;
  video_url: string;
  status: "completed";
}

export interface LipSyncCreateResponse {
  id: string;
  task_id: string;
  prediction_id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
}

export interface LipSyncPollResponse {
  prediction_id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  video_url?: string;
  error?: string;
}

// ============ 任务管理 ============

export type TaskStatus =
  | "pending"
  | "script_generating"
  | "audio_generating"
  | "lipsync_processing"
  | "subtitle_rendering"
  | "completed"
  | "failed";

export type TaskStep = "script" | "audio" | "lipsync" | "subtitle" | "completed";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  currentStep: TaskStep;
  progress: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  // 各阶段产物
  scriptText?: string;
  audioUrl?: string;         // 本地临时文件路径
  audioPublicUrl?: string;   // TTS 返回的公开 URL（用于 lipsync）
  lipsyncVideoUrl?: string;
  finalVideoUrl?: string;
}

// ============ 字幕渲染 ============

export type SubtitleStyle = "classic" | "neon" | "typewriter" | "bubble" | "news" | "karaoke";
export type SubtitlePosition = "top" | "center" | "bottom";
export type SubtitleFontSize = "small" | "medium" | "large";

export interface SubtitleConfig {
  style: SubtitleStyle;
  position: SubtitlePosition;
  fontSize: SubtitleFontSize;
  fontColor: string;
}

export interface SubtitleSegment {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleRenderRequest {
  task_id: string;
  config: SubtitleConfig;
}

export interface SubtitleRenderResponse {
  task_id: string;
  video_url: string;
  status: "completed";
}
