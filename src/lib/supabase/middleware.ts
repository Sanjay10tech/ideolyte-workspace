import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Login/public pages
  const isLoginPage = pathname === "/" || pathname.startsWith("/login/");
  const isPublicPage = pathname === "/unauthorized";

  if (isLoginPage || isPublicPage) {
    // If user is already logged in, redirect to their dashboard
    if (user && isLoginPage) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single<{ role: string }>();

      if (profile) {
        const url = request.nextUrl.clone();
        if (profile.role === "admin") url.pathname = "/admin";
        else if (profile.role === "team_member") url.pathname = "/team";
        else url.pathname = "/client";
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Protected routes (everything under /admin, /team, /client except login)
  const isAdminRoute = pathname.startsWith("/admin");
  const isTeamRoute = pathname.startsWith("/team");
  const isClientRoute = pathname.startsWith("/client");

  // Not logged in → redirect to home
  if (!user && (isAdminRoute || isTeamRoute || isClientRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Logged in → verify role access
  if (user && (isAdminRoute || isTeamRoute || isClientRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    if (profile) {
      const role = profile.role;

      // Only admin can access /admin/*
      if (isAdminRoute && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // Only team_member (or admin for testing) can access /team/*
      if (isTeamRoute && role !== "team_member" && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // Only client (or admin for testing) can access /client/*
      if (isClientRoute && role === "team_member") {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
