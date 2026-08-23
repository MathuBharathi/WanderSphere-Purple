'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { createItinerary, updateItinerary } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { getPlaceImageUrl } from '@/lib/placeImages';
import { cityTransportInfo } from '@/data/travelData';
import { 
  Calendar, MapPin, Download, Save, Share2, Sparkles, Clock, 
  ArrowLeft, Compass, ArrowRight, AlertCircle, Trash2, 
  GripVertical, Pencil, Check, X, ChevronUp, ChevronDown, Loader2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import type { GeneratedItinerary, SavedItinerary, TimeSlot, ItineraryDay } from '@/types';

// Dynamic import of LeafletMap (client-only)
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-violet-50/50 dark:bg-[#120B24] rounded-3xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-violet-500 text-xs font-semibold uppercase tracking-widest">Map Loading...</p>
      </div>
    </div>
  ),
});

export default function ItineraryPage() {
  const router = useRouter();
  const { generatedItinerary, user, authReady, setGeneratedItinerary, currentItineraryId, setCurrentItineraryId } = useAppStore();
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [shareText, setShareText] = useState('Share Plan');
  const [downloading, setDownloading] = useState(false);

  // Customization state
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState('');
  
  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  // Slot duration editing
  const [editingDurationIndex, setEditingDurationIndex] = useState<number | null>(null);
  const [editDurationValue, setEditDurationValue] = useState('');

  // Auth check: wait for authReady, then redirect if not logged in
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      toast.error('Please sign in to view itineraries');
      router.push('/auth');
    }
  }, [authReady, user, router]);

  // If no itinerary generated, show message
  if (!generatedItinerary) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ color: 'var(--ws-text)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: 'var(--ws-surface)',
            borderColor: 'var(--ws-border)',
            boxShadow: 'var(--ws-shadow)',
          }}
          className="max-w-md border rounded-3xl p-8 shadow-xl"
        >
          <AlertCircle size={40} style={{ color: 'var(--ws-primary)' }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: 'var(--ws-text)' }}>No Itinerary Found</h2>
          <p style={{ color: 'var(--ws-text-muted)' }} className="text-sm mt-2 mb-6">
            Generate a custom travel plan on our home search panel to view it here.
          </p>
          <Link
            href="/"
            style={{
              backgroundColor: 'var(--ws-primary)',
              color: '#FFFFFF',
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-md"
          >
            Start Exploring
          </Link>
        </motion.div>
      </main>
    );
  }

  const { config, days, totalPlaces, hiddenGemsCount, estimatedBudget } = generatedItinerary;
  const currentDayData = days.find((d) => d.dayNumber === activeDay) || days[0];

  const mapItems = currentDayData.slots.map((s) => ({
    id: s.place.id,
    name: s.place.name,
    latitude: s.place.latitude,
    longitude: s.place.longitude,
    cover_image: s.place.cover_image,
    description: s.place.description,
    type: 'place' as const,
    category: s.place.category,
  }));

  const routePoints = currentDayData.slots
    .filter((s) => s.place.latitude && s.place.longitude)
    .map((s) => [s.place.latitude, s.place.longitude] as [number, number]);

  const updateItineraryState = (updatedDays: ItineraryDay[]) => {
    const totalPlacesSet = new Set<string>();
    let gems = 0;
    updatedDays.forEach(d => d.slots.forEach(s => {
      totalPlacesSet.add(s.place.id);
      if (s.place.is_hidden_gem) gems++;
    }));
    setGeneratedItinerary({
      ...generatedItinerary,
      days: updatedDays,
      totalPlaces: totalPlacesSet.size,
      hiddenGemsCount: gems,
    });
  };

  const handleDeleteSlot = (dayNumber: number, slotIndex: number) => {
    const updatedDays = days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      const newSlots = d.slots.filter((_, i) => i !== slotIndex);
      return { ...d, slots: newSlots };
    });
    updateItineraryState(updatedDays);
  };

  const handleMoveSlot = (dayNumber: number, slotIndex: number, direction: 'up' | 'down') => {
    const updatedDays = days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      const newSlots = [...d.slots];
      const targetIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
      if (targetIndex < 0 || targetIndex >= newSlots.length) return d;
      [newSlots[slotIndex], newSlots[targetIndex]] = [newSlots[targetIndex], newSlots[slotIndex]];
      return { ...d, slots: newSlots };
    });
    updateItineraryState(updatedDays);
  };

  const handleStartEditNote = (slotIndex: number, currentNote: string) => {
    setEditingNoteIndex(slotIndex);
    setEditNoteValue(currentNote || '');
  };

  const handleSaveNote = (dayNumber: number, slotIndex: number) => {
    const updatedDays = days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      const newSlots = d.slots.map((s, i) => {
        if (i !== slotIndex) return s;
        return { ...s, notes: editNoteValue };
      });
      return { ...d, slots: newSlots };
    });
    updateItineraryState(updatedDays);
    setEditingNoteIndex(null);
    setEditNoteValue('');
  };
  
  const handleStartEditDuration = (slotIndex: number, currentDuration: number) => {
    setEditingDurationIndex(slotIndex);
    setEditDurationValue(String(currentDuration));
  };
  
  const handleSaveDuration = (dayNumber: number, slotIndex: number) => {
    const newDuration = parseInt(editDurationValue) || 60;
    const updatedDays = days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      const newSlots = d.slots.map((s, i) => {
        if (i !== slotIndex) return s;
        return { ...s, duration: newDuration };
      });
      return { ...d, slots: newSlots };
    });
    updateItineraryState(updatedDays);
    setEditingDurationIndex(null);
    setEditDurationValue('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser) {
        toast.error('Please sign in to save your itinerary');
        router.push('/auth');
        return;
      }

      if (currentItineraryId) {
        await updateItinerary(currentItineraryId, {
          title: editTitleValue || `Trip to ${config.cityName}`,
          config: config,
          itinerary_data: generatedItinerary,
        });
        setSaveSuccess('Itinerary updated successfully!');
        toast.success('Changes saved!');
      } else {
        const payload: Partial<SavedItinerary> = {
          user_id: authUser.id,
          title: editTitleValue || `Trip to ${config.cityName}`,
          config: config,
          itinerary_data: generatedItinerary,
          is_public: true
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('[DIAGNOSTICS] Before Itinerary INSERT:', {
            authUserId: authUser.id,
            itinerary_user_id: payload.user_id,
            isMatch: authUser.id === payload.user_id,
            title: payload.title
          });
        }

        const saved = await createItinerary(payload);
        setCurrentItineraryId(saved.id);
        setSaveSuccess('Itinerary saved to your dashboard!');
        toast.success('Itinerary saved!');
      }
    } catch (err: any) {
      console.error('[handleSave] Error:', err);
      setSaveError(err.message || 'Failed to save itinerary. Please try again.');
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;

      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, fontStyle: string = 'normal'): number => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * (fontSize * 0.4);
      };

      let y = margin;
      // Header block — Deep Ocean Navy
      doc.setFillColor(6, 52, 91);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Title — Ocean Aqua/Cyan
      doc.setTextColor(76, 201, 232);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(`WANDERSPHERE: ${config.cityName.toUpperCase()}`, margin, 20);

      // Subtitle — Soft Ocean Mist
      doc.setTextColor(220, 244, 250);
      doc.setFontSize(10);
      doc.text(`${days.length} Days · ${config.travelStyle.toUpperCase()} · ${config.budget.toUpperCase()} BUDGET`, margin, 28);
      y = 48;

      for (const day of days) {
        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        // Day bar — Ocean Blue
        doc.setFillColor(14, 110, 168);
        doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`DAY ${day.dayNumber}: ${day.title}`, margin + 4, y + 7);
        y += 16;

        for (const slot of day.slots) {
          if (y > 260) {
            doc.addPage();
            y = margin;
          }

          // Slot time & place title
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 143, 208);
          doc.text(`${slot.time} - ${slot.place.name}`, margin + 4, y);
          y += 5;

          // Slot description — Deep Slate
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(53, 93, 120);
          y = addWrappedText(slot.place.description || '', margin + 4, y, pageWidth - margin * 2 - 8, 8);
          y += 6;
        }

        y += 4;
      }

      doc.save(`WanderSphere_${config.cityName}_Itinerary.pdf`);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My Itinerary to ${config.cityName}`,
        text: `Check out my ${days.length}-day itinerary for ${config.cityName} generated by WanderSphere!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareText('Link Copied!');
      setTimeout(() => setShareText('Share Plan'), 2000);
    }
  };

  return (
    <main className="relative min-h-[100svh] flex flex-col transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      <header 
        style={{
          backgroundColor: 'var(--ws-navbar-bg)',
          borderColor: 'var(--ws-border)',
        }}
        className="relative py-8 px-6 border-b backdrop-blur-xl shrink-0 print:hidden"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              style={{
                backgroundColor: 'var(--ws-surface-elevated)',
                borderColor: 'var(--ws-border)',
                color: 'var(--ws-primary)',
              }}
              className="p-3 border hover:border-[var(--ws-primary)] rounded-full transition-all"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-extrabold tracking-widest" style={{ color: 'var(--ws-primary)' }}>
                <span>{config.stateName}</span>
                <span>•</span>
                <span className="text-[#A65D29] flex items-center gap-0.5">
                  <Sparkles size={10} /> {config.travelStyle}
                </span>
              </div>
              {editingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase bg-transparent border-b-2 border-[#C69234] outline-none"
                    autoFocus
                  />
                  <button onClick={() => { setEditingTitle(false); }} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"><Check size={16} /></button>
                  <button onClick={() => { setEditingTitle(false); setEditTitleValue(''); }} className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400"><X size={16} /></button>
                </div>
              ) : (
                <h1 
                  className="text-2xl md:text-3xl font-black tracking-tight mt-1 text-white uppercase group cursor-pointer flex items-center gap-2"
                  onClick={() => { setEditingTitle(true); setEditTitleValue(`${config.cityName} Itinerary`); }}
                >
                  {editTitleValue || `${config.cityName} Itinerary`}
                  <Pencil size={14} className="text-[#A3C2B2] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs ws-glass hover:border-[var(--ws-accent)] font-bold uppercase tracking-wider transition-all"
              style={{ color: 'var(--ws-text)' }}
            >
              <Share2 size={13} style={{ color: 'var(--ws-accent)' }} />
              <span>{shareText}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs ws-glass hover:border-[var(--ws-accent)] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              style={{ color: 'var(--ws-text)' }}
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} style={{ color: 'var(--ws-accent)' }} />}
              <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs ws-ocean-btn-primary font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md"
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : currentItineraryId ? 'Update' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {(saveSuccess || saveError) && (
          <div className="max-w-6xl mx-auto px-6 mt-4 print:hidden">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`rounded-2xl p-4 text-xs font-semibold border ${
                saveSuccess 
                  ? 'ws-glass border-[var(--ws-accent)] text-[var(--ws-accent)]' 
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {saveSuccess || saveError}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 print:hidden">
          <div className="ws-glass border rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <Calendar style={{ color: 'var(--ws-accent)' }} className="shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>Duration</p>
              <p className="text-sm font-extrabold" style={{ color: 'var(--ws-text)' }}>{days.length} Days</p>
            </div>
          </div>
          <div className="ws-glass border rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <Clock style={{ color: 'var(--ws-accent)' }} className="shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>Sights Planned</p>
              <p className="text-sm font-extrabold" style={{ color: 'var(--ws-text)' }}>{totalPlaces} Places</p>
            </div>
          </div>
          <div className="ws-glass border rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <Sparkles style={{ color: 'var(--ws-accent)' }} className="shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>Hidden Gems</p>
              <p className="text-sm font-extrabold" style={{ color: 'var(--ws-text)' }}>{hiddenGemsCount} Sights</p>
            </div>
          </div>
          <div className="ws-glass border rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <Compass style={{ color: 'var(--ws-accent)' }} className="shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>Est. Budget</p>
              <p className="text-sm font-extrabold" style={{ color: 'var(--ws-text)' }}>₹{estimatedBudget?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 print:hidden">
          {days.map((d) => (
            <button
              key={d.dayNumber}
              onClick={() => setActiveDay(d.dayNumber)}
              style={{
                backgroundColor: activeDay === d.dayNumber ? 'rgba(25, 167, 224, 0.18)' : undefined,
                borderColor: activeDay === d.dayNumber ? 'rgba(25, 167, 224, 0.35)' : undefined,
                color: activeDay === d.dayNumber ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                activeDay === d.dayNumber
                  ? 'border shadow-md font-black'
                  : 'ws-glass hover:border-[var(--ws-accent)]'
              }`}
            >
              Day {d.dayNumber}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wider" style={{ color: 'var(--ws-text)' }}>
                {currentDayData.title}
              </h2>
              <span className="text-xs font-bold ws-glass border px-3 py-1 rounded-full print:hidden" style={{ color: 'var(--ws-accent)' }}>
                Day distance: {currentDayData.totalDistance} km
              </span>
            </div>

            {currentDayData.slots.length === 0 ? (
              <div className="text-center py-12 ws-glass rounded-3xl border">
                <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>All slots removed for this day. Regenerate or add from home planner.</p>
              </div>
            ) : (
              <div className="relative border-l-2 ml-4 pl-6 space-y-8 py-2" style={{ borderColor: 'rgba(25, 167, 224, 0.3)' }}>
                {currentDayData.slots.map((slot, index) => (
                  <div key={`${slot.place.id}-${index}`} className="relative group">
                    <span className="absolute -left-[33px] top-1.5 w-[18px] h-[18px] rounded-full border-2 ws-glass flex items-center justify-center" style={{ borderColor: 'var(--ws-accent)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--ws-accent)' }} />
                    </span>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md ws-glass-soft border" style={{ color: 'var(--ws-accent)' }}>
                        {slot.time}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold" style={{ color: 'var(--ws-text-secondary)' }}>
                        {slot.label}
                      </span>

                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                        <button
                          onClick={() => handleMoveSlot(currentDayData.dayNumber, index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded-md hover:text-[var(--ws-accent)] disabled:opacity-30 transition-all"
                          style={{ color: 'var(--ws-text-secondary)' }}
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveSlot(currentDayData.dayNumber, index, 'down')}
                          disabled={index === currentDayData.slots.length - 1}
                          className="p-1 rounded-md hover:text-[var(--ws-accent)] disabled:opacity-30 transition-all"
                          style={{ color: 'var(--ws-text-secondary)' }}
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(currentDayData.dayNumber, index)}
                          className="p-1 rounded-md hover:bg-rose-500/20 text-rose-400 transition-all"
                          title="Remove slot"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="ws-glass rounded-2xl border overflow-hidden shadow-sm flex flex-col sm:flex-row hover:border-[var(--ws-accent)] transition-all">
                      <div
                        className="w-full sm:w-36 h-32 sm:h-auto bg-cover bg-center shrink-0 border-r"
                        style={{
                          backgroundImage: `url(${getPlaceImageUrl(slot.place.name, slot.place.category, slot.place.cover_image)})`,
                          borderColor: 'var(--ws-border)',
                        }}
                      />
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
                              {slot.place.category}
                            </span>
                            {slot.place.is_hidden_gem && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ws-glass border" style={{ color: 'var(--ws-accent)' }}>
                                <Sparkles size={8} /> Hidden Gem
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-base mt-1" style={{ color: 'var(--ws-text)' }}>
                            {slot.place.name}
                          </h3>
                          <p className="text-xs leading-relaxed mt-1.5 mb-2" style={{ color: 'var(--ws-text-secondary)' }}>
                            {slot.place.description}
                          </p>

                          {editingNoteIndex === index ? (
                            <div className="flex items-center gap-2 mb-2 print:hidden">
                              <input
                                type="text"
                                value={editNoteValue}
                                onChange={(e) => setEditNoteValue(e.target.value)}
                                placeholder="Add a personal note..."
                                className="flex-1 ws-glass rounded-lg py-1.5 px-3 text-xs outline-none border focus:border-[var(--ws-accent)]"
                                style={{ color: 'var(--ws-text)' }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNote(currentDayData.dayNumber, index)}
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 transition-all"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => { setEditingNoteIndex(null); setEditNoteValue(''); }}
                                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 transition-all"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="print:hidden">
                              {slot.notes ? (
                                <button
                                  onClick={() => handleStartEditNote(index, slot.notes || '')}
                                  className="text-[10px] hover:underline italic flex items-center gap-1 mb-2 transition-colors"
                                  style={{ color: 'var(--ws-accent)' }}
                                >
                                  <Pencil size={9} /> {slot.notes}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartEditNote(index, '')}
                                  className="text-[10px] opacity-60 hover:opacity-100 flex items-center gap-1 mb-2 transition-opacity"
                                  style={{ color: 'var(--ws-text-secondary)' }}
                                >
                                  <Pencil size={9} /> Add note
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t pt-3 text-[11px]" style={{ borderColor: 'var(--ws-border)', color: 'var(--ws-text-secondary)' }}>
                          <div className="flex gap-4">
                            {editingDurationIndex === index ? (
                              <span className="flex items-center gap-1 print:hidden">
                                <Clock size={11} style={{ color: 'var(--ws-accent)' }} />
                                <input
                                  type="number"
                                  value={editDurationValue}
                                  onChange={(e) => setEditDurationValue(e.target.value)}
                                  className="w-12 ws-glass rounded px-1 py-0.5 text-[10px] outline-none border"
                                  style={{ color: 'var(--ws-text)' }}
                                  autoFocus
                                  min={10}
                                  max={480}
                                />
                                <span className="text-[9px]">mins</span>
                                <button onClick={() => handleSaveDuration(currentDayData.dayNumber, index)} className="text-emerald-400"><Check size={11} /></button>
                                <button onClick={() => { setEditingDurationIndex(null); }} className="text-rose-400"><X size={11} /></button>
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 cursor-pointer hover:text-[var(--ws-accent)] transition-colors print:cursor-default"
                                onClick={() => handleStartEditDuration(index, slot.duration)}
                              >
                                <Clock size={11} style={{ color: 'var(--ws-accent)' }} />
                                {slot.duration} mins
                                <Pencil size={8} className="opacity-0 group-hover:opacity-50 print:hidden" />
                              </span>
                            )}
                            {slot.place.entry_fee !== undefined && (
                              <span>
                                Fee: {slot.place.entry_fee === 0 ? 'Free' : `₹${slot.place.entry_fee}`}
                              </span>
                            )}
                          </div>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${slot.place.latitude},${slot.place.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1.5"
                            style={{ color: 'var(--ws-accent)' }}
                          >
                            Directions
                            <ArrowRight size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 h-[450px] lg:h-[580px] lg:sticky lg:top-28 print:hidden">
            <div className="h-full ws-glass-strong rounded-3xl overflow-hidden shadow-xl p-3 flex flex-col border">
              <div className="flex items-center gap-2 mb-3 px-2">
                <MapPin size={16} style={{ color: 'var(--ws-accent)' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-text)' }}>Day {activeDay} Route Visualization</span>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--ws-border)' }}>
                <LeafletMap
                  items={mapItems}
                  center={routePoints[0] || [20.5937, 78.9629]}
                  zoom={12}
                  routePoints={routePoints}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
