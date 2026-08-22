import { supabase } from './supabase';
import type { City, Place, State, Profile, SavedItinerary, ItineraryConfig, GeneratedItinerary, PlaceFilters, WeatherData } from '../types';
import { states, cities, places } from '../data/travelData';
import { getCityImageUrl } from './placeImages';

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

// ─── Helper: Check if user is a Supabase-authenticated user ──────────────────
function isSupabaseUser(user: any): boolean {
  if (!user) return false;
  // Local sandbox users have IDs starting with 'local-'
  if (typeof user.id === 'string' && user.id.startsWith('local-')) return false;
  // Valid UUID pattern check
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
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
export async function getProfile(userId?: string): Promise<Profile | null> {
  let targetId = userId;
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    targetId = user.id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (error) {
    console.error('[getProfile] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }
  return data;
}

export async function updateProfile(updates: Partial<Profile>, profileId?: string): Promise<Profile> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User is not authenticated');
  }

  const authUserId = user.id;

  if (process.env.NODE_ENV === 'development') {
    console.log('[DIAGNOSTICS] Before Profile UPDATE:', {
      authUserId,
      profileId: profileId || 'N/A',
      isMatch: profileId ? authUserId === profileId : true,
      targetRowId: authUserId,
      payload: updates
    });
  }

  const payload: Partial<Profile> = {
    updated_at: new Date().toISOString()
  };
  if (updates.full_name !== undefined) payload.full_name = updates.full_name;
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.travel_style !== undefined) payload.travel_style = updates.travel_style;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.website !== undefined) payload.website = updates.website;
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', authUserId)
    .select()
    .single();

  if (error) {
    console.error('[updateProfile] Supabase update error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Unable to update your profile: ${error.message}`);
  }

  return data;
}

export async function getPublicProfile(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.warn('[getPublicProfile] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }
  return data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User is not authenticated');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5MB.');
  }

  const userId = user.id;

  try {
    const { data: existingFiles } = await supabase.storage.from('user-avatars').list(userId);
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('user-avatars').remove(filesToDelete);
    }
  } catch (e) {
    console.warn('[uploadAvatar] Cleanup warning:', e);
  }

  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('user-avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error('[uploadAvatar] Storage upload error:', {
      message: uploadError.message,
      code: (uploadError as any).code,
      details: (uploadError as any).details,
      hint: (uploadError as any).hint
    });
    throw new Error(`Unable to upload your profile photo: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('user-avatars').getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  await updateProfile({ avatar_url: publicUrl }, userId);
  return publicUrl;
}

export async function removeAvatar(): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User is not authenticated');
  }

  const userId = user.id;

  try {
    const { data: existingFiles } = await supabase.storage.from('user-avatars').list(userId);
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      const { error: deleteError } = await supabase.storage.from('user-avatars').remove(filesToDelete);
      if (deleteError) {
        console.error('[removeAvatar] Storage delete error:', {
          message: deleteError.message,
          code: (deleteError as any).code,
          details: (deleteError as any).details,
          hint: (deleteError as any).hint
        });
        throw new Error(`Unable to delete your profile photo from storage: ${deleteError.message}`);
      }
    }
  } catch (e: any) {
    if (e.message?.includes('Unable to delete')) throw e;
    console.warn('[removeAvatar] Non-critical warning:', e);
  }

  await updateProfile({ avatar_url: '' }, userId);
}

// ─── Itineraries ─────────────────────────────────────────────────────────────
function parseItineraryRow(row: any): SavedItinerary {
  let config = row.config;
  let itinerary_data = row.itinerary_data;

  if ((!config || !itinerary_data) && row.description) {
    try {
      const parsed = JSON.parse(row.description);
      config = config || parsed.config;
      itinerary_data = itinerary_data || parsed.itinerary_data;
    } catch {
      // ignore
    }
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    config: config || {},
    itinerary_data: itinerary_data || {},
    cover_image: row.cover_image,
    is_public: row.is_public,
    share_token: row.share_token,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function createItinerary(itinerary: Partial<SavedItinerary>): Promise<SavedItinerary> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Please sign in to save your itinerary.');
  }

  const authUserId = user.id;

  if (process.env.NODE_ENV === 'development') {
    console.log('[DIAGNOSTICS] Before Itinerary INSERT:', {
      authUserId,
      itinerary_user_id: itinerary.user_id || 'N/A',
      isMatch: authUserId === itinerary.user_id,
      title: itinerary.title || 'My Travel Plan'
    });
  }

  const coverImage = itinerary.cover_image || (
    itinerary.itinerary_data?.config?.cityName
      ? getCityImageUrl(itinerary.itinerary_data.config.cityName)
      : undefined
  );

  const descriptionText = (itinerary.config as any)?.cityName
    ? `${(itinerary.config as any).days || 3}-Day Trip to ${(itinerary.config as any).cityName}`
    : itinerary.title || 'Travel Plan';

  const payload = {
    user_id: authUserId,
    title: itinerary.title || 'My Travel Plan',
    description: descriptionText,
    config: itinerary.config || {},
    itinerary_data: itinerary.itinerary_data || {},
    cover_image: coverImage,
    is_public: itinerary.is_public ?? false,
    share_token: itinerary.share_token
  };

  const { data, error } = await supabase
    .from('itineraries')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[createItinerary] Supabase insert error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to save itinerary to your account: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to save itinerary: no data returned from database.');
  }

  return parseItineraryRow(data);
}

export async function updateItinerary(id: string, updates: Partial<SavedItinerary>): Promise<SavedItinerary> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User is not authenticated');
  }

  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.is_public !== undefined) payload.is_public = updates.is_public;
  if (updates.config !== undefined) payload.config = updates.config;
  if (updates.itinerary_data !== undefined) payload.itinerary_data = updates.itinerary_data;
  if (updates.cover_image !== undefined) payload.cover_image = updates.cover_image;

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('itineraries')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[updateItinerary] Supabase update error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Unable to save your itinerary changes: ${error.message}`);
  }

  return parseItineraryRow(data);
}

export async function deleteItinerary(id: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User is not authenticated');
  }

  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[deleteItinerary] Supabase delete error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to delete itinerary: ${error.message}`);
  }
}

export async function getItineraryById(id: string): Promise<SavedItinerary | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getItineraryById] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }
  return parseItineraryRow(data);
}

export async function getUserItineraries(userId?: string): Promise<SavedItinerary[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const targetId = user.id;

  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getUserItineraries] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to load your itineraries: ${error.message}`);
  }

  if (!data) return [];

  return data.map(parseItineraryRow);
}

export async function getItineraryByShareCode(code: string): Promise<SavedItinerary | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('share_token', code)
    .maybeSingle();

  if (error) {
    console.warn('[getItineraryByShareCode] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }
  return parseItineraryRow(data);
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

// ─── Reviews ─────────────────────────────────────────────────────────────────
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
  return mockReviews;
}

export async function createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
  return {
    ...review,
    id: `user-rev-${Date.now()}`,
    created_at: new Date().toISOString(),
    profiles: {
      full_name: 'You (Traveler)'
    }
  };
}

// ─── Auth Management ─────────────────────────────────────────────────────────
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error('[changePassword] Supabase error:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    throw error;
  }
}

export async function changeEmail(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) {
    console.error('[changeEmail] Supabase error:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    throw error;
  }
}

