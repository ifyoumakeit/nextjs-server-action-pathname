'use server'

import { headers } from 'next/headers'

export async function homePageAction() {
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') || 'not-found'
  const referer = headersList.get('referer') || 'not-found'
  const nextUrl = headersList.get('x-nextjs-rewrite') || 'not-found'
  
  console.log('='.repeat(80))
  console.log('🏠 HOME PAGE ACTION CALLED')
  console.log('='.repeat(80))
  console.log('⚠️  This action should ONLY be callable from the home page!')
  console.log('')
  console.log('Pathname (x-invoke-path):', pathname)
  console.log('Referer:', referer)
  console.log('Next.js Rewrite Header:', nextUrl)
  console.log('')
  console.log('🔍 Security Check:')
  console.log('   Expected referer: http://localhost:3000/')
  console.log('   Actual referer:', referer)
  
  if (!referer.endsWith('/') || referer.includes('/about')) {
    console.log('   ❌ SECURITY VIOLATION: Action called from wrong page!')
    console.log('   This action was called from:', referer)
    console.log('   But the pathname header shows:', pathname)
  } else {
    console.log('   ✅ Legitimate call from home page')
  }
  
  console.log('='.repeat(80))
  
  return {
    pathname,
    referer,
    timestamp: new Date().toISOString()
  }
}
