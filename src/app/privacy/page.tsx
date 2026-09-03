import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCanonicalUrl } from '@/lib/siteConfig';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | WanderSphere',
  description: 'Understand how WanderSphere protects your personal information, trip preferences, and account security.',
  alternates: {
    canonical: getCanonicalUrl('/privacy'),
  },
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'Privacy Policy', href: '/privacy' }]} className="mb-6" />

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <Shield size={14} />
            <span>Trust & Security</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ws-text-secondary)' }}>
            Last updated: September 2026. At WanderSphere, we respect your privacy and are committed to protecting your personal information while you explore India&apos;s best travel destinations.
          </p>
        </div>

        <div className="space-y-8 ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock size={18} style={{ color: 'var(--ws-accent)' }} />
              1. Information We Collect
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              We collect information to provide intelligent travel recommendations, save your personalized itineraries, and enable authentication across your devices.
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5" style={{ color: 'var(--ws-text-secondary)' }}>
              <li><strong>Account Credentials:</strong> Email address and authentication tokens via Supabase.</li>
              <li><strong>Profile Information:</strong> Full name, avatar preferences, bio, and home city if voluntarily provided.</li>
              <li><strong>Saved Travel Preferences:</strong> Saved places, wishlists, and customized itinerary plans.</li>
              <li><strong>Technical Data:</strong> Browser type, device screen size, and approximate geolocation (only when permission is explicitly granted for the &quot;Near Me&quot; feature).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye size={18} style={{ color: 'var(--ws-accent)' }} />
              2. How We Use Your Data
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              Your data is utilized solely for enhancing your experience on WanderSphere:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5" style={{ color: 'var(--ws-text-secondary)' }}>
              <li>Generating personalized, distance-optimized travel itineraries.</li>
              <li>Storing saved places in your profile for future access.</li>
              <li>Improving site responsiveness and map tile caching.</li>
              <li>We <strong>never sell</strong> your personal data to third parties or advertising networks.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText size={18} style={{ color: 'var(--ws-accent)' }} />
              3. Data Retention & Cookies
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              WanderSphere utilizes essential local storage (`localStorage`) to remember your theme choice (Day/Night mode) and unauthenticated saved places so you do not lose your selections. For registered users, account preferences are securely synchronized with Supabase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 size={18} style={{ color: 'var(--ws-accent)' }} />
              4. Your Privacy Rights
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              You have full control over your personal information. You can access, update, or permanently delete your account data directly from your <Link href="/profile" className="underline font-semibold" style={{ color: 'var(--ws-accent)' }}>Profile Settings</Link> page at any time.
            </p>
          </section>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
            <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              Have privacy questions? Reach out to our team anytime.
            </p>
            <Link href="/contact" className="px-5 py-2.5 rounded-full text-xs font-bold ws-ocean-btn-primary">
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
