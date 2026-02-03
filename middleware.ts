import { type NextRequest, NextResponse } from "next/server";

const locales = ["en-US", "en-GB"];
const defaultLocale = "en-US";
const rewriteCountHeader = "x-rewrite-count";
const maxRewrites = 10;

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Check if pathname already has a locale
	const pathnameHasLocale = locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (pathnameHasLocale) {
		return NextResponse.next();
	}

	// Check rewrite count to prevent infinite loops
	const rewriteCount = Number.parseInt(
		request.headers.get(rewriteCountHeader) || "0",
	);

	if (rewriteCount >= maxRewrites) {
		throw new Error("Infinite rewrite loop detected");
	}

	// For default locale (en-US), rewrite to /en-US internally
	// This is where the bug occurs - server actions lose track of the original pathname
	const locale = defaultLocale;
	const newUrl = new URL(`/${locale}${pathname}`, request.url);

	console.log(
		` ${request.method} - Middleware rewrite: ${pathname} → ${newUrl.pathname}`,
	);

	const response = NextResponse.rewrite(newUrl);
	response.headers.set(rewriteCountHeader, (rewriteCount + 1).toString());
	return response;
}

export const config = {
	matcher: [
		// Match all pathnames except for
		// - /api (API routes)
		// - /_next (Next.js internals)
		// - /favicon.ico, /sitemap.xml, /robots.txt (static files)
		"/((?!api|_next|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
