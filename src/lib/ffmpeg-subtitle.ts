import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import { getTempFilePath, getMediaDuration } from "./ffmpeg";
import type { SubtitleSegment, SubtitleConfig, SubtitleFontSize, SubtitlePosition } from "./types";
import { generateASS } from "./subtitle-utils";

const FONT_PATH = "/System/Library/Fonts/PingFang.ttc";

const FONT_SIZE_MAP: Record<SubtitleFontSize, number> = { small: 28, medium: 38, large: 52 };

const POSITION_MAP: Record<SubtitlePosition, string> = {
  top: "h*0.12",
  center: "h*0.48",
  bottom: "h*0.85",
};

/**
 * 使用 drawtext filter 渲染字幕（仅 classic 样式）
 */
export async function renderWithDrawtext(
  inputVideo: string,
  segments: SubtitleSegment[],
  config: SubtitleConfig,
  outputPath: string
): Promise<void> {
  const fontsize = FONT_SIZE_MAP[config.fontSize];
  const y = POSITION_MAP[config.position];

  const filters: string[] = [];

  for (const seg of segments) {
    const escapedText = seg.text
      .replace(/'/g, "'\\''")
      .replace(/:/g, "\\:")
      .replace(/\n/g, " ");
    const enable = `between(t\\,${seg.startTime}\\,${seg.endTime})`;

    filters.push(
      `drawtext=text='${escapedText}':fontfile=${FONT_PATH}:fontsize=${fontsize}:fontcolor=${config.fontColor}:borderw=3:bordercolor=black:x=(w-tw)/2:y=${y}:enable='${enable}'`
    );
  }

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputVideo)
      .videoFilters(filters)
      .outputOptions(["-c:a", "copy", "-c:v", "libx264", "-pix_fmt", "yuv420p"])
      .output(outputPath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("end", () => resolve())
      .on("error", (err: any) => reject(new Error(`FFmpeg drawtext 渲染失败: ${err.message}`)))
      .run();
  });
}

/**
 * 使用 ASS 字幕文件渲染字幕（neon, bubble, typewriter, news, karaoke）
 */
export async function renderWithASS(
  inputVideo: string,
  assContent: string,
  outputPath: string
): Promise<void> {
  const assPath = getTempFilePath(`subtitle_${Date.now()}.ass`);
  await fs.writeFile(assPath, assContent, "utf-8");

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputVideo)
      .outputOptions([
        "-vf", `ass=${assPath}`,
        "-c:a", "copy",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
      ])
      .output(outputPath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("end", () => resolve())
      .on("error", (err: any) => reject(new Error(`FFmpeg ASS 渲染失败: ${err.message}`)))
      .run();
  });
}

/**
 * 根据样式自动选择渲染策略并执行
 */
export async function renderSubtitles(
  inputVideo: string,
  segments: SubtitleSegment[],
  config: SubtitleConfig,
  outputPath: string
): Promise<void> {
  if (config.style === "classic" && segments.length <= 60) {
    await renderWithDrawtext(inputVideo, segments, config, outputPath);
  } else {
    const assContent = generateASS(segments, config);
    await renderWithASS(inputVideo, assContent, outputPath);
  }
}
