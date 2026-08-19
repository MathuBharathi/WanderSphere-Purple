import { supabase } from './supabase';
import type { City, Place, State, Profile, SavedItinerary, ItineraryConfig, GeneratedItinerary, PlaceFilters, WeatherData } from '../types';
import { states, cities, places } from '../data/travelData';

// ─── Distance Helpers ───────────────────────────────────────────────────────
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// ─── Enrichment Helpers ──────────────────────────────────────────────────────
function enrichState(s: State): State {
  const sCities = cities.filter(c => c.state_id === s.id);
  const cityIds = sCities.map(c => c.id);
  const sPlaces = places.filter(p => p.city_id && cityIds.includes(p.city_id));
  return {
    ...s,
    slug: s.slug || s.name.toLowerCase().replace(/[\s-]+/g, '-'),
    city_count: sCities.length,
    place_count: sPlaces.length,
    cover_image: s.cover_image || sCities.find(c => c.cover_image)?.cover_image || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
    description: s.description || `Explore the beautiful cities and tourist places in ${s.name}.`
  };
}

function enrichCity(c: City): City {
  const state = states.find(s => s.id === c.state_id);
  return {
    ...c,
    slug: c.slug || c.name.toLowerCase().replace(/[\s-]+/g, '-'),
    state_name: state?.name,
  };
}

function enrichPlace(p: Place): Place {
  const city = cities.find(c => c.id === p.city_id);
  const state = states.find(s => s.id === city?.state_id);
  return {
    ...p,
    slug: p.slug || p.name.toLowerCase().replace(/[\s-]+/g, '-'),
    city_name: city?.name,
    state_name: state?.name,
    entry_fee_currency: p.entry_fee_currency || 'INR',
    crowd_level: p.crowd_level || 'moderate',
    safety_rating: p.safety_rating || 4.5
  };
}

// ─── States ─────────────────────────────────────────────────────────────────
export async function getStates(): Promise<State[]> {
  return states.map(enrichState).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStateBySlug(slug: string): Promise<State | null> {
  const cleanSlug = slug.toLowerCase();
  let state = states.find(s => (s.slug && s.slug.toLowerCase() === cleanSlug) || s.code?.toLowerCase() === cleanSlug);
  if (!state) {
    const stateName = cleanSlug.replace(/-/g, ' ');
    state = states.find(s => s.name.toLowerCase() === stateName);
  }
  return state ? enrichState(state) : null;
}

export async function getStateById(id: string): Promise<State | null> {
  const state = states.find(s => s.id === id);
  return state ? enrichState(state) : null;
}

export async function getCitiesByState(stateId: string): Promise<City[]> {
  return cities
    .filter(c => c.state_id === stateId)
    .map(enrichCity)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Cities ─────────────────────────────────────────────────────────────────
export async function getFeaturedCities(): Promise<City[]> {
  return cities
    .filter(c => c.is_featured)
    .map(enrichCity)
    .slice(0, 12);
}

export async function getTrendingCities(): Promise<City[]> {
  return cities
    .filter(c => c.is_trending)
    .map(enrichCity)
    .slice(0, 8);
}

export async function getAllCities(): Promise<City[]> {
  return cities.map(enrichCity).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCityById(id: string): Promise<City | null> {
  const city = cities.find(c => c.id === id);
  return city ? enrichCity(city) : null;
}

export async function searchCities(query: string): Promise<City[]> {
  const q = query.toLowerCase();
  return cities
    .filter(c => c.name.toLowerCase().includes(q))
    .map(enrichCity)
    .slice(0, 10);
}

export async function getNearbyCities(lat: number, lng: number, radiusKm = 200): Promise<City[]> {
  return cities
    .map(enrichCity)
    .map(c => {
      if (c.latitude && c.longitude) {
        return { ...c, distance_km: getDistance(lat, lng, Number(c.latitude), Number(c.longitude)) };
      }
      return c;
    })
    .filter(c => c.distance_km !== undefined && c.distance_km <= radiusKm)
    .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
    .slice(0, 10);
}

// ─── Places ─────────────────────────────────────────────────────────────────
export async function getPlacesByCity(cityId: string, category?: string): Promise<Place[]> {
  let filtered = places.filter(p => p.city_id === cityId);
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  return filtered
    .map(enrichPlace)
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 50);
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const place = places.find(p => p.id === id);
  return place ? enrichPlace(place) : null;
}

export async function getPlaceImages(placeId: string) {
  const place = places.find(p => p.id === placeId);
  if (!place || !place.cover_image) return [];
  const imgs = place.images && place.images.length > 0 ? place.images : [place.cover_image];
  return imgs.map((url, idx) => ({
    id: `place-image-${placeId}-${idx}`,
    place_id: placeId,
    url: url,
    caption: place.name,
    width: 800,
    height: 600,
    is_cover: idx === 0
  }));
}

export async function getFeaturedPlaces(): Promise<Place[]> {
  return places
    .filter(p => p.is_featured)
    .map(enrichPlace)
    .slice(0, 20);
}

export async function getHiddenGems(cityId?: string): Promise<Place[]> {
  let filtered = places.filter(p => p.is_hidden_gem);
  if (cityId) {
    filtered = filtered.filter(p => p.city_id === cityId);
  }
  return filtered.map(enrichPlace).slice(0, 12);
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.toLowerCase();
  return places
    .filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
    .map(enrichPlace)
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 20);
}

export async function getTrendingPlaces(limit = 10): Promise<Place[]> {
  return places
    .map(enrichPlace)
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, limit);
}

