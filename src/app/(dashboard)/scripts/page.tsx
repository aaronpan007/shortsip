"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  Copy,
  Trash2,
  ArrowRight,
  Edit3,
} from "lucide-react";

const mockScripts = [
  {
    id: "1",
    title: "每天早起的好处",
    mode: "扩写丰富",
    style: "轻松幽默",
    platform: "抖音",
    duration: 58,
    status: "final",
    createdAt: "2026-03-31 14:30",
  },
  {
    id: "2",
    title: "如何高效学习一门新技能",
    mode: "智能优化",
    style: "专业严谨",
    platform: "小红书",
    duration: 92,
    status: "draft",
    createdAt: "2026-03-30 10:15",
  },
  {
    id: "3",
    title: "分享我的健身心得",
    mode: "从零生成",
    style: "激情励志",
    platform: "通用",
    duration: 45,
    status: "final",
    createdAt: "2026-03-29 16:45",
  },
  {
    id: "4",
    title: "教你三步搞定时间管理",
    mode: "扩写丰富",
    style: "轻松幽默",
    platform: "抖音",
    duration: 60,
    status: "draft",
    createdAt: "2026-03-28 09:20",
  },
  {
    id: "5",
    title: "为什么阅读是性价比最高的投资",
    mode: "智能优化",
    style: "温馨故事",
    platform: "视频号",
    duration: 120,
    status: "final",
    createdAt: "2026-03-27 20:00",
  },
];

export default function ScriptsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "final">("all");

  const filteredScripts = mockScripts.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">文案管理</h1>
          <p className="text-sm text-[#94a3b8]">管理你的所有口播文案</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新建文案
        </button>
      </div>

      {/* Search & Filter */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="搜索文案..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass"
            style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "全部" },
              { value: "draft", label: "草稿" },
              { value: "final", label: "已确认" },
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
      </div>

      {/* Script List */}
      <div className="space-y-3">
        {filteredScripts.map((script) => (
          <div
            key={script.id}
            className="glass glass-hover group rounded-xl p-5 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-white group-hover:text-[#8b83ff] transition-colors">
                    {script.title}
                  </h3>
                  <span className={clsx(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    script.status === "final"
                      ? "bg-[rgba(52,211,153,0.12)] text-[#34d399] border border-[rgba(52,211,153,0.2)]"
                      : "bg-[rgba(251,191,36,0.12)] text-[#fbbf24] border border-[rgba(251,191,36,0.2)]"
                  )}>
                    {script.status === "final" ? "已确认" : "草稿"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b]">
                  <span className="badge">{script.mode}</span>
                  <span className="badge">{script.style}</span>
                  <span className="badge">{script.platform}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {script.duration}秒
                  </span>
                  <span>{script.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all" title="编辑">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all" title="复制">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] transition-all" title="删除">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {script.status === "draft" && (
              <div className="mt-3 flex justify-end">
                <button className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                  继续创作
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredScripts.length === 0 && (
          <div className="glass-sm rounded-xl p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#64748b] opacity-30" />
            <p className="text-[#64748b]">没有找到匹配的文案</p>
          </div>
        )}
      </div>
    </div>
  );
}
