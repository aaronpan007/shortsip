import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";

const TEMP_DIR = "/tmp/shortsipagent";

export async function ensureTempDir(): Promise<void> {
  await fs.mkdir(TEMP_DIR, { recursive: true });
}

/**
 * 将音频 URL 下载到本地并转换为 WAV 格式（16kHz 单声道）
 * 确保输出与对口型模型兼容
 */
export async function downloadAndConvertAudio(
  audioUrl: string,
  taskId: string
): Promise<string> {
  await ensureTempDir();

  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error(`下载音频失败: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const inputPath = path.join(TEMP_DIR, `${taskId}_input_audio`);
  const outputPath = path.join(TEMP_DIR, `${taskId}_audio.wav`);

  await fs.writeFile(inputPath, buffer);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec("pcm_s16le")
      .format("wav")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`FFmpeg 转换失败: ${err.message}`)))
      .run();
  });

  return outputPath;
}

/**
 * 将视频 URL 下载到本地临时目录
 */
export async function downloadVideo(
  videoUrl: string,
  taskId: string,
  suffix = "_video.mp4"
): Promise<string> {
  await ensureTempDir();

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`下载视频失败: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const outputPath = path.join(TEMP_DIR, `${taskId}${suffix}`);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

/**
 * 获取临时文件路径
 */
export function getTempFilePath(filename: string): string {
  return path.join(TEMP_DIR, filename);
}

/**
 * 获取媒体文件时长（秒）
 */
export async function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(new Error(`FFprobe 失败: ${err.message}`));
      else resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * 将 lipsync 结果视频与完整 TTS 音频合并
 * - 视频 > 音频：裁剪视频到音频时长
 * - 音频 > 视频：保留完整音频，视频结束后冻结最后一帧
 */
export async function mergeLipSyncWithFullAudio(
  videoPath: string,
  fullAudioPath: string,
  outputPath: string
): Promise<void> {
  const [videoDuration, audioDuration] = await Promise.all([
    getMediaDuration(videoPath),
    getMediaDuration(fullAudioPath),
  ]);

  await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(videoPath)
      .input(fullAudioPath)
      .outputOptions([
        "-map", "0:v",
        "-map", "1:a",
        "-c:a", "aac",
      ]);

    if (audioDuration >= videoDuration) {
      // 音频 >= 视频：保留完整音频，视频冻结最后一帧，需要重编码视频
      cmd
        .outputOptions([
          "-c:v", "libx264",
          "-t", String(audioDuration),
          "-pix_fmt", "yuv420p",
        ]);
    } else {
      // 视频 > 音频：裁剪视频到音频时长，视频不需要重编码
      cmd
        .outputOptions([
          "-c:v", "copy",
          "-t", String(audioDuration),
        ]);
    }

    cmd
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`FFmpeg 合并失败: ${err.message}`)))
      .run();
  });
}
