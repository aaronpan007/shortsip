"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Camera,
  Mail,
  Lock,
  Save,
  LogOut,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { updateNickname, updatePassword, signOut } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "account">("profile");

  // Profile state
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");
      setCreatedAt(user.created_at ? new Date(user.created_at).toLocaleString("zh-CN") : "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, created_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname || "");
        if (profile.created_at) {
          setCreatedAt(new Date(profile.created_at).toLocaleString("zh-CN"));
        }
      }
      setProfileLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    setProfileMsg(null);
    setProfileSaving(true);
    const formData = new FormData();
    formData.set("nickname", nickname);
    const result = await updateNickname(formData);
    setProfileSaving(false);
    if (result.error) {
      setProfileMsg({ type: "error", text: result.error });
    } else {
      setProfileMsg({ type: "success", text: result.message || "保存成功" });
      window.dispatchEvent(new Event("profile-updated"));
    }
  }

  async function handleUpdatePassword() {
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "密码至少8位" });
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordMsg({ type: "error", text: "密码需包含字母和数字" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "两次输入的密码不一致" });
      return;
    }

    setPasswordSaving(true);
    const formData = new FormData();
    formData.set("newPassword", newPassword);
    const result = await updatePassword(formData);
    setPasswordSaving(false);
    if (result.error) {
      setPasswordMsg({ type: "error", text: result.error });
    } else {
      setPasswordMsg({ type: "success", text: "密码修改成功" });
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">个人设置</h1>
        <p className="text-sm text-[#94a3b8]">管理你的账号信息和偏好</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-2 space-y-1">
            {[
              { id: "profile" as const, label: "个人资料", icon: User },
              { id: "password" as const, label: "修改密码", icon: Lock },
              { id: "account" as const, label: "账号管理", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-[rgba(108,99,255,0.12)] text-[#8b83ff]"
                      : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-6 md:p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">个人资料</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6c63ff] to-[#3b82f6] text-2xl font-bold text-white">
                      {nickname ? nickname[0].toUpperCase() : "U"}
                    </div>
                    <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(108,99,255,0.9)] text-white hover:bg-[#8b83ff] transition-colors">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-white">修改头像</p>
                    <p className="text-xs text-[#64748b]">支持 JPG、PNG，最大 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">昵称</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="email"
                        value={email}
                        className="input-glass"
                        style={{ paddingLeft: '2.5rem' }}
                        disabled
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">邮箱暂不支持修改</p>
                  </div>
                </div>

                {profileMsg && (
                  <p className={`text-sm ${profileMsg.type === "error" ? "text-[#f87171]" : "text-[#34d399]"}`}>
                    {profileMsg.text}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
                  >
                    {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存修改
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">修改密码</h2>
                <div className="max-w-md space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">新密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="password"
                        placeholder="至少8位，包含字母和数字"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-glass"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">确认新密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="password"
                        placeholder="再次输入新密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-glass"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>

                  {passwordMsg && (
                    <p className={`text-sm ${passwordMsg.type === "error" ? "text-[#f87171]" : "text-[#34d399]"}`}>
                      {passwordMsg.text}
                    </p>
                  )}

                  <button
                    onClick={handleUpdatePassword}
                    disabled={passwordSaving}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
                  >
                    {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    更新密码
                  </button>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">账号管理</h2>

                <div className="glass-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">注册时间</div>
                      <div className="text-sm text-[#64748b]">{createdAt}</div>
                    </div>
                  </div>
                  <div className="h-px bg-[rgba(255,255,255,0.06)]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">邮箱</div>
                      <div className="text-sm text-[#94a3b8]">{email}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)] px-6 py-2.5 text-sm font-medium text-[#f87171] hover:bg-[rgba(248,113,113,0.12)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
