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
5. Loop continues indefinitely, crashing the dev server

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

3. **Test the infinite loop (will crash the dev server):**
   - Open [http://localhost:3000](http://localhost:3000)
   - Click "Call Home Page Action" to capture the action ID
   - Open browser DevTools Console (F12)
   - Click "📋 Copy Crash Code" and paste in console
   - The dev server will hang with infinite rewrite logs
   - Restart the server with `npm run dev` to continue

## Expected vs Actual

### Expected Behavior
- Invalid server action calls should be rejected or handled gracefully

### Actual Behavior
- Calling a server action from `/foo` causes infinite middleware rewrites and crashes the server ❌

## Security Implications

- Bad actors can exploit this to trigger infinite loops and crash the server
- The infinite loop issue is a potential DoS vulnerability



## Files

- `middleware.ts` - Handles i18n routing and rewrites (no loop protection)
- `app/[locale]/page.tsx` - Home page with server action demonstration
- `app/[locale]/actions.ts` - Server action that logs pathname information