export async function getPlacesWithFilters(filters: PlaceFilters): Promise<{ data: Place[]; count: number }> {
  let filtered = places.map(enrichPlace);

  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(p => p.category === filters.category);
  }
  if (filters.min_rating) {
    filtered = filtered.filter(p => (p.avg_rating || 0) >= filters.min_rating!);
  }
  if (filters.is_free) {
    filtered = filtered.filter(p => p.entry_fee === 0);
  } else if (filters.max_entry_fee) {
    filtered = filtered.filter(p => (p.entry_fee || 0) <= filters.max_entry_fee!);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }

  // Sorting
  switch (filters.sort_by) {
    case 'rating':
      filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      break;
    case 'popularity':
      filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      break;
    default:
      filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  }

  const count = filtered.length;
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const data = filtered.slice(from, from + limit);

  return { data, count };
}

export async function getPlacesByState(stateId: string, category?: string): Promise<Place[]> {
  const stateCities = cities.filter(c => c.state_id === stateId).map(c => c.id);
  if (stateCities.length === 0) return [];
  
  let filtered = places.filter(p => p.city_id && stateCities.includes(p.city_id));
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  return filtered
    .map(enrichPlace)
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 50);
}

export async function getNearbyPlaces(lat: number, lng: number, radiusKm = 50, category?: string): Promise<Place[]> {
  let filtered = places.map(enrichPlace);
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  return filtered
    .map(p => {
      if (p.latitude && p.longitude) {
        return { ...p, distance_km: getDistance(lat, lng, Number(p.latitude), Number(p.longitude)) };
      }
      return p;
    })
    .filter(p => p.distance_km !== undefined && p.distance_km <= radiusKm)
    .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
    .slice(0, 50);
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    console.warn('Supabase getProfile failed, checking local profiles:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localProfiles = JSON.parse(localStorage.getItem('local_profiles') || '{}');
        if (localProfiles[userId]) return localProfiles[userId];
        
        // Return default local profile if user is a local session user
        const localSessionUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
        if (localSessionUser && localSessionUser.id === userId) {
          const defaultProfile = {
            id: userId,
            full_name: localSessionUser.user_metadata?.full_name || 'Traveler',
            username: localSessionUser.email?.split('@')[0] || 'traveler',
            travel_style: 'explorer',
            created_at: new Date().toISOString()
          };
          localProfiles[userId] = defaultProfile;
          localStorage.setItem('local_profiles', JSON.stringify(localProfiles));
          return defaultProfile;
        }
      } catch (err) {
        console.error('Failed to parse local profiles', err);
      }
    }
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    console.warn('Supabase updateProfile failed, falling back to local profiles:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localProfiles = JSON.parse(localStorage.getItem('local_profiles') || '{}');
        const currentProfile = localProfiles[userId] || { id: userId };
        const updatedProfile = { ...currentProfile, ...updates, updated_at: new Date().toISOString() };
        localProfiles[userId] = updatedProfile;
        localStorage.setItem('local_profiles', JSON.stringify(localProfiles));
        
        const localSessionUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
        if (localSessionUser && localSessionUser.id === userId) {
          localStorage.setItem('local_session_profile', JSON.stringify(updatedProfile));
        }
        return updatedProfile;
      } catch (err) {
        console.error('Failed to update local profile', err);
      }
    }
    throw e;
  }
}

