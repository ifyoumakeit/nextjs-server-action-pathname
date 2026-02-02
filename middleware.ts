import { type NextRequest, NextResponse } from "next/server";

const locales = ["en-US", "en-GB"];
const defaultLocale = "en-US";

function getLocale(request: NextRequest): string {
	// Check if there's a locale in the pathname
	const pathname = request.nextUrl.pathname;

	for (const locale of locales) {
		if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
			return locale;
		}
	}

	return defaultLocale;
}

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Check if pathname already has a locale
	const pathnameHasLocale = locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (pathnameHasLocale) {
		return NextResponse.next();
	}

	// For default locale (en-US), rewrite to /en-US internally
	// This is where the bug occurs - server actions lose track of the original pathname
	const locale = defaultLocale;
	const newUrl = new URL(`/${locale}${pathname}`, request.url);

	console.log(
		` ${request.method} - Middleware rewrite: ${pathname} → ${newUrl.pathname}`,
	);

	return NextResponse.rewrite(newUrl);
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
