'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Mail, MessageSquare, Send, CheckCircle2, HelpCircle, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    
    // Save submission entry to local storage feedback log
    try {
      const existing = JSON.parse(localStorage.getItem('wandersphere_contact_submissions') || '[]');
      const newEntry = {
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('wandersphere_contact_submissions', JSON.stringify([newEntry, ...existing]));
    } catch {
      /* ignore storage errors */
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Feedback recorded!');
    }, 400);
  };

  const mailtoUrl = `mailto:support@wandersphere.in?subject=${encodeURIComponent(`[WanderSphere ${subject}] ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;

  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'Contact Support', href: '/contact' }]} className="mb-6" />

        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <Mail size={14} />
            <span>Support & Feedback</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Contact & Travel Support
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ws-text-secondary)' }}>
            Have questions about itinerary planning, destination details, or platform features? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Contact Info Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="ws-glass-strong p-8 rounded-3xl border shadow-xl space-y-6">
              <h2 className="text-xl font-bold border-b pb-4" style={{ borderColor: 'var(--ws-border)' }}>
                Get in Touch
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl ws-glass-soft border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail size={16} style={{ color: 'var(--ws-accent)' }} />
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ws-accent)' }}>Email Support</p>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--ws-text)' }}>support@wandersphere.in</p>
                    <p style={{ color: 'var(--ws-text-secondary)' }}>Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl ws-glass-soft border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={16} style={{ color: 'var(--ws-accent)' }} />
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ws-accent)' }}>Primary Coverage</p>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--ws-text)' }}>All 28 States & UTs across India</p>
                    <p style={{ color: 'var(--ws-text-secondary)' }}>134+ cities & 300+ attractions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl ws-glass-soft border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock size={16} style={{ color: 'var(--ws-accent)' }} />
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ws-accent)' }}>Operating Hours</p>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--ws-text)' }}>Monday – Saturday: 9 AM – 6 PM IST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-7">
            <div className="ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-xl">
              {submitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full ws-glass border flex items-center justify-center">
                    <CheckCircle2 size={32} style={{ color: 'var(--ws-accent)' }} />
                  </div>
                  <h2 className="text-2xl font-bold">Feedback Recorded</h2>
                  <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: 'var(--ws-text-secondary)' }}>
                    Your message has been stored in local browser history. To send this directly via your email client to support@wandersphere.in, click the button below:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={mailtoUrl}
                      className="px-6 py-2.5 rounded-full text-xs font-bold ws-ocean-btn-primary inline-flex items-center gap-2"
                    >
                      <Mail size={14} />
                      <span>Open Email App</span>
                    </a>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setMessage('');
                      }}
                      className="px-6 py-2.5 rounded-full text-xs font-bold ws-glass border hover:border-[var(--ws-accent)] transition-all"
                    >
                      Submit Another Query
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Send Us a Message</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>
                        Your Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        style={{
                          backgroundColor: 'var(--ws-input-bg)',
                          borderColor: 'var(--ws-input-border)',
                          color: 'var(--ws-text)',
                        }}
                        className="w-full border rounded-2xl py-3 px-4 text-xs focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>
                        Your Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        style={{
                          backgroundColor: 'var(--ws-input-bg)',
                          borderColor: 'var(--ws-input-border)',
                          color: 'var(--ws-text)',
                        }}
                        className="w-full border rounded-2xl py-3 px-4 text-xs focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>
                      Subject
                    </label>
                    <select
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{
                        backgroundColor: 'var(--ws-input-bg)',
                        borderColor: 'var(--ws-input-border)',
                        color: 'var(--ws-text)',
                      }}
                      className="w-full border rounded-2xl py-3 px-4 text-xs focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="itinerary">Itinerary Generator Query</option>
                      <option value="data">Data Correction / Place Suggestion</option>
                      <option value="accessibility">Accessibility Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we assist you with WanderSphere?"
                      style={{
                        backgroundColor: 'var(--ws-input-bg)',
                        borderColor: 'var(--ws-input-border)',
                        color: 'var(--ws-text)',
                      }}
                      className="w-full border rounded-2xl py-3 px-4 text-xs focus:outline-none focus:border-[var(--ws-accent)] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest ws-ocean-btn-primary flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