export async function getPublicProfile(username: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    console.warn('Supabase getPublicProfile failed, checking local profiles:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localProfiles = JSON.parse(localStorage.getItem('local_profiles') || '{}');
        const profilesList = Object.values(localProfiles) as Profile[];
        const found = profilesList.find(p => p.username?.toLowerCase() === username.toLowerCase());
        if (found) return found;
      } catch (err) {
        console.error('Failed to read local profiles', err);
      }
    }
    return null;
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('user-avatars').getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}

// ─── Itineraries (Supabase backend wrapper using serialized JSON in description) ─
export async function createItinerary(itinerary: Partial<SavedItinerary>): Promise<SavedItinerary> {
  const payload = {
    user_id: itinerary.user_id,
    title: itinerary.title,
    description: JSON.stringify({
      config: itinerary.config,
      itinerary_data: itinerary.itinerary_data
    }),
    cover_image: itinerary.itinerary_data?.config?.cityId 
      ? cities.find(c => c.id === itinerary.itinerary_data?.config?.cityId)?.cover_image 
      : undefined,
    is_public: itinerary.is_public || false
  };

  try {
    const { data, error } = await supabase.from('itineraries').insert(payload).select().single();
    if (error) throw error;

    const parsed = JSON.parse(data.description);
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      config: parsed.config,
      itinerary_data: parsed.itinerary_data,
      is_public: data.is_public,
      created_at: data.created_at
    };
  } catch (e: any) {
    console.warn('Supabase createItinerary failed, falling back to local itineraries:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localItins = JSON.parse(localStorage.getItem('local_itineraries') || '[]');
        const newItin: SavedItinerary = {
          id: `local-itin-${Date.now()}`,
          user_id: itinerary.user_id || 'local-user-id',
          title: itinerary.title || 'My Local Trip',
          config: itinerary.config!,
          itinerary_data: itinerary.itinerary_data!,
          is_public: itinerary.is_public || false,
          created_at: new Date().toISOString()
        };
        localItins.unshift(newItin);
        localStorage.setItem('local_itineraries', JSON.stringify(localItins));
        return newItin;
      } catch (err) {
        console.error('Failed to save itinerary locally', err);
      }
    }
    throw e;
  }
}

