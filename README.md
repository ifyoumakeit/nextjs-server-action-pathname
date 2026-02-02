# Next.js Server Action Security Bug Demo - i18n Pathname Issue

This project demonstrates a security issue with Next.js server actions when using i18n rewrites in middleware for a default locale.

## Setup

The project uses:
- **en-US** as the default locale (no prefix in URL, e.g., `/`)
- **en-GB** as a non-default locale (with prefix, e.g., `/en-GB`)

The middleware rewrites all en-US requests from `/` to `/en-US` internally.

## The Security Issue

When a bad actor calls a server action from a route where it doesn't exist (e.g., calling the home page action from `/about`), the middleware rewrite causes the server to receive incorrect pathname information.

**This creates a security vulnerability because:**

1. Server actions can be called from ANY route, not just where they're defined
2. The pathname information in headers becomes unreliable due to middleware rewrites
3. Security checks based on pathname/referer can be bypassed or confused
4. It's difficult to verify the legitimate origin of the action call

## How to Test

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

4. Click the "Call Home Page Action (Legitimate)" button and check the server logs

5. Navigate to [http://localhost:3000/about](http://localhost:3000/about)

6. Click the "Call Home Page Action (Malicious)" button

7. Check the terminal/console logs to see the security violation

## What You'll Observe

When the home page action is called from the About page:
- ❌ The action executes even though it doesn't belong to that page
- ⚠️ The pathname header information may be incorrect due to middleware rewrite
- 🔍 The referer shows `/about`, but validation is difficult due to pathname confusion

## Security Implications

- Server actions need reliable pathname information for security checks
- Middleware rewrites for i18n (especially default locales) can obscure the real request path
- Bad actors can exploit this to call actions from unintended contexts
- CSRF-like vulnerabilities may emerge if pathname-based validation is used

## Files

- `middleware.ts` - Handles i18n routing and rewrites
- `app/[locale]/page.tsx` - Home page with a server action
- `app/[locale]/about/page.tsx` - About page that maliciously calls the home action
- `app/[locale]/actions.ts` - Server action that should only be called from home page
