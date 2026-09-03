import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCanonicalUrl } from '@/lib/siteConfig';
import { Accessibility, Eye, Monitor, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Accessibility Statement | WanderSphere',
  description: 'Learn about WanderSphere commitment to digital accessibility, keyboard navigation, and inclusive design standards.',
  alternates: {
    canonical: getCanonicalUrl('/accessibility'),
  },
};

export default function AccessibilityPage() {
  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'Accessibility', href: '/accessibility' }]} className="mb-6" />

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <Accessibility size={14} />
            <span>Inclusive Design</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Accessibility Statement
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ws-text-secondary)' }}>
            WanderSphere is designed with accessibility best practices and WCAG 2.1 AA considerations in mind for travelers of all abilities.
          </p>
        </div>

        <div className="space-y-8 ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye size={18} style={{ color: 'var(--ws-accent)' }} />
              1. Our Accessibility Principles
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              We continuously improve user experience for everyone by embedding accessibility into our design architecture and development practices:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5" style={{ color: 'var(--ws-text-secondary)' }}>
              <li><strong>Keyboard Navigation:</strong> All interactive elements, search overlays (`⌘K`), modals, and navigation links are accessible via keyboard.</li>
              <li><strong>Reduced Motion Compliance:</strong> When system preferences request reduced motion (`prefers-reduced-motion: reduce`), heavy canvas WebGL background rendering and complex transitions adapt gracefully.</li>
              <li><strong>High Contrast Ratios:</strong> Colors in both Light and Dark modes are optimized for readability against background surfaces.</li>
              <li><strong>Semantic Structure:</strong> HTML5 semantic tags (&lt;main&gt;, &lt;nav&gt;, &lt;header&gt;, &lt;footer&gt;, &lt;h1&gt;-&lt;h6&gt;) provide structured hierarchy for assistive technologies and screen readers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Monitor size={18} style={{ color: 'var(--ws-accent)' }} />
              2. Assistive Technology Compatibility
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              WanderSphere is tested across modern desktop and mobile web browsers (Chrome, Safari, Firefox, Edge) alongside screen readers such as VoiceOver and NVDA.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={18} style={{ color: 'var(--ws-accent)' }} />
              3. Feedback & Contact
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              We welcome your feedback on the accessibility of WanderSphere. If you encounter accessibility barriers, please let us know so we can resolve them promptly.
            </p>
          </section>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
            <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              Have accessibility suggestions or issues to report?
            </p>
            <Link href="/contact" className="px-5 py-2.5 rounded-full text-xs font-bold ws-ocean-btn-primary">
              Report Accessibility Issue
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