export async function updateItinerary(id: string, updates: Partial<SavedItinerary>): Promise<SavedItinerary> {
  const payload: any = {};
  if (updates.title) payload.title = updates.title;
  if (updates.is_public !== undefined) payload.is_public = updates.is_public;
  if (updates.itinerary_data) {
    payload.description = JSON.stringify({
      config: updates.config || updates.itinerary_data.config,
      itinerary_data: updates.itinerary_data
    });
  }

  try {
    const { data, error } = await supabase.from('itineraries').update(payload).eq('id', id).select().single();
    if (error) throw error;

    const parsed = JSON.parse(data.description);
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      config: parsed.config,
      itinerary_data: parsed.itinerary_data,
      is_public: data.is_public,
      created_at: data.created_at
    };
  } catch (e: any) {
    console.warn('Supabase updateItinerary failed, updating local itineraries:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localItins = JSON.parse(localStorage.getItem('local_itineraries') || '[]');
        const idx = localItins.findIndex((item: any) => item.id === id);
        if (idx !== -1) {
          const current = localItins[idx];
          const updated = {
            ...current,
            title: updates.title || current.title,
            is_public: updates.is_public !== undefined ? updates.is_public : current.is_public,
            config: updates.config || current.config,
            itinerary_data: updates.itinerary_data || current.itinerary_data
          };
          localItins[idx] = updated;
          localStorage.setItem('local_itineraries', JSON.stringify(localItins));
          return updated;
        }
      } catch (err) {
        console.error('Failed to update local itinerary', err);
      }
    }
    throw e;
  }
}

export async function deleteItinerary(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('itineraries').delete().eq('id', id);
    if (error) throw error;
  } catch (e: any) {
    console.warn('Supabase deleteItinerary failed, deleting local itineraries:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localItins = JSON.parse(localStorage.getItem('local_itineraries') || '[]');
        const filtered = localItins.filter((item: any) => item.id !== id);
        localStorage.setItem('local_itineraries', JSON.stringify(filtered));
        return;
      } catch (err) {
        console.error('Failed to delete local itinerary', err);
      }
    }
    throw e;
  }
}

export async function getItineraryById(id: string): Promise<SavedItinerary | null> {
  try {
    const { data, error } = await supabase.from('itineraries').select('*').eq('id', id).single();
    if (error) throw error;

    const parsed = JSON.parse(data.description);
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      config: parsed.config,
      itinerary_data: parsed.itinerary_data,
      is_public: data.is_public,
      created_at: data.created_at
    };
  } catch (e: any) {
    console.warn('Supabase getItineraryById failed, checking local itineraries:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localItins = JSON.parse(localStorage.getItem('local_itineraries') || '[]');
        const found = localItins.find((item: any) => item.id === id);
        if (found) return found;
      } catch (err) {
        console.error('Failed to read local itineraries', err);
      }
    }
    return null;
  }
}

export async function getUserItineraries(userId: string): Promise<SavedItinerary[]> {
  try {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const results: SavedItinerary[] = [];
    for (const item of data) {
      try {
        const parsed = JSON.parse(item.description);
        results.push({
          id: item.id,
          user_id: item.user_id,
          title: item.title,
          config: parsed.config,
          itinerary_data: parsed.itinerary_data,
          is_public: item.is_public,
          created_at: item.created_at
        });
      } catch {
        // Ignore corrupted rows
      }
    }
    return results;
  } catch (e: any) {
    console.warn('Supabase getUserItineraries failed, returning local itineraries:', e.message);
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('local_itineraries') || '[]');
      } catch (err) {
        console.error('Failed to read local itineraries list', err);
      }
    }
    return [];
  }
}

export async function getItineraryByShareCode(code: string): Promise<SavedItinerary | null> {
  try {
    const { data, error } = await supabase.from('itineraries').select('*').eq('share_token', code).single();
    if (error) throw error;

    const parsed = JSON.parse(data.description);
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      config: parsed.config,
      itinerary_data: parsed.itinerary_data,
      is_public: data.is_public,
      created_at: data.created_at
    };
  } catch (e: any) {
    console.warn('Supabase getItineraryByShareCode failed, checking local itineraries:', e.message);
    if (typeof window !== 'undefined') {
      try {
        const localItins = JSON.parse(localStorage.getItem('local_itineraries') || '[]');
        const found = localItins.find((item: any) => item.share_token === code || item.id === code);
        if (found) return found;
      } catch (err) {
        console.error('Failed to check local itinerary by share code', err);
      }
    }
    return null;
  }
}

