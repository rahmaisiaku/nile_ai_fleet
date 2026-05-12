import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isProtectedPage =
    pathname.startsWith("/staff") ||
    pathname.startsWith("/approver") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/driver");

  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let role: "staff" | "approver" | "admin" | "driver" | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? null;
  }

  // Logged-in users should not remain on auth pages
  if (user && role && isAuthPage) {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  // Block role mismatch
  if (user && role) {
    const wrongSection =
      (pathname.startsWith("/staff") && role !== "staff") ||
      (pathname.startsWith("/approver") && role !== "approver") ||
      (pathname.startsWith("/admin") && role !== "admin") ||
      (pathname.startsWith("/driver") && role !== "driver");

    if (wrongSection) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/staff/:path*",
    "/approver/:path*",
    "/admin/:path*",
    "/driver/:path*",
  ],
};