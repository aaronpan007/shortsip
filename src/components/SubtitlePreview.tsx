"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { autoSegmentText } from "@/lib/subtitle-utils";
import type { SubtitleSegment, SubtitleStyle, SubtitlePosition, SubtitleFontSize } from "@/lib/types";

interface SubtitlePreviewProps {
  videoSrc: string;
  text: string;
  duration: number;
  style: SubtitleStyle;
  position: SubtitlePosition;
  fontSize: SubtitleFontSize;
  fontColor: string;
}

const fontSizePx: Record<SubtitleFontSize, string> = {
  small: "14px",
  medium: "20px",
  large: "28px",
};

const positionClass: Record<SubtitlePosition, string> = {
  top: "top-[12%]",
  center: "top-[45%]",
  bottom: "top-[82%]",
};

function SubtitleRenderer({
  text,
  style,
  fontSize,
  fontColor,
  segment,
  currentTime,
}: {
  text: string;
  style: SubtitleStyle;
  fontSize: string;
  fontColor: string;
  segment: SubtitleSegment;
  currentTime: number;
}) {
  const elapsed = currentTime - segment.startTime;
  const segDuration = segment.endTime - segment.startTime;
  const progress = Math.min(1, elapsed / segDuration);

  const baseStyle: React.CSSProperties = {
    fontSize,
    color: fontColor,
    display: "inline-block",
    lineHeight: "1.6",
  };

  const outlineShadow =
    "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000";

  switch (style) {
    case "classic":
      return (
        <span style={{ ...baseStyle, textShadow: outlineShadow }}>{text}</span>
      );

    case "neon":
      return (
        <span
          style={{
            ...baseStyle,
            color: "#fff",
            textShadow: `0 0 7px ${fontColor}, 0 0 15px ${fontColor}, 0 0 30px ${fontColor}, 0 0 60px ${fontColor}, ${outlineShadow}`,
          }}
        >
          {text}
        </span>
      );

    case "typewriter": {
      const charCount = Math.max(1, Math.floor(progress * text.length));
      const visibleText = text.slice(0, charCount);
      const showCursor = Math.floor(currentTime * 2) % 2 === 0;
      return (
        <span style={{ ...baseStyle, textShadow: outlineShadow }}>
          {visibleText}
          <span style={{ opacity: showCursor ? 1 : 0, color: fontColor }}>|</span>
        </span>
      );
    }

    case "bubble":
      return (
        <span
          style={{
            ...baseStyle,
            padding: "8px 20px",
            borderRadius: "20px",
            backgroundColor: "rgba(0,0,0,0.65)",
            textShadow: "none",
          }}
        >
          {text}
        </span>
      );

    case "news":
      return (
        <div className="absolute bottom-0 left-0 right-0 bg-black/75 py-2 px-6">
          <span style={{ ...baseStyle, textShadow: "none" }}>{text}</span>
        </div>
      );

    case "karaoke": {
      const highlightCount = Math.floor(progress * text.length);
      return (
        <span style={{ ...baseStyle }}>
          {text.split("").map((ch, i) => (
            <span
              key={i}
              style={{
                color: i < highlightCount ? fontColor : "#fff",
                textShadow: i < highlightCount ? `0 0 8px ${fontColor}` : outlineShadow,
                transition: "color 0.1s",
              }}
            >
              {ch}
            </span>
          ))}
        </span>
      );
    }

    default:
      return <span style={baseStyle}>{text}</span>;
  }
}

export default function SubtitlePreview({
  videoSrc,
  text,
  duration,
  style,
  position,
  fontSize,
  fontColor,
}: SubtitlePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);

  useEffect(() => {
    if (text && duration > 0) {
      setSegments(autoSegmentText(text, duration));
    }
  }, [text, duration]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      // duration 可以通过 video 元素获取
    }
  }, []);

  const currentSegment = segments.find(
    (seg) => currentTime >= seg.startTime && currentTime < seg.endTime
  );

  return (
    <div className="relative w-full max-h-[360px] bg-black overflow-hidden rounded-b-xl">
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        className="w-full max-h-[360px] object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      {/* 字幕叠加层 */}
      <div
        className={`absolute inset-x-0 ${positionClass[position]} pointer-events-none flex justify-center px-4`}
      >
        <div className="text-center">
          {currentSegment && (
            <SubtitleRenderer
              text={currentSegment.text}
              style={style}
              fontSize={fontSizePx[fontSize]}
              fontColor={fontColor}
              segment={currentSegment}
              currentTime={currentTime}
            />
          )}
        </div>
      </div>
    </div>
  );
}
