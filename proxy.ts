import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const isAgentRoute = pathname.startsWith("/agent/dashboard");
  const isDashboardRoute =
    pathname.startsWith("/dashboard") && !pathname.startsWith("/agent");

  if (isAgentRoute || isDashboardRoute) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAgentRoute && role !== "agent" && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/agent/dashboard/:path*"],
};
