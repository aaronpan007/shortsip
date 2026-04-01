"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import {
  Sparkles,
  FileText,
  Users,
  ListTodo,
  Video,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const navItems = [
  { href: "/workspace", label: "工作台", icon: Sparkles },
  { href: "/scripts", label: "文案管理", icon: FileText },
  { href: "/templates", label: "模板库", icon: Users },
  { href: "/tasks", label: "任务中心", icon: ListTodo },
  { href: "/my-videos", label: "我的成片", icon: Video },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 获取用户资料
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();
        setNickname(profile?.nickname || user.email?.[0]?.toUpperCase() || "U");
      }
      setLoading(false);
    }

    loadProfile();

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    // 监听 profile 更新（Settings 页保存昵称后刷新 Navbar）
    const onProfileUpdated = () => loadProfile();
    window.addEventListener("profile-updated", onProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="glass-sm sticky top-0 z-50 px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/workspace" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#5a52e0] glow-accent-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">AI口播神器</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[rgba(108,99,255,0.15)] text-[#8b83ff]"
                    : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#64748b]" />
          ) : (
            <>
              <button
                onClick={handleSignOut}
                className="hidden text-[#94a3b8] transition-colors hover:text-white md:block"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6c63ff] to-[#3b82f6] text-sm font-bold text-white">
                {nickname || "U"}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
