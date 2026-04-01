"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Video, Play, Check, Search } from "lucide-react";

const templates = [
  {
    id: "1",
    name: "职场精英",
    desc: "男，正装，办公室场景",
    tags: ["商业", "职场", "知识分享"],
    color: "from-[rgba(59,130,246,0.12)] to-[rgba(108,99,255,0.08)]",
  },
  {
    id: "2",
    name: "生活达人",
    desc: "女，休闲装，居家场景",
    tags: ["生活方式", "好物推荐"],
    color: "from-[rgba(244,114,182,0.12)] to-[rgba(251,191,36,0.08)]",
  },
  {
    id: "3",
    name: "学霸老师",
    desc: "男，衬衫，教室场景",
    tags: ["教育", "学习方法"],
    color: "from-[rgba(52,211,153,0.12)] to-[rgba(59,130,246,0.08)]",
  },
  {
    id: "4",
    name: "时尚博主",
    desc: "女，时尚装扮，城市街景",
    tags: ["美妆", "穿搭", "潮流"],
    color: "from-[rgba(168,85,247,0.12)] to-[rgba(244,114,182,0.08)]",
  },
  {
    id: "5",
    name: "运动达人",
    desc: "男，运动装，健身房/户外",
    tags: ["健身", "运动", "健康"],
    color: "from-[rgba(251,146,60,0.12)] to-[rgba(52,211,153,0.08)]",
  },
];

export default function TemplatesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = templates.filter((t) =>
    t.name.includes(searchQuery) || t.desc.includes(searchQuery) || t.tags.some((tag) => tag.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">模板库</h1>
          <p className="text-sm text-[#94a3b8]">选择模板人物视频，快速开始创作</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
            className={clsx(
              "glass rounded-2xl overflow-hidden cursor-pointer transition-all",
              selectedId === t.id && "border-2 border-[rgba(108,99,255,0.4)] glow-accent-sm"
            )}
          >
            {/* Preview Area */}
            <div className={`relative h-56 bg-gradient-to-br ${t.color} flex items-center justify-center`}>
              <Video className="h-16 w-16 text-[#64748b] opacity-20" />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                  <Play className="h-6 w-6 ml-1" />
                </button>
              </div>
              {selectedId === t.id && (
                <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#34d399] shadow-lg">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-5">
              <h3 className="mb-1 text-lg font-semibold text-white">{t.name}</h3>
              <p className="mb-3 text-sm text-[#64748b]">{t.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
              </div>
              {selectedId === t.id && (
                <button className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-sm">
                  使用此模板
                  <Play className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-sm rounded-xl p-12 text-center">
          <Video className="mx-auto mb-3 h-10 w-10 text-[#64748b] opacity-30" />
          <p className="text-[#64748b]">没有找到匹配的模板</p>
        </div>
      )}
    </div>
  );
}
