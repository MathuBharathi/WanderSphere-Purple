import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { WebGLBackground } from '@/components/WebGLBackground';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

import { SITE_URL, SITE_DESCRIPTION } from '@/lib/siteConfig';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'WanderSphere | Discover the Best Places to Travel in India',
    template: '%s | WanderSphere',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'travel India',
    'India tourism',
    'itinerary planner',
    'hidden gems India',
    'city travel guide',
    'WanderSphere',
    'interactive travel map',
    'Indian travel discovery',
    'state attraction guide',
  ],
  authors: [{ name: 'WanderSphere' }],
  creator: 'WanderSphere',
  publisher: 'WanderSphere',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: 'WanderSphere | Discover the Best Places to Travel in India',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'WanderSphere',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WanderSphere — Interactive Travel Platform for India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WanderSphere | Discover the Best Places to Travel in India',
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
