"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Play,
  Download,
  Trash2,
  Search,
  Clock,
  Copy,
  Eye,
  Loader2,
} from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  createdAt: string;
  lipsyncVideoUrl?: string | null;
}

export default function MyVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const allTasks = await res.json();
        const completedTasks = allTasks.filter(
          (t: { status: string }) => t.status === "completed"
        );
        setVideos(
          completedTasks.map((t: { id: string; title: string; createdAt: string; lipsyncVideoUrl?: string | null }) => ({
            id: t.id,
            title: t.title,
            createdAt: t.createdAt,
            lipsyncVideoUrl: t.lipsyncVideoUrl,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">我的成片</h1>
          <p className="text-sm text-[#94a3b8]">管理已完成的视频成片</p>
        </div>
        <div className="text-sm text-[#94a3b8]">
          共 {videos.length} 个视频
        </div>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="搜索视频..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="glass-sm rounded-xl p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#8b83ff]" />
          <p className="text-[#94a3b8]">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="glass glass-hover group rounded-2xl overflow-hidden transition-all"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-[rgba(108,99,255,0.1)] to-[rgba(59,130,246,0.05)] flex items-center justify-center">
                <Video className="h-12 w-12 text-[#64748b] opacity-20" />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  {video.lipsyncVideoUrl && (
                    <>
                      <a
                        href={video.lipsyncVideoUrl}
                        target="_blank"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                      >
                        <Play className="h-5 w-5 ml-0.5" />
                      </a>
                      <a
                        href={video.lipsyncVideoUrl}
                        download
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="mb-2 font-semibold text-white group-hover:text-[#8b83ff] transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.createdAt}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  {video.lipsyncVideoUrl && (
                    <>
                      <a
                        href={video.lipsyncVideoUrl}
                        target="_blank"
                        className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all"
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={video.lipsyncVideoUrl}
                        download
                        className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all"
                        title="下载"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </>
                  )}
                  <button className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all" title="复制为新任务">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-2 text-[#94a3b8] hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] transition-all" title="删除">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredVideos.length === 0 && (
            <div className="glass-sm col-span-full rounded-xl p-12 text-center">
              <Video className="mx-auto mb-3 h-10 w-10 text-[#64748b] opacity-30" />
              <p className="text-[#64748b]">{searchQuery ? "没有找到匹配的视频" : "暂无已完成的视频"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
