import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// IMPORTANT: keep this file "thin" -- it's a network boundary (routing,
// cookies, redirects), not the place for authoritative authorization
// decisions. Following Next.js 16 guidance (and the lesson of
// CVE-2025-29927), real access control belongs in the Server
// Components / API routes themselves via createClient() from
// lib/supabase/server.ts, which re-validates the session and is
// enforced again at the database layer by RLS policies
// (supabase/migrations/0002_rls.sql). This proxy only refreshes the
// session cookie so those downstream checks have a valid session to
// check against -- it does not itself decide who can see what.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if expired. Required for Server Components,
  // which can't write cookies themselves.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
