'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0B132B', color: '#FFFFFF', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '400px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Application Error</h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>
              A critical error occurred while initializing WanderSphere.
            </p>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#19A7E0',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
