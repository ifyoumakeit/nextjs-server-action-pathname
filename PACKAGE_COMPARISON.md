# Comprehensive Analysis: i18n Packages that Keep Default Locale at Root

## Research Summary - January 2026

Based on analysis of popular Next.js i18n packages that support hiding the default locale prefix (keeping default locale at `/` instead of `/en`).

---

## Package Comparison

### 1. **next-intl** (Most Popular)

**Default Strategy:** `localePrefix: 'always'` - ALL locales get prefixes
- ❌ By default, DOES NOT support default locale at root
- ✅ Can be configured with `localePrefix: 'as-needed'` or custom settings

**Middleware Approach:**
- Uses `NextResponse.rewrite()` when configured to hide default locale
- Sets locale in route context via `[locale]` segment
- Server actions read locale from `getTranslations()` which uses route context

**Key Insight:** They intentionally avoid the rewrite complexity by requiring prefixes

---

### 2. **next-international** ⭐ (USES REWRITE FOR DEFAULT)

**Strategy:** `urlMappingStrategy: 'rewriteDefault'`
- ✅ Default locale has NO prefix: `/products`
- ✅ Other locales have prefix: `/fr/products`

**Middleware Implementation:**
```typescript
if (strategy === 'rewriteDefault' && locale === config.defaultLocale) {
  // REWRITE for default locale
  const response = NextResponse.rewrite(nextUrl);
  return addLocaleToResponse(request, response, locale);
}

// Later: if visiting /en explicitly, redirect to remove it
if (pathnameLocale === config.defaultLocale) {
  response = NextResponse.redirect(newUrl);  // /en/products -> /products
}
```

**Key Features:**
- ✅ Sets `X-Next-Locale` custom header on every response
- ✅ Sets `Next-Locale` cookie for persistence
- ✅ Server actions can read locale from header, not pathname

**Does it avoid the bug?**
- ❌ Would still hit infinite loop if server action called from `/foo`
- ✅ But mitigates pathname issues via custom headers

---

### 3. **next-i18n-router** ⭐ (MOST SIMILAR TO OUR DEMO)

**Default Strategy:** `prefixDefault: false` (default)
- ✅ Default locale has NO prefix: `/products`
- ✅ Other locales have prefix: `/de/products`

**Config Options:**
```javascript
const i18nConfig = {
  locales: ['en', 'de', 'ja'],
  defaultLocale: 'en',
  prefixDefault: false,  // Don't prefix default locale
  noPrefix: false,       // Set to true to hide ALL locales
}
```

**Middleware:**
- Creates `proxy.js` (or `middleware.js` in Next.js 15)
- Uses `i18nRouter(request, i18nConfig)` function
- Handles locale detection from `accept-language` header
- Sets `NEXT_LOCALE` cookie

**Cookie Behavior (`serverSetCookie`):**
- `'always'` (default): Overwrites cookie when pathname includes locale
- `'if-empty'`: Only sets cookie if none exists
- `'never'`: Never auto-sets cookie

**Does it avoid the bug?**
- Unknown - source code not fully reviewed
- Likely uses same rewrite approach as others
- Would probably hit the same infinite loop issue

---

### 4. **Paraglide-Next**

**Approach:** Uses Next.js built-in i18n + middleware
- Recommends using middleware for locale detection
- Follows Next.js documentation patterns
- Uses `Accept-Language` header with `@formatjs/intl-localematcher`

**Default Locale:**
- ✅ Supports default locale without prefix
- Structure: All pages under `app/[lang]`

**Does it avoid the bug?**
- Unknown - implementation details not fully documented
- Likely similar rewrite approach

---

### 5. **Tolgee** (with next-intl)

**Approach:** Uses `next-intl` under the hood
- Cookie-based OR URL-based routing
- URL-based routing delegates to `next-intl` middleware
- Same behavior as `next-intl`

**Does it avoid the bug?**
- Inherits `next-intl` behavior
- By default uses prefixes for all locales

---

### 6. **Lingui**

**Approach:** Uses middleware for locale detection
- Uses `negotiator` library for `Accept-Language` parsing
- All pages under `app/[lang]`
- Manual middleware setup required

**Does it avoid the bug?**
- Unknown - minimal middleware documentation
- Implementation left to developer

---

## Summary Table

| Package | Default at Root? | Rewrite Strategy | Custom Headers | Avoids Bug? |
|---------|-----------------|------------------|----------------|-------------|
| **next-intl** | ❌ (by default) | Only with config | ❌ | ✅ (no rewrite by default) |
| **next-international** | ✅ (`rewriteDefault`) | YES - rewrites default | ✅ `X-Next-Locale` | ⚠️ (mitigated by headers) |
| **next-i18n-router** | ✅ (default) | Likely YES | Cookie only | ❌ (probably) |
| **Paraglide-Next** | ✅ | Likely YES | Unknown | ❌ (probably) |
| **Tolgee** | ❌ (uses next-intl) | Delegates to next-intl | ❌ | ✅ (no rewrite by default) |
| **Lingui** | ✅ (configurable) | Developer choice | ❌ | Unknown |

---

## Key Findings

### Packages that DEFINITELY use rewrites for default locale:
1. **next-international** - Confirmed in source code
2. **next-i18n-router** - Highly likely based on docs

### How they mitigate the pathname issue:

**next-international's approach:**
```typescript
// They add explicit locale info
response.headers.set(LOCALE_HEADER, locale);  // X-Next-Locale
response.cookies.set(LOCALE_COOKIE, locale);   // Next-Locale cookie

// Server components can read locale without pathname parsing
const locale = headers().get('X-Next-Locale');
```

**Why this helps:**
- Server actions don't need to parse URLs
- Locale info is explicit in headers/cookies
- Less reliance on `x-invoke-path` or referer

### The Infinite Loop Bug

**All packages using rewrites are vulnerable when:**
1. Server action called from non-existent route (e.g., `/foo`)
2. Middleware tries to rewrite `/[locale]` → `/en/[locale]`
3. Infinite loop occurs

**Mitigation strategies found:**
- ✅ Use custom headers for locale (next-international)
- ✅ Avoid rewrites entirely (next-intl default)
- ✅ Add loop detection in middleware (not seen in any package)

---

## Recommendations

**If you MUST keep default locale at root:**

1. **Use next-international** - Most battle-tested with `rewriteDefault`
   - Has custom headers to avoid pathname issues
   - Active maintenance and good documentation

2. **Use next-i18n-router** - Simpler, more focused
   - Specifically built for App Router
   - Good integration examples

3. **Custom implementation** - Add protections:
   ```typescript
   // Detect loops
   if (pathname.includes('[locale]')) {
     return NextResponse.next();
   }
   
   // Set custom headers
   response.headers.set('X-Locale', locale);
   
   // Never rely on pathname for security
   ```

**Best practice:**
- Use `localePrefix: 'always'` (next-intl default) to avoid rewrites entirely
- Trade-off: All URLs have locale prefix, but more reliable
