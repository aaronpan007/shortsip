"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import {
  ListTodo,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileText,
  Mic,
  Video,
  Subtitles,
  Download,
  Eye,
  Trash2,
} from "lucide-react";

type TaskStatus = "processing" | "completed" | "failed";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  currentStep: string;
  createdAt: string;
  progress: number;
  errorMessage?: string;
  lipsyncVideoUrl?: string | null;
}

const stepLabels: Record<string, string> = {
  script: "文案生成",
  audio: "语音合成",
  lipsync: "对口型合成",
  subtitle: "字幕渲染",
  completed: "已完成",
};

const stepIcons: Record<string, React.ElementType> = {
  script: FileText,
  audio: Mic,
  lipsync: Video,
  subtitle: Subtitles,
};

const statusConfig = {
  processing: {
    label: "处理中",
    icon: Loader2,
    color: "text-[#8b83ff]",
    bg: "bg-[rgba(108,99,255,0.12)]",
    border: "border-[rgba(108,99,255,0.2)]",
    animate: "animate-spin",
  },
  completed: {
    label: "已完成",
    icon: CheckCircle2,
    color: "text-[#34d399]",
    bg: "bg-[rgba(52,211,153,0.12)]",
    border: "border-[rgba(52,211,153,0.2)]",
    animate: "",
  },
  failed: {
    label: "失败",
    icon: XCircle,
    color: "text-[#f87171]",
    bg: "bg-[rgba(248,113,113,0.12)]",
    border: "border-[rgba(248,113,113,0.2)]",
    animate: "",
  },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleDelete = async (taskId: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const filteredTasks = tasks.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">任务中心</h1>
          <p className="text-sm text-[#94a3b8]">追踪所有合成任务的进度</p>
        </div>
        <div className="flex gap-2 text-sm text-[#94a3b8]">
          <span className="badge">{tasks.filter((t) => t.status === "processing").length} 处理中</span>
          <span className="badge" style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", borderColor: "rgba(52,211,153,0.2)" }}>
            {tasks.filter((t) => t.status === "completed").length} 已完成
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="glass rounded-2xl p-4">
        <div className="flex gap-2">
          {[
            { value: "all", label: "全部" },
            { value: "processing", label: "处理中" },
            { value: "completed", label: "已完成" },
            { value: "failed", label: "失败" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value as typeof filterStatus)}
              className={clsx(
                "rounded-lg px-4 py-1.5 text-sm transition-all",
                filterStatus === f.value
                  ? "bg-[rgba(108,99,255,0.15)] text-[#8b83ff] border border-[rgba(108,99,255,0.3)]"
                  : "glass-sm text-[#94a3b8] glass-hover"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-sm rounded-xl p-12 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#8b83ff]" />
            <p className="text-[#94a3b8]">加载中...</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const config = statusConfig[task.status];
            const StatusIcon = config.icon;
            const CurrentStepIcon = stepIcons[task.currentStep] || CheckCircle2;

            return (
              <div
                key={task.id}
                className="glass glass-hover rounded-xl p-5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={clsx("flex items-center justify-center rounded-lg px-2.5 py-1", config.bg, config.border)}>
                      <StatusIcon className={clsx("h-4 w-4", config.color, config.animate)} />
                      <span className={clsx("ml-1.5 text-xs font-medium", config.color)}>{config.label}</span>
                    </div>
                    <h3 className="font-semibold text-white">{task.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#64748b]">
                    <Clock className="h-3 w-3" />
                    {task.createdAt}
                  </div>
                </div>

                {/* Error Message */}
                {task.errorMessage && (
                  <div className="mb-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] p-2 text-xs text-[#f87171]">
                    {task.errorMessage}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                      <CurrentStepIcon className="h-3.5 w-3.5" />
                      {stepLabels[task.currentStep]}
                    </div>
                    <span className="text-sm text-[#94a3b8]">{task.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className={clsx(
                        "h-1.5 rounded-full transition-all",
                        task.status === "completed" && "bg-[#34d399]",
                        task.status === "failed" && "bg-[#f87171]",
                        task.status === "processing" && "bg-gradient-to-r from-[#6c63ff] to-[#8b83ff]"
                      )}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-1 mb-3">
                  {["script", "audio", "lipsync", "subtitle"].map((step, i) => {
                    const StepIcon = stepIcons[step];
                    const stepIndex = ["script", "audio", "lipsync", "subtitle"].indexOf(task.currentStep);
                    const isDone = task.status === "completed" || stepIndex > i;
                    const isCurrent = stepIndex === i && task.status === "processing";
                    return (
                      <div key={step} className="flex items-center gap-1">
                        <div className={clsx(
                          "flex h-6 w-6 items-center justify-center rounded-md",
                          isDone && "bg-[rgba(52,211,153,0.15)] text-[#34d399]",
                          isCurrent && "bg-[rgba(108,99,255,0.15)] text-[#8b83ff]",
                          !isDone && !isCurrent && "bg-[rgba(255,255,255,0.04)] text-[#64748b]"
                        )}>
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                        </div>
                        {i < 3 && <div className="h-px w-4 bg-[rgba(255,255,255,0.08)]" />}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  {task.status === "failed" && (
                    <button className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <RefreshCw className="h-3 w-3" />
                      重试
                    </button>
                  )}
                  {task.status === "completed" && task.lipsyncVideoUrl && (
                    <>
                      <a href={task.lipsyncVideoUrl} target="_blank" className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                        <Eye className="h-3 w-3" />
                        预览
                      </a>
                      <a href={task.lipsyncVideoUrl} download className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                        <Download className="h-3 w-3" />
                        下载
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] transition-all"
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="glass-sm rounded-xl p-12 text-center">
            <ListTodo className="mx-auto mb-3 h-10 w-10 text-[#64748b] opacity-30" />
            <p className="text-[#64748b]">暂无任务记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
