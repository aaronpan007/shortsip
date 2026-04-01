"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(searchParams.get("error") === "auth"
    ? "邮箱验证失败，请重试"
    : "");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await signIn(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/workspace");
      router.refresh();
    }
  }

  async function handleReset(formData: FormData) {
    setError("");
    const email = formData.get("email") as string;
    if (!email) {
      setError("请填写邮箱");
      return;
    }
    setResetEmail(email);
    setLoading(true);
    const result = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => r.json());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#5a52e0] glow-accent">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">登录 AI口播神器</h1>
        <p className="mt-2 text-sm text-[#94a3b8]">输入你的账号信息，继续创作</p>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-8">
        {showReset ? (
          <>
            <h2 className="mb-5 text-lg font-semibold text-white">重置密码</h2>
            {resetSent ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-[#34d399]">重置邮件已发送到 {resetEmail}</p>
                <p className="text-xs text-[#94a3b8]">请查收邮件并按链接重置密码</p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="text-sm text-[#8b83ff] hover:underline"
                >
                  返回登录
                </button>
              </div>
            ) : (
              <form action={handleReset} className="space-y-5">
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
                {error && <p className="text-sm text-[#f87171]">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  发送重置邮件
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setError(""); }}
                  className="w-full text-center text-sm text-[#94a3b8] hover:text-white"
                >
                  返回登录
                </button>
              </form>
            )}
          </>
        ) : (
          <form action={handleSubmit} className="space-y-5">
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
                  placeholder="输入密码"
                  required
                  className="input-glass"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#f87171]">{error}</p>}

            <div className="flex items-center justify-end">
              <button type="button" onClick={() => { setShowReset(true); setError(""); }} className="text-sm text-[#8b83ff] hover:underline">
                忘记密码？
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              登录
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {!showReset && (
        <p className="mt-6 text-center text-sm text-[#94a3b8]">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-[#8b83ff] hover:underline">
            立即注册
          </Link>
        </p>
      )}
    </div>
  );
}
