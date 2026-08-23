import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { WebGLBackground } from '@/components/WebGLBackground';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'WanderSphere — Explore India',
  description: 'Plan personalized, AI-powered travel itineraries across Indian states and cities. Discover famous attractions and hidden gems with our interactive travel map.',
  keywords: 'travel, India, states, cities, tourism, explore, WanderSphere, places, itinerary, AI travel planner',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'WanderSphere — Explore India',
    description: 'Plan personalized, AI-powered travel itineraries across Indian states and cities.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <body className={`${inter.className} antialiased min-h-screen relative`}>
        <ThemeProvider>
          <WebGLBackground />
          <AuthProvider>
            <div className="relative z-10 w-full min-h-screen flex flex-col">
              {children}
            </div>
          </AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--ws-surface)',
                color: 'var(--ws-text)',
                border: '1px solid var(--ws-border)',
                borderRadius: '16px',
                fontSize: '13px',
                boxShadow: 'var(--ws-shadow)',
              },
              success: {
                iconTheme: { primary: 'var(--ws-primary)', secondary: 'var(--ws-bg)' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: 'var(--ws-bg)' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
