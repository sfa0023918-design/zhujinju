import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const apexHost = "zhujinju.com";
const primaryHost = "www.zhujinju.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (host === apexHost) {
    const url = request.nextUrl.clone();
    url.host = primaryHost;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-zhujinju-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|sitemap.xml|robots.txt|uploads).*)"],
};
