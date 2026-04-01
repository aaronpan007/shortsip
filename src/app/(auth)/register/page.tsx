"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { signUp } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const result = await signUp(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#34d399] to-[#059669]">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">注册成功</h1>
          <p className="mt-2 text-sm text-[#94a3b8]">请查收邮箱中的验证链接，点击完成验证</p>
        </div>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-[#94a3b8]">
            验证完成后即可登录
          </p>
          <Link
            href="/login"
            className="btn-primary mt-6 inline-flex items-center gap-2 px-6 py-2.5"
          >
            前往登录
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#5a52e0] glow-accent">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">注册 AI口播神器</h1>
        <p className="mt-2 text-sm text-[#94a3b8]">创建账号，开启你的短视频创作之旅</p>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-8">
        <form action={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">昵称</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              <input
                name="nickname"
                type="text"
                placeholder="你的昵称"
                required
                className="input-glass"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                className="input-glass"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              <input
                name="password"
                type="password"
                placeholder="至少8位，包含字母和数字"
                required
                minLength={8}
                className="input-glass"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">确认密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              <input
                name="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                required
                minLength={8}
                className="input-glass"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {error && <p className="text-sm text-[#f87171]">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            注册
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-[#94a3b8]">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-[#8b83ff] hover:underline">
          立即登录
        </Link>
      </p>
    </div>
  );
}
