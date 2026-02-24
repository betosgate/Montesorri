import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that do not require authentication
const publicPaths = ["/", "/login", "/signup", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  if (publicPaths.includes(pathname)) {
    return true;
  }
  // Allow all webhook and cron API routes
  if (pathname.startsWith("/api/webhooks/") || pathname.startsWith("/api/cron/")) {
    return true;
  }
  return false;
}

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

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return the supabaseResponse object as-is. If you create a new
  // response (e.g. NextResponse.next() or NextResponse.redirect()), make sure
  // to copy the cookies over: NextResponse.next({ request }) alone is not
  // enough -- the session cookies will be lost.

  return supabaseResponse;
}
