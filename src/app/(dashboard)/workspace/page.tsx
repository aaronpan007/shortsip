"use client";

import { useState, useRef } from "react";
import { clsx } from "clsx";
import SubtitlePreview from "@/components/SubtitlePreview";
import {
  FileText,
  Mic,
  Video,
  Subtitles,
  Download,
  Sparkles,
  RefreshCw,
  Save,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Upload,
  Volume2,
  Clock,
  Palette,
  Check,
  AlertCircle,
} from "lucide-react";

const steps = [
  { id: 1, label: "文案", icon: FileText },
  { id: 2, label: "语音", icon: Mic },
  { id: 3, label: "视频", icon: Video },
  { id: 4, label: "字幕", icon: Subtitles },
  { id: 5, label: "导出", icon: Download },
];

const scriptModes = [
  { value: "optimize", label: "智能优化", desc: "保持原意，优化表达" },
  { value: "expand", label: "扩写丰富", desc: "扩展细节，充实内容" },
  { value: "generate", label: "从零生成", desc: "根据主题从头创作" },
];

const styles = [
  { value: "humorous", label: "轻松幽默" },
  { value: "professional", label: "专业严谨" },
  { value: "inspirational", label: "激情励志" },
  { value: "warm", label: "温馨故事" },
];

const platforms = [
  { value: "douyin", label: "抖音" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "shipinhao", label: "视频号" },
  { value: "general", label: "通用" },
];

const durations = [10, 20, 30, 60];

const voices = [
  { id: "Aiden", name: "Aiden", gender: "男", desc: "沉稳磁性、适合解说", tags: ["知识科普", "生活分享"] },
  { id: "Dylan", name: "Dylan", gender: "男", desc: "年轻活力、节奏明快", tags: ["搞笑段子", "娱乐解说"] },
  { id: "Eric", name: "Eric", gender: "男", desc: "专业严谨、权威感强", tags: ["商业分析", "财经解说"] },
  { id: "Ryan", name: "Ryan", gender: "男", desc: "亲切自然、温暖有力", tags: ["日常分享", "生活Vlog"] },
  { id: "Serena", name: "Serena", gender: "女", desc: "温柔知性、语调舒缓", tags: ["读书分享", "好物推荐"] },
  { id: "Vivian", name: "Vivian", gender: "女", desc: "甜美活泼、感染力强", tags: ["种草带货", "时尚穿搭"] },
  { id: "Sohee", name: "Sohee", gender: "女", desc: "清新甜美、适合叙事", tags: ["故事分享", "情感语录"] },
  { id: "Ono_anna", name: "Anna", gender: "女", desc: "端庄大方、新闻播报感", tags: ["资讯播报", "时政评论"] },
  { id: "Uncle_fu", name: "Uncle Fu", gender: "男", desc: "成熟稳重、幽默风趣", tags: ["脱口秀", "脱口秀解说"] },
];

const subtitleStyles = [
  { id: "classic", name: "经典白字", desc: "白色文字 + 黑色描边" },
  { id: "neon", name: "霓虹灯", desc: "荧光色文字 + 发光效果" },
  { id: "typewriter", name: "打字机", desc: "逐字出现 + 光标闪烁" },
  { id: "bubble", name: "气泡框", desc: "彩色背景气泡 + 圆角" },
  { id: "news", name: "新闻播报", desc: "底部横条 + 滚动字幕" },
  { id: "karaoke", name: "卡拉OK", desc: "逐字变色高亮 + 跟读" },
];

const templateVideos = [
  { id: "1", name: "职场精英", desc: "男，正装，办公室", tags: ["商业", "职场", "知识分享"] },
  { id: "2", name: "生活达人", desc: "女，休闲装，居家", tags: ["生活方式", "好物推荐"] },
  { id: "3", name: "学霸老师", desc: "男，衬衫，教室", tags: ["教育", "学习方法"] },
  { id: "4", name: "时尚博主", desc: "女，时尚装扮", tags: ["美妆", "穿搭", "潮流"] },
  { id: "5", name: "运动达人", desc: "男，运动装，户外", tags: ["健身", "运动", "健康"] },
] as const; // kept for reference, not displayed