// ─── Weather ─────────────────────────────────────────────────────────────────
export async function getWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );
    if (!res.ok) return null;
    const d = await res.json();
    return {
      temp: Math.round(d.main.temp),
      feels_like: Math.round(d.main.feels_like),
      description: d.weather[0].description,
      icon: d.weather[0].icon,
      humidity: d.main.humidity,
      wind_speed: Math.round(d.wind.speed),
      city_name: d.name,
    };
  } catch { return null; }
}

// ─── Reviews (Local storage & Mock fallback) ─────────────────────────────────
export interface Review {
  id: string;
  place_id: string;
  user_id?: string;
  rating: number;
  title?: string;
  content?: string;
  visit_date: string;
  created_at?: string;
  profiles?: {
    full_name?: string;
  };
}

export async function getReviewsByPlace(placeId: string): Promise<Review[]> {
  const mockReviews: Review[] = [
    {
      id: `mock-rev-1-${placeId}`,
      place_id: placeId,
      rating: 5,
      title: 'Amazing experience!',
      content: 'A must-visit spot. The atmosphere is wonderful and there is so much history and beauty here. Highly recommended!',
      visit_date: '2026-05-10',
      created_at: '2026-05-10T12:00:00.000Z',
      profiles: {
        full_name: 'Aarav Sharma'
      }
    },
    {
      id: `mock-rev-2-${placeId}`,
      place_id: placeId,
      rating: 4,
      title: 'Beautiful and serene',
      content: 'Very peaceful place. Great for family visits. Try to visit early in the morning to avoid the crowd.',
      visit_date: '2026-04-22',
      created_at: '2026-04-22T09:30:00.000Z',
      profiles: {
        full_name: 'Ananya Iyer'
      }
    }
  ];

  if (typeof window !== 'undefined') {
    try {
      const localRevs = JSON.parse(localStorage.getItem(`reviews_${placeId}`) || '[]');
      return [...localRevs, ...mockReviews];
    } catch (e) {
      return mockReviews;
    }
  }
  return mockReviews;
}

export async function createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
  const newReview: Review = {
    ...review,
    id: `user-rev-${Date.now()}`,
    created_at: new Date().toISOString(),
    profiles: {
      full_name: 'You (Traveler)'
    }
  };

  if (typeof window !== 'undefined') {
    try {
      const localRevs = JSON.parse(localStorage.getItem(`reviews_${review.place_id}`) || '[]');
      localRevs.unshift(newReview);
      localStorage.setItem(`reviews_${review.place_id}`, JSON.stringify(localRevs));
    } catch (e) {
      console.error('Failed to save review to localStorage', e);
    }
  }
  return newReview;
}

// ─── Auth Management ─────────────────────────────────────────────────────────
export async function changePassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  } catch (e: any) {
    // Offline fallback: update local user password
    if (e.message?.includes('fetch') || e.message?.includes('Failed to fetch')) {
      if (typeof window !== 'undefined') {
        try {
          const localUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
          if (localUser) {
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
            const idx = localUsers.findIndex((u: any) => u.id === localUser.id);
            if (idx !== -1) {
              localUsers[idx].password = newPassword;
              localStorage.setItem('local_users', JSON.stringify(localUsers));
              return;
            }
          }
        } catch (err) {
          console.error('Failed to update local password', err);
        }
      }
    }
    throw e;
  }
}

export async function changeEmail(newEmail: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  } catch (e: any) {
    // Offline fallback: update local user email
    if (e.message?.includes('fetch') || e.message?.includes('Failed to fetch')) {
      if (typeof window !== 'undefined') {
        try {
          const localUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
          if (localUser) {
            localUser.email = newEmail;
            localStorage.setItem('local_session_user', JSON.stringify(localUser));
            
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
            const idx = localUsers.findIndex((u: any) => u.id === localUser.id);
            if (idx !== -1) {
              localUsers[idx].email = newEmail;
              localStorage.setItem('local_users', JSON.stringify(localUsers));
            }
            return;
          }
        } catch (err) {
          console.error('Failed to update local email', err);
        }
      }
    }
    throw e;
  }
}
