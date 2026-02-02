'use client'

export default function AboutPage() {
  const handleMaliciousCall = async () => {
    try {
      // This simulates a bad actor calling the home page action from the about page
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Next-Action': '00feb7f186c766b8563f0aab2d1d8d959b1c9c44dc', // This would be extracted from the home page
        },
        body: JSON.stringify([])
      });

      console.log('Malicious call response:', response.status);
      alert('Check the server console! The action was called from /about but pathname info may be wrong.');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>About Page</h1>
      <p>This page does NOT have the home page action.</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#ffcccc', borderRadius: '8px' }}>
        <h2>⚠️ Security Test</h2>
        <p>
          This button demonstrates how a bad actor can call the home page action 
          from this About page, even though the action doesn't belong here.
        </p>
        <p>
          <strong>The Bug:</strong> Due to middleware rewrites for the default locale,
          the server action will receive incorrect pathname information.
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={handleMaliciousCall}
          style={{
            padding: '1rem 2rem',
            fontSize: '16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Call Home Page Action (Malicious)
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>What to Observe:</h3>
        <ol>
          <li>Click the button above</li>
          <li>Check the server console logs</li>
          <li>Notice:
            <ul>
              <li>The referer shows you're on <code>/about</code></li>
              <li>The pathname header might show incorrect information due to middleware rewrite</li>
              <li>The action executes even though it shouldn't be accessible from this page</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Navigation:</h3>
        <ul>
          <li><a href="/" style={{ color: 'blue' }}>Back to Home Page</a></li>
        </ul>
      </div>
    </div>
  )
}
