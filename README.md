# Next.js Server Action Bug Demo - i18n Infinite Rewrite Loop

This project demonstrates a bug with Next.js server actions when using i18n rewrites in middleware for a default locale.

## Setup

The project uses:
- **en-US** as the default locale (no prefix in URL, e.g., `/`)
- **en-GB** as a non-default locale (with prefix, e.g., `/en-GB`)

The middleware rewrites all en-US requests from `/` to `/en-US` internally.

## The Bug

**Infinite Rewrite Loop:** When a server action is called from a non-existent route, Next.js can't associate the action with that route, so it falls back to the pathname template without dynamic segments filled in. The middleware then enters an infinite loop:

1. Request: `POST /foo` → middleware rewrites to `/en-US/foo`
2. Next.js doesn't associate the action with `/en-US/foo`, falls back to pathname template: `/[locale]`
3. Middleware sees `/[locale]` (no prefix), rewrites again: `/[locale]` → `/en-US/[locale]`
4. Next.js still can't match route, returns `/[locale]` again
5. Loop continues until max rewrites (10) is reached, returning a 500 error

**Note:** The middleware includes a rewrite counter (max 10) to prevent completely crashing the dev server, but the infinite loop still demonstrates the bug.

This causes issues when:
- Validating server action origins for security
- Bad actors can trigger infinite loops by calling actions from non-existent routes

## How to Test

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. **Test the infinite loop:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Click "💣 Trigger Infinite Loop" button
   - Check server logs to see the rewrite loop (will hit max of 10 rewrites)
   - Browser will receive a 500 error response

## Expected vs Actual

### Expected Behavior
- Invalid server action calls should be rejected or handled gracefully

### Actual Behavior
- Calling a server action from `/foo` causes infinite middleware rewrites (stopped at 10) and returns a 500 error ❌

## Security Implications

- Bad actors can exploit this to trigger rewrite loops
- Without the counter protection, this would be a DoS vulnerability that crashes the server
- The rewrite counter demonstrates the bug while preventing actual crashes



## Files

- `middleware.ts` - Handles i18n routing with rewrites (includes loop protection counter)
- `app/[lang]/page.tsx` - Home page with server action demonstration
- `app/[lang]/actions.ts` - Server action that logs pathname information
- `i18n-config.ts` - i18n configuration
- `RESEARCH.md` - Analysis of how next-intl and next-international handle this
- `PACKAGE_COMPARISON.md` - Comprehensive comparison of i18n packages
