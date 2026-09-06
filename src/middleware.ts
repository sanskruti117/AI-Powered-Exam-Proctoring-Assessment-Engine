import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve JWT from HttpOnly cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const isPendingApprovalRoute = pathname === "/pending-approval";
  const isUnauthorizedRoute = pathname === "/unauthorized";

  const isAdminRoute = pathname.startsWith("/admin");
  const isExaminerRoute = pathname.startsWith("/examiner");
  const isStudentRoute = pathname.startsWith("/student");
  const isProtectedRoute = isAdminRoute || isExaminerRoute || isStudentRoute;

  // 1. Handling authenticated user visiting auth routes (/login, /register/*)
  if (isAuthRoute && user) {
    if (user.status === "PENDING") {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }
    if (user.status === "ACTIVE") {
      if (user.role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
      if (user.role === "EXAMINER") return NextResponse.redirect(new URL("/examiner", request.url));
      if (user.role === "STUDENT") return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  // 2. Handling /pending-approval route
  if (isPendingApprovalRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.status === "ACTIVE") {
      if (user.role === "EXAMINER") return NextResponse.redirect(new URL("/examiner", request.url));
      if (user.role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
      if (user.role === "STUDENT") return NextResponse.redirect(new URL("/student", request.url));
    }
    return NextResponse.next();
  }

  // 3. Handling Protected Dashboard Routes
  if (isProtectedRoute) {
    // If not logged in, redirect to login with return path
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check account status
    if (user.status === "PENDING") {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }

    if (user.status === "REJECTED" || user.status === "SUSPENDED") {
      return NextResponse.redirect(new URL("/unauthorized?reason=" + encodeURIComponent(user.status.toLowerCase()), request.url));
    }

    // Role-based route authorization
    if (isAdminRoute && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isExaminerRoute && user.role !== "EXAMINER") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isStudentRoute && user.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/examiner/:path*",
    "/student/:path*",
    "/login",
    "/register/:path*",
    "/pending-approval",
  ],
};
