import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#143028',
              color: '#F0F7F4',
              border: '1px solid #2C5E3B',
              borderRadius: '16px',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#C69234', secondary: '#0B1914' },
            },
            error: {
              iconTheme: { primary: '#A65D29', secondary: '#0B1914' },
            },
          }}
        />
      </body>
    </html>
  );
}
