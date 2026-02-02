import { homePageAction } from './actions'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Home Page - i18n Server Action Security Bug</h1>
      <p><strong>Current Locale:</strong> {locale}</p>
      <p><strong>Current Route:</strong> {locale === 'en-US' ? '/' : `/${locale}`}</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Test Instructions:</h2>
        <ol>
          <li>Open DevTools Console (F12)</li>
          <li>Go to the <a href="/about" style={{ color: 'blue' }}>/about</a> page</li>
          <li>In the console, run the code snippet shown below to call this home page action from the about page</li>
          <li>Check the server console logs - it will show the wrong pathname!</li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Legitimate Action (on this page):</h3>
        <form action={homePageAction}>
          <button
            type="submit"
            style={{
              padding: '1rem 2rem',
              fontSize: '16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Call Home Page Action (Legitimate)
          </button>
        </form>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#ffcccc', borderRadius: '8px' }}>
        <h3>Security Issue:</h3>
        <p>
          A bad actor can call this action from ANY route (even routes where it shouldn't exist).
          Due to the middleware rewrite for the default locale, the server action will receive 
          incorrect pathname information.
        </p>
        <p>
          <strong>Console code to run from /about page:</strong>
        </p>
        <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`// Get the action ID from the home page's form
const homePageActionId = '${Buffer.from('homePageAction').toString('base64')}';

// Call it from the about page
fetch('/', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=UTF-8',
    'Next-Action': homePageActionId
  },
  body: JSON.stringify([])
});`}
        </pre>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Navigation:</h3>
        <ul>
          <li><a href="/" style={{ color: 'blue' }}>Home Page (this page)</a></li>
          <li><a href="/about" style={{ color: 'blue' }}>About Page</a></li>
        </ul>
      </div>
    </div>
  )
}