export default function WorkspacePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scriptMode, setScriptMode] = useState("expand");
  const [selectedStyle, setSelectedStyle] = useState("humorous");
  const [selectedPlatform, setSelectedPlatform] = useState("douyin");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [inputText, setInputText] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("Serena");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [selectedSubtitleStyle, setSelectedSubtitleStyle] = useState("classic");
  const [subtitlePosition, setSubtitlePosition] = useState("bottom");
  const [subtitleFontSize, setSubtitleFontSize] = useState("medium");
  const [subtitleFontColor, setSubtitleFontColor] = useState("#FFFFFF");
  const [subtitleRendered, setSubtitleRendered] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lipsyncVideoUrl, setLipsyncVideoUrl] = useState<string | null>(null);
  const [lipsyncGenerated, setLipsyncGenerated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: inputText,
          mode: scriptMode,
          style: selectedStyle,
          platform: selectedPlatform,
          target_duration: selectedDuration,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失败");
      }
      const data = await res.json();
      setGeneratedText(data.generated_text);
      setTaskId(data.id);
      setEstimatedDuration(data.estimated_duration);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文案生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!generatedText || !taskId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: generatedText,
          voice_id: selectedVoice,
          speed: voiceSpeed,
          task_id: taskId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "语音生成失败");
      }
      const data = await res.json();
      setAudioUrl(data.audio_url);
      setAudioGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "语音合成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLipSync = async () => {
    if (!taskId || !uploadedVideoUrl || !audioUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/lipsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          uploaded_video_url: uploadedVideoUrl,
          audio_url: audioUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "对口型合成失败");
      }
      const data = await res.json();
      setLipsyncVideoUrl(data.video_url);
      setLipsyncGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "对口型合成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenderSubtitle = async () => {
    if (!taskId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/subtitles/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          config: {
            style: selectedSubtitleStyle,
            position: subtitlePosition,
            fontSize: subtitleFontSize,
            fontColor: subtitleFontColor,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "字幕渲染失败");
      }
      setSubtitleRendered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "字幕渲染失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "视频上传失败");
      }
      const data = await res.json();
      setUploadedVideoUrl(data.public_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "视频上传失败，请重试");
    } finally {
      setIsUploadingVideo(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">创作工作台</h1>
          <p className="text-sm text-[#94a3b8]">从文案到成片，跟随引导完成创作</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                    isActive && "bg-[rgba(108,99,255,0.12)] border border-[rgba(108,99,255,0.2)]",
                    isCompleted && "cursor-pointer",
                    !isActive && !isCompleted && "opacity-50"
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                      isActive && "step-active",
                      isCompleted && "step-completed",
                      !isActive && !isCompleted && "step-inactive"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Icon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className={clsx("text-sm font-medium", isActive || isCompleted ? "text-white" : "text-[#64748b]")}>
                      {step.label}
                    </div>
                  </div>
                </button>
                {i < steps.length - 1 && (
                  <div className="mx-2 hidden h-px w-8 bg-[rgba(255,255,255,0.1)] sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass rounded-2xl p-6 md:p-8">
        {/* Step 1: Script */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-[#8b83ff]" />
              <h2 className="text-xl font-bold text-white">文案生成与优化</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Input */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#94a3b8]">生成模式</label>
                  <div className="grid grid-cols-3 gap-2">
                    {scriptModes.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setScriptMode(mode.value)}
                        className={clsx(
                          "rounded-xl p-3 text-left transition-all",
                          scriptMode === mode.value
                            ? "glass bg-[rgba(108,99,255,0.15)] border-[rgba(108,99,255,0.3)]"
                            : "glass-sm glass-hover cursor-pointer"
                        )}
                      >
                        <div className={clsx("text-sm font-medium", scriptMode === mode.value ? "text-[#8b83ff]" : "text-white")}>
                          {mode.label}
                        </div>
                        <div className="text-xs text-[#64748b]">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#94a3b8]">输入内容</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入你的文案、描述或话题主题..."
                    className="textarea-glass min-h-[180px]"
                  />
                </div>

                {/* Parameters */}
                <div className="glass-sm rounded-xl p-4 space-y-4">
                  <div className="text-sm font-medium text-white">生成参数</div>
                  <div>
                    <label className="mb-2 block text-xs text-[#64748b]">目标时长</label>
                    <div className="flex gap-2">
                      {durations.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDuration(d)}
                          className={clsx(
                            "flex-1 rounded-lg px-3 py-2 text-sm transition-all",
                            selectedDuration === d
                              ? "bg-[rgba(108,99,255,0.2)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                              : "glass-sm text-[#94a3b8] glass-hover"
                          )}
                        >
                          {d}秒
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-[#64748b]">文案风格</label>
                    <div className="flex flex-wrap gap-2">
                      {styles.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSelectedStyle(s.value)}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-sm transition-all",
                            selectedStyle === s.value
                              ? "bg-[rgba(108,99,255,0.2)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                              : "glass-sm text-[#94a3b8] glass-hover"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-[#64748b]">目标平台</label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setSelectedPlatform(p.value)}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-sm transition-all",
                            selectedPlatform === p.value
                              ? "bg-[rgba(108,99,255,0.2)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                              : "glass-sm text-[#94a3b8] glass-hover"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      AI 生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI 生成
                    </>
                  )}
                </button>
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] p-3 text-sm text-[#f87171]">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Right: Generated Result */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#94a3b8]">生成结果</label>
                  {generated && (
                    <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                      <Clock className="h-3 w-3" />
                      预估 {estimatedDuration}秒
                    </div>
                  )}
                </div>
                <div className="glass-sm rounded-xl p-4 min-h-[300px]">
                  {generatedText ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-[#e8eaed]">{generatedText}</p>
                  ) : (
                    <div className="flex h-full min-h-[260px] items-center justify-center text-[#64748b]">
                      <div className="text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-sm">AI 生成结果将显示在这里</p>
                      </div>
                    </div>
                  )}
                </div>
                {generated && (
                  <div className="flex gap-2">
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2 text-sm">
                      <RefreshCw className="h-4 w-4" />
                      重新生成
                    </button>
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2 text-sm">
                      <Save className="h-4 w-4" />
                      保存草稿
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: TTS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="h-6 w-6 text-[#8b83ff]" />
              <h2 className="text-xl font-bold text-white">语音合成</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Voice Selection */}
              <div className="lg:col-span-2 space-y-4">
                <label className="text-sm font-medium text-[#94a3b8]">选择音色</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={clsx(
                        "rounded-xl p-4 text-left transition-all",
                        selectedVoice === v.id
                          ? "glass bg-[rgba(108,99,255,0.15)] border-[rgba(108,99,255,0.3)]"
                          : "glass-sm glass-hover cursor-pointer"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                            v.gender === "男" ? "bg-[rgba(59,130,246,0.15)] text-[#60a5fa]" : "bg-[rgba(236,72,153,0.15)] text-[#f472b6]"
                          )}>
                            {v.name[1]}
                          </div>
                          <div>
                            <div className={clsx("font-medium", selectedVoice === v.id ? "text-white" : "text-[#e8eaed]")}>
                              {v.name}
                              <span className="ml-1 text-xs text-[#64748b]">{v.gender}</span>
                            </div>
                            <div className="text-xs text-[#64748b]">{v.desc}</div>
                          </div>
                        </div>
                        {selectedVoice === v.id && <Check className="h-5 w-5 text-[#8b83ff]" />}
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        {v.tags.map((tag) => (
                          <span key={tag} className="badge text-[10px]">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed & Preview */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-[#94a3b8]">语速调节</label>
                <div className="glass-sm rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#94a3b8]">当前语速</span>
                    <span className="text-lg font-bold text-[#8b83ff]">{voiceSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#6c63ff]"
                  />
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>0.5x 慢速</span>
                    <span>2.0x 快速</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.8, 1.0, 1.2, 1.5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setVoiceSpeed(s)}
                        className={clsx(
                          "flex-1 rounded-lg py-1.5 text-xs transition-all",
                          voiceSpeed === s
                            ? "bg-[rgba(108,99,255,0.2)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                            : "glass-sm text-[#94a3b8]"
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <label className="text-sm font-medium text-[#94a3b8]">试听预览</label>
                <div className="glass-sm rounded-xl p-4">
                  {audioGenerated && audioUrl ? (
                    <>
                      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlayAudio}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(108,99,255,0.15)] text-[#8b83ff] hover:bg-[rgba(108,99,255,0.25)] transition-colors"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.08)]">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-[#6c63ff] to-[#8b83ff]" style={{ width: audioGenerated ? "100%" : "0%" }} />
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-[#64748b]">
                            <span>已生成</span>
                            <span>{estimatedDuration}秒</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(108,99,255,0.08)] text-[#64748b]">
                        <Play className="h-5 w-5 ml-0.5" />
                      </div>
                      <span className="text-sm text-[#64748b]">请先生成语音</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateAudio}
                  disabled={isGenerating || !generatedText}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      生成语音
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Video & Lip Sync */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Video className="h-6 w-6 text-[#8b83ff]" />
              <h2 className="text-xl font-bold text-white">上传视频与对口型</h2>
            </div>

            {/* Upload Area */}
            <div className="glass-sm rounded-xl p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/mov,video/webm"
                className="hidden"
                onChange={handleFileUpload}
              />
              {isUploadingVideo ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-12 w-12 text-[#8b83ff] animate-spin" />
                  <p className="font-medium text-white">视频上传中...</p>
                  <p className="text-sm text-[#64748b]">请稍候，正在上传到服务器</p>
                </div>
              ) : uploadedVideoUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(52,211,153,0.15)]">
                    <Check className="h-8 w-8 text-[#34d399]" />
                  </div>
                  <p className="font-medium text-[#34d399]">视频已上传成功</p>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary mt-2 px-6 py-2 text-sm">
                    重新选择
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-4 h-12 w-12 text-[#64748b]" />
                  <p className="mb-2 font-medium text-white">拖拽视频文件到此处，或点击上传</p>
                  <p className="text-sm text-[#64748b]">支持 MP4、MOV、WebM，最大 500MB，建议 2-10 秒、720p-1080p</p>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary mt-4 px-6 py-2 text-sm">选择文件</button>
                </>
              )}
            </div>

            {/* Lip Sync Action */}
            <div className="glass-sm rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">AI 对口型合成</div>
                <div className="text-xs text-[#64748b]">将语音与视频中人物的嘴部动作精确同步（视频时长需与语音时长匹配）</div>
              </div>
              <button
                onClick={handleLipSync}
                disabled={isGenerating || !audioGenerated || !uploadedVideoUrl}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    合成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    开始合成
                  </>
                )}
              </button>
            </div>

            {/* Video Preview after lip-sync */}
            {lipsyncGenerated && lipsyncVideoUrl && (
              <div className="glass-sm rounded-xl overflow-hidden">
                <div className="p-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-sm font-medium text-[#34d399]">合成完成</span>
                  <a
                    href={lipsyncVideoUrl}
                    download
                    target="_blank"
                    className="flex items-center gap-1.5 text-xs text-[#8b83ff] hover:text-[#a59dff] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    下载视频
                  </a>
                </div>
                <div className="flex items-center justify-center bg-black/30">
                  <video
                    src={lipsyncVideoUrl}
                    controls
                    className="max-h-[320px] w-auto max-w-full"
                  />
                </div>
              </div>
            )}

            {error && currentStep === 3 && (
              <div className="flex items-start gap-2 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] p-3 text-sm text-[#f87171]">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Subtitles */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Subtitles className="h-6 w-6 text-[#8b83ff]" />
              <h2 className="text-xl font-bold text-white">动态字幕</h2>
            </div>

            {/* Video Preview with Subtitles */}
            {lipsyncGenerated && lipsyncVideoUrl ? (
              <div className="glass-sm rounded-xl overflow-hidden">
                <div className="p-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-sm font-medium text-[#94a3b8]">实时预览（播放查看字幕效果）</span>
                  {subtitleRendered && (
                    <a
                      href={lipsyncVideoUrl}
                      download
                      target="_blank"
                      className="flex items-center gap-1.5 text-xs text-[#34d399] hover:text-[#4ade80] transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      下载字幕版
                    </a>
                  )}
                </div>
                <SubtitlePreview
                  videoSrc={lipsyncVideoUrl}
                  text={generatedText}
                  duration={videoDuration || estimatedDuration}
                  style={selectedSubtitleStyle as any}
                  position={subtitlePosition as any}
                  fontSize={subtitleFontSize as any}
                  fontColor={subtitleFontColor}
                />
              </div>
            ) : (
              <div className="glass-sm rounded-xl p-8 text-center">
                <Subtitles className="mx-auto mb-3 h-10 w-10 text-[#64748b] opacity-40" />
                <p className="text-sm text-[#64748b]">请先完成对口型合成，才能预览字幕效果</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Style Selection */}
              <div className="lg:col-span-2 space-y-4">
                <label className="text-sm font-medium text-[#94a3b8]">字幕样式</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {subtitleStyles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubtitleStyle(s.id)}
                      className={clsx(
                        "rounded-xl overflow-hidden text-left transition-all",
                        selectedSubtitleStyle === s.id
                          ? "glass bg-[rgba(108,99,255,0.15)] border-2 border-[rgba(108,99,255,0.4)]"
                          : "glass-sm glass-hover cursor-pointer"
                      )}
                    >
                      <div className={clsx(
                        "h-24 flex items-center justify-center",
                        s.id === "classic" && "bg-[rgba(255,255,255,0.03)]",
                        s.id === "neon" && "bg-gradient-to-br from-[rgba(168,85,247,0.1)] to-[rgba(59,130,246,0.1)]",
                        s.id === "typewriter" && "bg-[rgba(255,255,255,0.02)]",
                        s.id === "bubble" && "bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(244,114,182,0.08)]",
                        s.id === "news" && "bg-[rgba(255,255,255,0.04)]",
                        s.id === "karaoke" && "bg-gradient-to-br from-[rgba(52,211,153,0.08)] to-[rgba(59,130,246,0.08)]"
                      )}>
                        <Subtitles className="h-8 w-8 text-[#64748b] opacity-40" />
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-medium text-white">{s.name}</div>
                        <div className="text-xs text-[#64748b]">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Config */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-[#94a3b8]">字幕配置</label>
                <div className="glass-sm rounded-xl p-4 space-y-4">
                  <div>
                    <div className="mb-2 text-xs text-[#64748b]">字幕位置</div>
                    <div className="flex gap-2">
                      {["top", "center", "bottom"].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setSubtitlePosition(pos)}
                          className={clsx(
                            "flex-1 rounded-lg py-2 text-sm transition-all",
                            subtitlePosition === pos
                              ? "bg-[rgba(108,99,255,0.2)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                              : "glass-sm text-[#94a3b8] glass-hover"
                          )}
                        >
                          {pos === "top" ? "顶部" : pos === "center" ? "居中" : "底部"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-[#64748b]">字体大小</div>
                    <div className="flex gap-2">
                      {["small", "medium", "large"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSubtitleFontSize(size)}
                          className={clsx(
                            "flex-1 rounded-lg py-2 text-sm transition-all",
                            subtitleFontSize === size
                              ? "bg-[rgba(108,99,255,0.2)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                              : "glass-sm text-[#94a3b8] glass-hover"
                          )}
                        >
                          {size === "small" ? "小" : size === "medium" ? "中" : "大"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-[#64748b]">字体颜色</div>
                    <div className="flex gap-2">
                      {["#FFFFFF", "#FFD700", "#FF6B6B", "#6C63FF", "#34D399"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSubtitleFontColor(color)}
                          className={clsx(
                            "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                            subtitleFontColor === color
                              ? "border-[#8b83ff] ring-2 ring-[rgba(108,99,255,0.4)]"
                              : "border-[rgba(255,255,255,0.15)]"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRenderSubtitle}
                  disabled={isGenerating || !lipsyncGenerated}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      渲染中...
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4" />
                      渲染字幕
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && currentStep === 4 && (
              <div className="flex items-start gap-2 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] p-3 text-sm text-[#f87171]">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Export */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Download className="h-6 w-6 text-[#8b83ff]" />
              <h2 className="text-xl font-bold text-white">导出成片</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Video Preview */}
              <div className="glass-sm rounded-xl overflow-hidden">
                {lipsyncVideoUrl ? (
                  <video
                    src={lipsyncVideoUrl}
                    controls
                    className="w-full max-h-[500px]"
                  />
                ) : (
                  <div className="relative aspect-[9/16] max-h-[500px] bg-gradient-to-br from-[rgba(108,99,255,0.08)] to-[rgba(59,130,246,0.05)] flex items-center justify-center">
                    <Video className="h-16 w-16 text-[#64748b] opacity-20" />
                  </div>
                )}
              </div>

              {/* Export Info */}
              <div className="space-y-4">
                <div className="glass-sm rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-white">成片信息</h3>
                  <div className="space-y-3">
                    {[
                      { label: "视频标题", value: "每天早起的好处" },
                      { label: "视频时长", value: "58.5 秒" },
                      { label: "分辨率", value: "1920 x 1080" },
                      { label: "音色", value: "晓晨 (男)" },
                      { label: "字幕样式", value: "经典白字" },
                      { label: "格式", value: "MP4 (H.264)" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-[#94a3b8]">{item.label}</span>
                        <span className="text-sm text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={lipsyncVideoUrl || "#"}
                  target="_blank"
                  className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg glow-accent"
                  download={!!lipsyncVideoUrl}
                >
                  <Download className="h-5 w-5" />
                  下载成片
                </a>

                <div className="glass-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                    <Check className={clsx("h-4 w-4", lipsyncGenerated ? "text-[#34d399]" : "text-[#64748b]")} />
                    {lipsyncGenerated ? "视频合成完成，可直接下载" : "请先完成文案、语音和对口型合成步骤"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className={clsx(
            "btn-secondary flex items-center gap-2",
            currentStep === 1 && "opacity-30 pointer-events-none"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          上一步
        </button>
        <div className="text-sm text-[#64748b]">
          {currentStep} / {steps.length}
        </div>
        <button
          onClick={handleNext}
          disabled={currentStep === 5}
          className={clsx(
            "btn-primary flex items-center gap-2",
            currentStep === 5 && "opacity-30 pointer-events-none"
          )}
        >
          下一步
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
