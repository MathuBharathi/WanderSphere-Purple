import React from 'react';
import { Globe, Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" style={{ color: 'var(--ws-text)' }}>
      <div className="ws-glass-strong p-8 rounded-3xl border shadow-xl flex flex-col items-center gap-4 max-w-xs w-full">
        <div className="relative">
          <div className="w-14 h-14 rounded-full ws-glass-soft border flex items-center justify-center shadow-md">
            <Globe size={24} style={{ color: 'var(--ws-accent)' }} />
          </div>
          <Loader2 size={24} className="animate-spin absolute -top-1 -right-1" style={{ color: 'var(--ws-accent)' }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            WanderSphere
          </p>
          <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--ws-text-secondary)' }}>
            Loading travel destination...
          </p>
        </div>
      </div>
    </div>
  );
}
