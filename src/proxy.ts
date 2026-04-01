import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // 让 Supabase SSR 刷新 session cookies
  await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 未登录用户访问受保护路由 → 跳转 /login
  const protectedPaths = ["/workspace", "/scripts", "/templates", "/tasks", "/my-videos", "/settings"];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 已登录用户访问 /login /register → 跳转 /workspace
  const authPaths = ["/login", "/register"];
  if (authPaths.includes(pathname)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/workspace";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
