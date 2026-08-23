'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { updateProfile, getUserItineraries, uploadAvatar, removeAvatar, deleteItinerary, changePassword, changeEmail, getProfile } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Heart, Map, Settings, LogOut, Globe, Loader2,
  Camera, MapPin, Calendar, Trash2, ChevronRight, ArrowLeft,
  Phone, Lock, Mail, Pencil, Eye, EyeOff, Check, X, Upload
} from 'lucide-react';
import { NavDock } from '@/components/dock/NavDock';
import { Footer } from '@/components/ui/Footer';
import { ItineraryCard } from '@/components/ui/ItineraryCard';
import { ProfileAvatarModal } from '@/components/ui/ProfileAvatarModal';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Place, SavedItinerary } from '@/types';
import { places as staticPlaces } from '@/data/travelData';
import { useAppStore } from '@/store';

const TABS = [
  { key: 'saved', label: 'Saved Places', icon: Heart },
  { key: 'trips', label: 'My Trips', icon: Map },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user, setUser, profile, setProfile, authReady,
    savedPlaces, setGeneratedItinerary, setItineraryConfig,
    setCurrentItineraryId
  } = useAppStore();

  const [wishlistPlaces, setWishlistPlaces] = useState<Place[]>([]);
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'saved');

  // Settings form
  const [settingsName, setSettingsName] = useState('');
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsTravelStyle, setSettingsTravelStyle] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wait for authReady, then load data
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const loadProfileData = async () => {
      setLoading(true);

      try {
        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authUser) {
          router.push('/auth');
          return;
        }

        const [freshProfile, trips] = await Promise.all([
          getProfile(authUser.id),
          getUserItineraries(authUser.id),
        ]);

        if (cancelled) return;

        if (process.env.NODE_ENV === 'development') {
          console.log('[DIAGNOSTICS] Profile Page Load:', {
            'AUTH USER ID': authUser.id,
            'PROFILE ID': freshProfile?.id || 'NO PROFILE ROW',
            'PROFILE USERNAME': freshProfile?.username || 'N/A',
            'AUTH EMAIL': authUser.email || 'N/A',
            'authUserId === profileId': freshProfile ? authUser.id === freshProfile.id : 'N/A'
          });
        }

        if (freshProfile) {
          setProfile(freshProfile);
          setSettingsName(freshProfile.full_name || '');
          setSettingsUsername(freshProfile.username || '');
          setSettingsBio(freshProfile.bio || '');
          setSettingsTravelStyle(freshProfile.travel_style || 'explorer');
          setSettingsPhone(freshProfile.phone || '');
        }

        setItineraries(trips);
      } catch (err) {
        console.error('Failed to load profile data:', err);
        toast.error('Failed to load profile data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfileData();
    return () => { cancelled = true; };
  }, [authReady, router, setProfile]);

  // Sync wishlist from local storage saved place IDs
  useEffect(() => {
    if (savedPlaces.length > 0) {
      const items = staticPlaces.filter((p) => savedPlaces.includes(p.id));
      setWishlistPlaces(items);
    } else {
      setWishlistPlaces([]);
    }
  }, [savedPlaces]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success('Signed out successfully');
    router.push('/');
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser) {
        toast.error('Please sign in');
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[DIAGNOSTICS] Before Profile UPDATE:', {
          authUserId: authUser.id,
          profileId: profile?.id || 'N/A',
          isMatch: authUser.id === profile?.id,
          targetRowId: authUser.id,
          payload: {
            full_name: settingsName,
            username: settingsUsername,
            bio: settingsBio,
            travel_style: settingsTravelStyle,
            phone: settingsPhone,
          }
        });
      }

      const updated = await updateProfile({
        full_name: settingsName,
        username: settingsUsername,
        bio: settingsBio,
        travel_style: settingsTravelStyle,
        phone: settingsPhone,
      }, profile?.id);

      setProfile(updated);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('[handleSaveSettings] Error:', err);
      if (err?.message?.includes('unique') || err?.message?.includes('duplicate')) {
        toast.error('Username is already taken');
      } else {
        toast.error(err?.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // Avatar handlers
  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setProfile({ ...(profile || { id: authUser?.id || '' }), avatar_url: url });
      setShowAvatarModal(false);
      toast.success('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error(err?.message || 'Unable to upload your profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const previousAvatarUrl = profile?.avatar_url;
    setAvatarDeleting(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    setProfile({ ...(profile || { id: authUser?.id || '' }), avatar_url: '' });

    try {
      await removeAvatar();
      setShowAvatarModal(false);
      toast.success('Profile picture removed successfully.');
    } catch (err: any) {
      if (previousAvatarUrl) {
        setProfile({ ...(profile || { id: authUser?.id || '' }), avatar_url: previousAvatarUrl });
      }
      console.error('Remove avatar error:', err);
      toast.error(err?.message || 'Failed to remove photo.');
    } finally {
      setAvatarDeleting(false);
    }
  };

  const handleAvatarClick = () => {
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    if (avatarUrl) {
      setShowAvatarModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleAvatarUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this trip itinerary?')) return;

    try {
      await deleteItinerary(id);
      setItineraries(prev => prev.filter((i) => i.id !== id));
      toast.success('Itinerary deleted.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete itinerary.');
    }
  };

  const handleOpenItinerary = (itinerary: SavedItinerary) => {
    setItineraryConfig(itinerary.config);
    setGeneratedItinerary(itinerary.itinerary_data);
    setCurrentItineraryId(itinerary.id);
    router.push('/itinerary');
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    setSavingEmail(true);
    try {
      await changeEmail(newEmail);
      toast.success('Email updated! Check your new email for confirmation.');
      setShowEmailChange(false);
      setNewEmail('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(newPassword);
      toast.success('Password changed successfully!');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || '';

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--ws-text)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ws-primary)' }} />
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-text-muted)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-32 transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>

      {/* Header Banner — Redesigned with centered avatar */}
      <div 
        style={{
          backgroundColor: 'var(--ws-surface-translucent)',
          borderColor: 'var(--ws-border)',
        }}
        className="relative overflow-hidden border-b backdrop-blur-xl"
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1B432C]/40 via-transparent to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto w-full px-6 pt-6 pb-10">
          {/* Top row: back + sign out */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-[#C69234] hover:underline transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft size={14} />
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-[#A3C2B2] hover:text-rose-400 transition-colors text-xs font-bold uppercase tracking-widest"
              aria-label="Sign out"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {/* Centered avatar + info */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative group block rounded-full focus:outline-none focus:ring-2 focus:ring-[#C69234] mb-4"
              aria-label="View or change profile picture"
            >
              <div className="w-28 h-28 rounded-full bg-[#1B432C] border-2 border-[#2C5E3B] flex items-center justify-center overflow-hidden shadow-lg group-hover:border-[#C69234] transition-all">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-[#C69234]" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#C69234] rounded-full border-2 border-[#0B1914] flex items-center justify-center shadow-md">
                <Camera size={13} className="text-[#0B1914]" />
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDirectUpload}
              aria-label="Upload profile photo"
            />

            <h1 className="font-extrabold text-3xl text-white uppercase tracking-tight">
              {profile?.full_name || user?.email?.split('@')[0] || 'Explorer'}
            </h1>
            <p className="text-[#A3C2B2] text-xs mt-1.5 flex items-center gap-2">
              <Globe size={11} className="text-[#C69234]" />
              {user?.email}
            </p>
            <span className="inline-block bg-[#1B432C] border border-[#2C5E3B] text-[#C69234] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-md mt-3">
              Style: {profile?.travel_style || 'Explorer'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile stats */}
      <div className="max-w-5xl mx-auto px-6 -mt-5 mb-8 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Wishlist Sights', value: wishlistPlaces.length },
            { label: 'My Saved Trips', value: itineraries.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#143028] border border-[#2C5E3B] rounded-2xl p-4 text-center shadow-md text-white">
              <p className="font-extrabold text-3xl text-[#C69234]">{value}</p>
              <p className="text-[#A3C2B2] text-[10px] font-bold uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeTab === key
                  ? 'bg-[#C69234] text-[#0B1914] font-black shadow-md'
                  : 'bg-[#143028] border border-[#2C5E3B]/60 text-[#A3C2B2] hover:text-white hover:border-[#C69234]'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="mt-6">
          {/* Wishlist Sights */}
          {activeTab === 'saved' && (
            <div>
              {wishlistPlaces.length === 0 ? (
                <div className="text-center py-20 bg-[#143028]/60 border border-[#2C5E3B] rounded-3xl p-8">
                  <Heart size={36} className="text-[#A65D29]/40 mx-auto mb-3" />
                  <p className="text-white font-bold text-sm">No saved places yet</p>
                  <p className="text-[#A3C2B2] text-xs mt-1 mb-5">Click the heart icon on any destination sight to save it.</p>
                  <Link href="/" className="inline-flex px-5 py-2.5 bg-[#C69234] text-[#0B1914] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#b07f2a]">Start Exploring</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {wishlistPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="bg-[#143028] border border-[#2C5E3B] rounded-3xl overflow-hidden hover:border-[#C69234] transition-all cursor-pointer shadow-sm"
                      onClick={() => place.city_id && router.push(`/city/${place.city_id}?place=${place.id}`)}
                    >
                      <div
                        className="h-44 bg-cover bg-center"
                        style={{ backgroundImage: `url(${place.cover_image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400'})` }}
                      />
                      <div className="p-5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#A65D29]">{place.category}</span>
                        <h3 className="text-white font-extrabold text-base mt-1 line-clamp-1">{place.name}</h3>
                        <p className="text-[#A3C2B2] text-xs mt-1.5 flex items-center gap-1">
                          <MapPin size={11} className="text-[#C69234]" /> {place.city_name}, {place.state_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trips Itineraries — Using shared ItineraryCard */}
          {activeTab === 'trips' && (
            <div>
              {itineraries.length === 0 ? (
                <div className="text-center py-20 bg-[#143028]/60 border border-[#2C5E3B] rounded-3xl p-8">
                  <Map size={36} className="text-[#A3C2B2]/40 mx-auto mb-3" />
                  <p className="text-white font-bold text-sm">No itineraries saved yet</p>
                  <p className="text-[#A3C2B2] text-xs mt-1 mb-5">Create custom trip itineraries from search to display them here.</p>
                  <Link href="/" className="inline-flex px-5 py-2.5 bg-[#C69234] text-[#0B1914] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#b07f2a]">Create a Plan</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {itineraries.map((trip) => (
                    <ItineraryCard
                      key={trip.id}
                      itinerary={trip}
                      onOpen={handleOpenItinerary}
                      onDelete={handleDeleteTrip}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Settings — Redesigned with wider responsive layout */}
          {activeTab === 'settings' && (
            <div className="max-w-5xl space-y-6">
              {/* Profile Info Card — Two-column field grid */}
              <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 md:p-8 shadow-md backdrop-blur-md text-white">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#C69234] mb-6 flex items-center gap-2"><User size={14} /> Profile Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mb-2 block">Full Name</label>
                    <input
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 px-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mb-2 block">Username</label>
                    <input
                      value={settingsUsername}
                      onChange={(e) => setSettingsUsername(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 px-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mb-2 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                      <input
                        value={settingsPhone}
                        onChange={(e) => setSettingsPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        type="tel"
                        className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mb-2 block">Travel Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['explorer', 'luxury', 'budget', 'adventure'].map((style) => (
                        <button
                          key={style}
                          onClick={() => setSettingsTravelStyle(style)}
                          className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                            settingsTravelStyle === style
                              ? 'bg-[#C69234] text-[#0B1914] font-black shadow-sm'
                              : 'bg-[#0B1914] border border-[#2C5E3B] text-[#A3C2B2] hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mb-2 block">Bio</label>
                    <textarea
                      value={settingsBio}
                      onChange={(e) => setSettingsBio(e.target.value)}
                      placeholder="Tell your travel story..."
                      rows={3}
                      className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 px-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors resize-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full mt-6 py-3.5 rounded-xl bg-[#C69234] hover:bg-[#b07f2a] text-[#0B1914] font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>

              {/* Email and Password — Side by side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Change Card */}
                <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-md backdrop-blur-md text-white">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#C69234] mb-4 flex items-center gap-2"><Mail size={14} /> Email Address</h3>
                  <p className="text-sm text-[#A3C2B2] mb-3">
                    Current: <span className="font-semibold text-white">{user?.email}</span>
                  </p>
                  {showEmailChange ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                        <input
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="New email address"
                          type="email"
                          className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleChangeEmail}
                          disabled={savingEmail}
                          className="flex-1 py-2.5 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#b07f2a]"
                        >
                          {savingEmail ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Update Email
                        </button>
                        <button
                          onClick={() => { setShowEmailChange(false); setNewEmail(''); }}
                          className="px-4 py-2.5 rounded-xl bg-[#1B432C] border border-[#2C5E3B] text-xs font-bold uppercase tracking-wider text-[#A3C2B2] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowEmailChange(true)}
                      className="text-xs font-bold uppercase tracking-wider text-[#C69234] hover:underline transition-colors"
                    >
                      Change Email →
                    </button>
                  )}
                </div>

                {/* Password Change Card */}
                <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-md backdrop-blur-md text-white">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#C69234] mb-4 flex items-center gap-2"><Lock size={14} /> Password</h3>
                  {showPasswordChange ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                        <input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 8 chars)"
                          type={showNewPass ? 'text' : 'password'}
                          className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 pl-11 pr-12 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3C2B2] hover:text-white"
                          aria-label={showNewPass ? 'Hide password' : 'Show password'}
                        >
                          {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                        <input
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          type={showNewPass ? 'text' : 'password'}
                          className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
                        />
                      </div>
                      {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                        <p className="text-rose-400 text-xs">Passwords do not match</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleChangePassword}
                          disabled={savingPassword || newPassword !== confirmNewPassword || newPassword.length < 8}
                          className="flex-1 py-2.5 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#b07f2a]"
                        >
                          {savingPassword ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Change Password
                        </button>
                        <button
                          onClick={() => { setShowPasswordChange(false); setNewPassword(''); setConfirmNewPassword(''); }}
                          className="px-4 py-2.5 rounded-xl bg-[#1B432C] border border-[#2C5E3B] text-xs font-bold uppercase tracking-wider text-[#A3C2B2] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="text-xs font-bold uppercase tracking-wider text-[#C69234] hover:underline transition-colors"
                    >
                      Change Password →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-20">
        <Footer />
      </div>
      <NavDock />

      {/* Avatar Preview Modal */}
      <ProfileAvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        avatarUrl={avatarUrl}
        onUpload={handleAvatarUpload}
        onDelete={handleRemoveAvatar}
        uploading={avatarUploading}
        deleting={avatarDeleting}
      />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B1914] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#C69234] animate-spin" />
          <p className="text-[#A3C2B2] text-xs uppercase tracking-widest font-semibold">Loading Profile...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
