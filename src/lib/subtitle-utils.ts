import type { SubtitleSegment, SubtitleConfig, SubtitleFontSize, SubtitlePosition } from "./types";

const FONT_SIZE_MAP: Record<SubtitleFontSize, number> = { small: 28, medium: 38, large: 52 };

const POSITION_ALIGNMENT: Record<SubtitlePosition, number> = {
  top: 8,
  center: 5,
  bottom: 2,
};

const POSITION_MARGIN_V: Record<SubtitlePosition, number> = {
  top: 30,
  center: 0,
  bottom: 30,
};

/**
 * 文本自动分段：按标点切分，按字符数比例分配时间
 */
export function autoSegmentText(
  text: string,
  totalDuration: number
): SubtitleSegment[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return [];

  const charsPerSecond = 4.5;
  const minDuration = 1.5;
  const maxDuration = 4.0;
  const maxChars = Math.round(charsPerSecond * maxDuration);

  // 按标点切分
  const punctuationRegex = /[，。？！；：…、,\.?!;:\n]/;
  const rawSegments: string[] = [];
  let current = "";
  for (const char of cleanText) {
    current += char;
    if (punctuationRegex.test(char)) {
      rawSegments.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) rawSegments.push(current.trim());

  // 合并过短、拆分过长
  const finalSegments: string[] = [];
  for (const seg of rawSegments) {
    if (seg.length <= maxChars) {
      finalSegments.push(seg);
    } else {
      let remaining = seg;
      while (remaining.length > maxChars) {
        let splitAt = maxChars;
        for (let i = maxChars; i > maxChars / 2; i--) {
          if (punctuationRegex.test(remaining[i])) { splitAt = i + 1; break; }
        }
        finalSegments.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
      }
      if (remaining) finalSegments.push(remaining);
    }
  }

  // 按字符数比例分配时间
  const totalChars = finalSegments.reduce((s, t) => s + t.length, 0);
  const segments: SubtitleSegment[] = [];
  let currentTime = 0;

  for (let i = 0; i < finalSegments.length; i++) {
    const seg = finalSegments[i];
    const ratio = seg.length / totalChars;
    const duration = Math.max(minDuration, ratio * totalDuration);

    segments.push({
      index: i + 1,
      startTime: Math.round(currentTime * 1000) / 1000,
      endTime: Math.round((currentTime + duration) * 1000) / 1000,
      text: seg,
    });
    currentTime += duration;
  }

  // 最后一段对齐总时长
  if (segments.length > 0) {
    segments[segments.length - 1].endTime = totalDuration;
  }

  return segments;
}

/**
 * hex 颜色转 ASS BGR 格式 (&H00BBGGRR)
 */
export function hexToASSColor(hex: string): string {
  const r = hex.slice(1, 3);
  const g = hex.slice(3, 5);
  const b = hex.slice(5, 7);
  return `&H00${b}${g}${r}`;
}

/**
 * 秒数转 ASS 时间格式 H:MM:SS.CC
 */
function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/**
 * 生成 ASS 字幕文件内容
 */
export function generateASS(
  segments: SubtitleSegment[],
  config: SubtitleConfig
): string {
  const fontsize = FONT_SIZE_MAP[config.fontSize];
  const fontColor = hexToASSColor(config.fontColor);
  const alignment = POSITION_ALIGNMENT[config.position];
  const marginV = POSITION_MARGIN_V[config.position];

  let ass = "[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n";

  ass += "[V4+ Styles]\n";
  ass += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";

  switch (config.style) {
    case "classic":
      ass += `Style: Classic,Arial,${fontsize},${fontColor},&H0000FFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,0,${alignment},0,0,${marginV},1\n\n`;
      break;
    case "neon":
      ass += `Style: Neon,Arial,${fontsize},&H00FFFFFF,${fontColor},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,0,4,${alignment},0,0,${marginV},1\n\n`;
      break;
    case "typewriter":
      ass += `Style: Typewriter,Arial,${fontsize},${fontColor},&H0000FFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,${alignment},0,0,${marginV},1\n\n`;
      break;
    case "bubble":
      ass += `Style: Bubble,Arial,${fontsize},${fontColor},&H0000FFFF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,3,0,${alignment},20,20,${marginV},1\n\n`;
      break;
    case "news":
      ass += `Style: News,Arial,${fontsize},${fontColor},&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,20,20,35,1\n\n`;
      break;
    case "karaoke":
      ass += `Style: Karaoke,Arial,${fontsize},&H00FFFFFF,${fontColor},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,1,${alignment},0,0,${marginV},1\n\n`;
      break;
  }

  ass += "[Events]\n";
  ass += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

  for (const seg of segments) {
    const start = formatASSTime(seg.startTime);
    const end = formatASSTime(seg.endTime);
    const segDuration = seg.endTime - seg.startTime;
    const charMs = segDuration / seg.text.length;

    switch (config.style) {
      case "typewriter": {
        const tagged = seg.text.split("").map(ch =>
          `\\k${Math.round(charMs * 10)}${ch}`
        ).join("");
        ass += `Dialogue: 0,${start},${end},Typewriter,,0,0,0,,{${tagged}\\k0|\\t(0,500,\\alpha&HFF&)}\n`;
        break;
      }
      case "news": {
        const textWidth = seg.text.length * fontsize * 0.7;
        ass += `Dialogue: 0,${start},${end},News,,0,0,0,,{\\an2\\move(${-textWidth},1010,1920,1010)}${seg.text}\n`;
        break;
      }
      case "karaoke": {
        const tagged = seg.text.split("").map(ch =>
          `\\K${Math.round(charMs * 10)}${ch}`
        ).join("");
        ass += `Dialogue: 0,${start},${end},Karaoke,,0,0,0,,{${tagged}}\n`;
        break;
      }
      default: {
        const styleName = config.style.charAt(0).toUpperCase() + config.style.slice(1);
        ass += `Dialogue: 0,${start},${end},${styleName},,0,0,0,,${seg.text}\n`;
      }
    }
  }

  return ass;
}
