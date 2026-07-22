import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { getSiteOrigin } from "@/lib/site-url";

function canonicalRedirect(request: NextRequest) {
  const origin = getSiteOrigin(request);
  const incomingOrigin = request.nextUrl.origin;
  if (incomingOrigin === origin) return null;

  const incomingHost = request.nextUrl.hostname;
  const canonicalHost = new URL(origin).hostname;
  const isVercelAlias =
    incomingHost.endsWith(".vercel.app") && incomingHost !== canonicalHost;
  const isProductionDeployment = process.env.VERCEL_ENV === "production";

  if (!isProductionDeployment && !isVercelAlias) return null;

  return NextResponse.redirect(
    `${origin}${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
}

// Next.js 16 "proxy" convention (formerly middleware.ts).
export async function proxy(request: NextRequest) {
  const canonical = canonicalRedirect(request);
  if (canonical) return canonical;

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image/font assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
