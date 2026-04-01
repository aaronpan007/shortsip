"use client";

import Link from "next/link";
import {
  Sparkles,
  FileText,
  Mic,
  Video,
  Subtitles,
  ArrowRight,
  Zap,
  Shield,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI 文案生成",
    desc: "输入简单描述，AI 自动优化扩写为专业口播文案，支持多种风格和平台适配。",
  },
  {
    icon: Mic,
    title: "多音色语音合成",
    desc: "6种精选音色可选，支持语速调节，一键生成自然流畅的口播语音。",
  },
  {
    icon: Video,
    title: "智能对口型",
    desc: "上传真人视频或选择模板人物，AI 驱动唇形同步，让人物说出你的文案。",
  },
  {
    icon: Subtitles,
    title: "动态字幕套用",
    desc: "自动识别语音生成字幕，提供 6 种精美样式，一键渲染到视频中。",
  },
];

const highlights = [
  { icon: Zap, label: "全流程线上完成", desc: "无需安装任何软件，打开浏览器即可使用" },
  { icon: Shield, label: "小白也能上手", desc: "分步向导引导，零剪辑基础也能产出专业视频" },
  { icon: Layers, label: "批量高效生产", desc: "一套流程标准化输出，轻松实现内容批量生产" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navbar */}
      <header className="glass-sm sticky top-0 z-50 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#5a52e0] glow-accent-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AI口播神器</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              登录
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              免费注册
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center px-6 pt-24 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[rgba(108,99,255,0.12)] px-4 py-1.5 text-sm text-[#8b83ff] border border-[rgba(108,99,255,0.2)]">
          <Sparkles className="h-4 w-4" />
          AI 驱动的短视频生产工具
        </div>
        <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
          输入一段文字
          <br />
          <span className="bg-gradient-to-r from-[#6c63ff] via-[#8b83ff] to-[#3b82f6] bg-clip-text text-transparent">
            一键生成口播短视频
          </span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-[#94a3b8] sm:text-xl">
          集文案生成、语音合成、对口型、字幕套用于一体。
          <br className="hidden sm:block" />
          全流程线上完成，适合做短视频账号的内容批量生产。
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
          >
            开始创作
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="#features" className="btn-secondary px-8 py-3 text-lg">
            了解更多
          </Link>
        </div>

        {/* Mock UI Preview */}
        <div className="glass mt-16 w-full max-w-4xl rounded-2xl p-1 animate-float">
          <div className="glass-sm rounded-xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#f87171]" />
              <div className="h-3 w-3 rounded-full bg-[#fbbf24]" />
              <div className="h-3 w-3 rounded-full bg-[#34d399]" />
              <span className="ml-2 text-xs text-[#64748b]">AI口播神器 - 工作台</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="glass-sm rounded-lg p-4">
                <div className="mb-3 text-sm font-medium text-[#8b83ff]">文案输入</div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-3 w-4/5 rounded bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-3 w-3/5 rounded bg-[rgba(255,255,255,0.06)]" />
                </div>
              </div>
              <div className="glass-sm rounded-lg p-4">
                <div className="mb-3 text-sm font-medium text-[#8b83ff]">AI 生成结果</div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-[rgba(108,99,255,0.15)] animate-shimmer" />
                  <div className="h-3 w-full rounded bg-[rgba(108,99,255,0.15)] animate-shimmer" />
                  <div className="h-3 w-2/3 rounded bg-[rgba(108,99,255,0.15)] animate-shimmer" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="badge">轻松幽默</span>
                <span className="badge">抖音</span>
                <span className="badge">60秒</span>
              </div>
              <div className="btn-primary px-4 py-1.5 text-sm">AI 生成</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.label} className="glass glass-hover rounded-xl p-6 text-center transition-all">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(108,99,255,0.12)]">
                  <Icon className="h-6 w-6 text-[#8b83ff]" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{h.label}</h3>
                <p className="text-sm text-[#94a3b8]">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">核心功能</h2>
            <p className="text-[#94a3b8]">从文案到成片，一站式完成</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="glass glass-hover group rounded-2xl p-8 transition-all"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(108,99,255,0.2)] to-[rgba(59,130,246,0.1)] group-hover:glow-accent-sm transition-all">
                    <Icon className="h-7 w-7 text-[#8b83ff]" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
                  <p className="leading-relaxed text-[#94a3b8]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">使用流程</h2>
            <p className="text-[#94a3b8]">简单 5 步，从零到成片</p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { step: "01", title: "输入文案", desc: "输入你的想法或已有文案" },
              { step: "02", title: "AI 优化", desc: "AI 智能扩写为口播文案" },
              { step: "03", title: "语音合成", desc: "选择音色，生成口播语音" },
              { step: "04", title: "对口型", desc: "AI 让视频人物开口说话" },
              { step: "05", title: "添加字幕", desc: "套用精美样式，导出成片" },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#5a52e0] text-sm font-bold text-white glow-accent-sm">
                  {item.step}
                </div>
                <div className="glass flex-1 rounded-xl p-4">
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-[#94a3b8]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="glass mx-auto max-w-2xl rounded-3xl p-12 animate-pulse-glow">
          <h2 className="mb-4 text-3xl font-bold text-white">准备好开始创作了吗？</h2>
          <p className="mb-8 text-[#94a3b8]">
            注册即可免费体验，让 AI 帮你批量生产短视频内容。
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg">
            免费开始
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-sm px-6 py-8 text-center text-sm text-[#64748b]">
        <p>&copy; 2026 AI口播神器. All rights reserved.</p>
      </footer>
    </div>
  );
}
