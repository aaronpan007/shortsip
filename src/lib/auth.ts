"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ==================== 注册 ====================

export async function signUp(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const nickname = formData.get("nickname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 前端已做校验，这里做兜底
  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }
  if (password.length < 8) {
    return { error: "密码至少8位" };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "密码需包含字母和数字" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname: nickname || "" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message === "User already registered"
      ? "该邮箱已被注册"
      : error.message };
  }

  return { success: true, message: "注册成功！请查收邮箱验证链接" };
}

// ==================== 登录 ====================

export async function signIn(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return { error: "邮箱或密码错误" };
    }
    if (error.message === "Email not confirmed") {
      return { error: "请先验证邮箱，查收验证链接" };
    }
    return { error: error.message };
  }

  return { success: true };
}

// ==================== 登出 ====================

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  redirect("/login");
}

// ==================== 忘记密码 ====================

export async function resetPassword(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "请填写邮箱" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback?next=/settings`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "密码重置邮件已发送，请查收" };
}

// ==================== 修改密码 ====================

export async function updatePassword(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "新密码至少8位" };
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return { error: "密码需包含字母和数字" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "密码修改成功" };
}

// ==================== 修改昵称 ====================

export async function updateNickname(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const nickname = formData.get("nickname") as string;

  if (!nickname || nickname.length > 50) {
    return { error: "昵称长度为1-50个字符" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", (await supabase.auth.getUser()).data.user?.id);

  if (error) {
    return { error: "修改失败" };
  }

  return { success: true, message: "昵称修改成功" };
}

// ==================== 获取当前用户 ====================

export async function getUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { id: user.id, email: user.email, ...profile };
}
