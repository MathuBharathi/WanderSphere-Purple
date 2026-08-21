'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { updateProfile, getUserItineraries, uploadAvatar, removeAvatar, deleteItinerary, changePassword, changeEmail } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Heart, Map, Settings, LogOut, Globe, Loader2,
  Camera, MapPin, Calendar, Trash2, ChevronRight, ArrowLeft,
  Phone, Lock, Mail, Pencil, Eye, EyeOff, Check, X, Upload
} from 'lucide-react';
import { NavDock } from '@/components/dock/NavDock';
import { Footer } from '@/components/ui/Footer';
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
    user, setUser, profile, setProfile, 
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

  useEffect(() => {
    const initProfile = async () => {
      let currentUser = user;
      let currentProfile = profile;

      // 1. Try Zustand store first (populated by AuthProvider)
      if (!currentUser) {
        // 2. Try Supabase session
        try {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            currentUser = data.user;
            setUser(currentUser);
          }
        } catch (e) {
          console.warn('Supabase getUser failed:', e);
        }
      }

      // 3. Try local session fallback
      if (!currentUser && typeof window !== 'undefined') {
        try {
          const localUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
          if (localUser) {
            currentUser = localUser;
            setUser(localUser);
          }
        } catch (e) {
          console.warn('Local session check failed:', e);
        }
      }

      // No user at all — redirect
      if (!currentUser) {
        router.push('/auth');
        return;
      }

      // Fetch profile if not already loaded
      if (!currentProfile) {
        try {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
          if (prof) {
            currentProfile = prof;
            setProfile(prof);
          }
        } catch (e) {
          // Try local profile
          if (typeof window !== 'undefined') {
            try {
              const localProfile = JSON.parse(localStorage.getItem('local_session_profile') || 'null');
              if (localProfile) {
                currentProfile = localProfile;
                setProfile(localProfile);
              }
            } catch (_) {}
          }
        }
      }

      // Set form defaults
      if (currentProfile) {
        setSettingsName(currentProfile.full_name || '');
        setSettingsUsername(currentProfile.username || '');
        setSettingsBio(currentProfile.bio || '');
        setSettingsTravelStyle(currentProfile.travel_style || 'explorer');
        setSettingsPhone(currentProfile.phone || '');
      }

      // Load itineraries
      try {
        const trips = await getUserItineraries(currentUser.id);
        setItineraries(trips);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, {
        full_name: settingsName,
        username: settingsUsername,
        bio: settingsBio,
        travel_style: settingsTravelStyle,
        phone: settingsPhone,
      });
      setProfile(updated);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      if (err?.message?.includes('unique') || err?.message?.includes('duplicate')) {
        toast.error('Username is already taken');
      } else {
        toast.error(err?.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // Avatar menu dropdown state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadAvatar(user.id, file);
      if (profile) {
        setProfile({ ...profile, avatar_url: url });
      } else {
        setProfile({ id: user.id, avatar_url: url });
      }
      toast.success('Avatar updated successfully!');
    } catch (err: any) {
      toast.error('Failed to upload avatar');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      await removeAvatar(user.id);
      if (profile) {
        setProfile({ ...profile, avatar_url: '' });
      }
      setShowAvatarMenu(false);
      toast.success('Profile picture removed!');
    } catch (err: any) {
      toast.error('Failed to remove photo');
    }
  };

  const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this trip itinerary?')) return;

    try {
      await deleteItinerary(id);
      setItineraries(itineraries.filter((i) => i.id !== id));
      toast.success('Itinerary deleted.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete itinerary.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1914] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#C69234] animate-spin" />
          <p className="text-[#A3C2B2] text-xs uppercase tracking-widest font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1914] pb-32 text-[#F0F7F4] transition-colors duration-300">
      
      {/* Header Banner */}
      <div className="relative h-72 overflow-hidden bg-[#143028]/60 border-b border-[#2C5E3B]/60 backdrop-blur-xl">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1B432C]/40 via-transparent to-transparent" />

        <div className="relative z-10 flex items-end h-full px-6 pb-8 max-w-5xl mx-auto w-full">
          {/* Back button */}
          <Link href="/dashboard" className="absolute top-6 left-6 flex items-center gap-2 text-[#C69234] hover:underline transition-colors text-xs font-bold uppercase tracking-widest">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          
          <button 
            onClick={handleSignOut} 
            className="absolute top-6 right-6 flex items-center gap-2 text-[#A3C2B2] hover:text-rose-400 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <div className="flex items-center gap-6">
            {/* Avatar upload dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="relative group block rounded-full focus:outline-none focus:ring-2 focus:ring-[#C69234]"
                title="Click to change profile picture"
              >
                <div className="w-24 h-24 rounded-full bg-[#1B432C] border-2 border-[#2C5E3B] flex items-center justify-center overflow-hidden shadow-md group-hover:border-[#C69234] transition-all">
                  {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile?.avatar_url || user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-[#C69234]" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#C69234] rounded-full border-2 border-[#0B1914] flex items-center justify-center shadow-md">
                  <Camera size={12} className="text-[#0B1914]" />
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleAvatarUpload(e);
                  setShowAvatarMenu(false);
                }}
              />

              <AnimatePresence>
                {showAvatarMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-3 w-52 bg-[#143028] border border-[#2C5E3B] rounded-2xl p-1.5 shadow-2xl z-50 backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-[#1B432C] hover:text-[#C69234] transition-all text-left"
                    >
                      <Upload size={14} className="text-[#C69234]" />
                      <span>Upload New Picture</span>
                    </button>

                    {(profile?.avatar_url || user?.user_metadata?.avatar_url) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all text-left border-t border-[#2C5E3B]/40 mt-1 pt-2"
                      >
                        <Trash2 size={14} className="text-rose-400" />
                        <span>Remove Picture</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h1 className="font-extrabold text-3xl text-white uppercase tracking-tight">
                {profile?.full_name || user?.email?.split('@')[0] || 'Explorer'}
              </h1>
              <p className="text-[#A3C2B2] text-xs mt-1 flex items-center gap-2">
                <Globe size={11} className="text-[#C69234]" />
                {user?.email}
              </p>
              <span className="inline-block bg-[#1B432C] border border-[#2C5E3B] text-[#C69234] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mt-2">
                Style: {profile?.travel_style || 'Explorer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile stats */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 mb-8 relative z-10">
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

          {/* Trips Itineraries */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {itineraries.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => handleOpenItinerary(trip)}
                      className="bg-[#143028] border border-[#2C5E3B] rounded-3xl overflow-hidden hover:border-[#C69234] transition-all cursor-pointer p-6 shadow-sm flex flex-col justify-between h-48 group"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#C69234]">
                              {trip.config?.stateName || 'India'}
                            </span>
                            <h3 className="text-white font-extrabold text-lg mt-1 group-hover:text-[#C69234] transition-colors">
                              Trip to {trip.config?.cityName || trip.title}
                            </h3>
                          </div>
                          <ChevronRight size={18} className="text-[#A3C2B2] group-hover:translate-x-1 transition-transform" />
                        </div>
                        {trip.description && (
                          <p className="text-[#A3C2B2] text-xs line-clamp-2 mb-3">{trip.description}</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-[#2C5E3B]/60 pt-3.5 mt-auto">
                        <div className="flex gap-4 text-[10px] text-[#A3C2B2] font-semibold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {trip.config?.days || 3} Days
                          </span>
                          <span>{trip.itinerary_data?.totalPlaces || 0} places</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenItinerary(trip); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#1B432C] border border-[#2C5E3B] rounded-lg text-[10px] font-bold uppercase tracking-wider text-[#C69234] hover:bg-[#2C5E3B]/50 transition-all"
                          >
                            <Pencil size={10} />
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteTrip(trip.id, e)}
                            className="p-1.5 text-[#A3C2B2] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-lg space-y-6">
              {/* Profile Info Card */}
              <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-md backdrop-blur-md text-white">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#C69234] mb-5 flex items-center gap-2"><User size={14} /> Profile Information</h3>
                <div className="space-y-4">
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
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mb-2 block">Bio</label>
                    <textarea
                      value={settingsBio}
                      onChange={(e) => setSettingsBio(e.target.value)}
                      placeholder="Tell your travel story..."
                      rows={3}
                      className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 px-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors resize-none"
                    />
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
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-[#C69234] hover:bg-[#b07f2a] text-[#0B1914] font-black uppercase tracking-widest text-xs transition-colors mt-2 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>

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
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-20">
        <Footer />
      </div>
      <NavDock />
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
