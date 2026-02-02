# How Other i18n Packages Handle Middleware Rewrites and Server Actions

## Research Summary - January 2026

### next-intl Approach

**Key Findings:**

1. **They DON'T hide the default locale from the URL by default**
   - Default behavior: `localePrefix: 'always'` - all locales including default get a prefix
   - URLs look like: `/en/about`, `/de/about` (both have prefixes)
   - This AVOIDS the middleware rewrite issue entirely

2. **When they DO rewrite (with `localePrefix` customization)**
   - They still use middleware rewrites similar to our setup
   - The middleware runs BEFORE server actions are invoked
   - Server actions receive the locale context through Next.js's built-in mechanisms

3. **Server Action Strategy**
   - Server actions don't rely on pathname headers for locale detection
   - Instead, they use `getTranslations()` which reads locale from:
     - The `[locale]` segment in the route (via params)
     - OR an explicit locale passed in: `getTranslations({locale: 'en'})`
   - This avoids any dependency on `x-invoke-path` or other pathname headers

4. **Why This Works**
   - The locale is part of the route structure (`app/[locale]/`)
   - Next.js knows the locale from the dynamic segment, not from pathname headers
   - Server actions inherit the route context automatically
   - No need to parse URLs or check referer headers

### Example from next-intl

```typescript
// Server Action
async function loginAction(data: FormData) {
  'use server';
  
  // This reads locale from the route context, NOT from pathname headers
  const t = await getTranslations('LoginForm');
  
  // ... rest of action
}
```

### The Bug We're Demonstrating

**Our scenario exposes a different issue:**
- When a bad actor calls a server action from a route where it doesn't exist (e.g., `/foo`)
- The middleware rewrite causes pathname confusion
- The middleware gets into an infinite loop trying to rewrite `/[locale]` → `/en-US/[locale]`

**Why next-intl doesn't hit this:**
1. They structure ALL routes under `[locale]` segment
2. The middleware checks if a locale is already in the path before rewriting
3. Server actions are invoked through the proper route structure
4. Even malicious calls would go through the locale-prefixed route

### next-international with `rewriteDefault`

**How they implement it:**

Looking at their actual middleware source code, here's what happens with `rewriteDefault`:

```typescript
// When no locale prefix is in the pathname
if (noLocalePrefix(config.locales, nextUrl.pathname)) {
  nextUrl.pathname = `/${locale}${nextUrl.pathname}`;
  
  if (strategy === 'rewriteDefault' && locale === config.defaultLocale) {
    // REWRITE for default locale (en: / -> /en internally)
    const response = NextResponse.rewrite(nextUrl);
    return addLocaleToResponse(request, response, locale);
  } else {
    // REDIRECT for non-default locales (fr: / -> /fr with visible URL change)
    const response = NextResponse.redirect(nextUrl);
    return addLocaleToResponse(request, response, locale);
  }
}

// Later: if visiting /en explicitly, redirect to remove it
if (config.urlMappingStrategy === 'rewriteDefault' && 
    pathnameLocale === config.defaultLocale) {
  // Remove the locale from the pathname
  const pathnameWithoutLocale = nextUrl.pathname.slice(pathnameLocale.length + 1);
  const newUrl = new URL(pathnameWithoutLocale || '/', request.url);
  response = NextResponse.redirect(newUrl);  // Redirect /en/products -> /products
}
```

**Key differences from our implementation:**

1. **They add a custom header:** `X-Next-Locale` (stored in `LOCALE_HEADER` constant)
   - This header is set on EVERY response via `addLocaleToResponse()`
   - Server actions can read this header to know the locale

2. **They set a cookie:** `Next-Locale` (stored in `LOCALE_COOKIE` constant)
   - The cookie persists the user's locale choice
   - Checked BEFORE the Accept-Language header
   - Updated whenever locale changes

3. **Double redirect strategy:**
   - First request to `/` → rewrite to `/en` internally (if default locale)
   - If user explicitly visits `/en` → redirect to `/` (remove the prefix)
   - This prevents `/en` from being accessible in the browser

**Do they avoid the server action pathname bug?**

**Partially, but they would have the same issue:**
- Like our code, they use `NextResponse.rewrite()` for the default locale
- Server actions would still be callable from arbitrary routes
- The pathname would still show the rewritten path (`/en` instead of `/`)

**However, their approach is better because:**
- The `X-Next-Locale` header provides explicit locale information
- Server actions can read the locale from the header, not from pathname parsing
- They don't rely on `x-invoke-path` or referer for security checks

### Key Takeaways

**How packages avoid pathname-based issues:**

1. **next-intl:** Avoids the problem entirely by using `localePrefix: 'always'` by default
   - All locales get prefixes, no rewrites needed for default locale
   - Server actions read locale from route segment via `getTranslations()`

2. **next-international with `rewriteDefault`:** Uses the same rewrite strategy as our demo
   - DOES rewrite `/` → `/en` internally for default locale
   - Sets custom `X-Next-Locale` header on all responses
   - Server actions read locale from header, not from pathname
   - Still vulnerable to the infinite loop bug if server action called from invalid route

**Critical insight:**

Both packages avoid pathname-based security checks in server actions because:
1. **Custom headers provide explicit locale info** (not derived from URL)
2. **Middleware handles routing, not security validation**
3. **Server actions get context from headers/cookies/route-segments, NOT from pathname parsing**

**The bugs we're reproducing:**

1. **Pathname confusion:** Middleware rewrites cause `x-invoke-path` to show wrong value
2. **Infinite rewrite loop:** Calling server action from non-existent route (`/foo`) causes middleware to loop
3. **Security validation issues:** Can't trust pathname for validation when middleware does rewrites

**Why these bugs matter:**

- If you rely on pathname for security checks, middleware rewrites break your validation
- If you don't prevent invalid routes, server actions can cause infinite loops
- Popular i18n packages mitigate this by using headers/cookies, not pathname parsing
