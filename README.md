# Next.js Server Action Bug Demo - i18n Pathname Issue

This project demonstrates bugs with Next.js server actions when using i18n rewrites in middleware for a default locale.

## Setup

The project uses:
- **en-US** as the default locale (no prefix in URL, e.g., `/`)
- **en-GB** as a non-default locale (with prefix, e.g., `/en-GB`)

The middleware rewrites all en-US requests from `/` to `/en-US` internally.

## The Bug

When using middleware rewrites for the default locale in i18n routing, two issues occur:

**Pathname Confusion:** Server actions receive the rewritten path (`/en-US`) instead of the original path (`/`) in headers, making it impossible to reliably determine the actual URL the user visited.

**Infinite Rewrite Loop:** When a server action is called from a non-existent route, Next.js can't associate the action with that route, so it falls back to the pathname template without dynamic segments filled in. The middleware then enters an infinite loop:
1. Request: `POST /foo` → middleware rewrites to `/en-US/foo`
2. Next.js doesn't associate the action with `/en-US/foo`, falls back to pathname template: `/[locale]`
3. Middleware sees `/[locale]` (no prefix), rewrites again: `/[locale]` → `/en-US/[locale]`
4. Next.js still can't match route, returns `/[locale]` again
5. Loop continues indefinitely, crashing the dev server

These bugs cause issues when trying to:
- Determine the actual URL the user visited
- Build canonical URLs
- Handle redirects or navigation based on the current path
- Validate server action origins for security

## How to Test

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. **Test pathname confusion:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Click the "Call Home Page Action" button
   - Check the terminal/console logs to see the pathname shows `/en-US` instead of `/`

4. **Test the infinite loop (will crash the dev server):**
   - Click "Call Home Page Action" to capture the action ID
   - Open browser DevTools Console (F12)
   - Click "📋 Copy Crash Code" and paste in console
   - The dev server will hang with infinite rewrite logs
   - Restart the server with `npm run dev` to continue

## Expected vs Actual

### Expected Behavior
- When calling the server action from `/`, the pathname should be `/`
- When calling from `/en-GB`, the pathname should be `/en-GB`
- Invalid server action calls should be rejected or handled gracefully

### Actual Behavior
- When calling from `/`, the pathname shows `/en-US` (the rewritten path) ❌
- When calling from `/en-GB`, the pathname correctly shows `/en-GB` ✅
- Calling a server action from `/foo` causes infinite middleware rewrites and crashes the server ❌

## Security Implications

- Server actions need reliable pathname information for security checks
- Middleware rewrites for i18n (especially default locales) can obscure the real request path
- Bad actors can exploit this to call actions from unintended contexts
- The infinite loop issue is a potential DoS vulnerability

## How Other i18n Packages Handle This

See [RESEARCH.md](./RESEARCH.md) for analysis of how `next-intl` and `next-international` handle this issue.

See [PACKAGE_COMPARISON.md](./PACKAGE_COMPARISON.md) for a comprehensive comparison of i18n packages that support hiding the default locale.

**Key findings:**
- Most popular packages avoid this by requiring locale prefixes for ALL locales
- `next-international` uses the same rewrite strategy but provides custom headers (`X-Next-Locale`) to avoid pathname parsing
- The infinite loop bug would affect any package using middleware rewrites without protection

## Files

- `middleware.ts` - Handles i18n routing and rewrites (no loop protection)
- `app/[locale]/page.tsx` - Home page with server action demonstration
- `app/[locale]/actions.ts` - Server action that logs pathname information
- `RESEARCH.md` - Analysis of how next-intl and next-international handle this
- `PACKAGE_COMPARISON.md` - Comprehensive comparison of i18n packages
