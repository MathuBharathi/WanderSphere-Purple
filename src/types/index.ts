// ─── Core Travel Data Types ─────────────────────────────────────────────────

export interface State {
  id: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  cover_image?: string;
  city_count?: number;
  place_count?: number;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
  slug?: string;
  description?: string;
  cover_image?: string;
  latitude: number;
  longitude: number;
  best_season?: string;
  avg_temp_celsius?: number;
  is_featured?: boolean;
  is_trending?: boolean;
  tags?: string[];
  state_name?: string;
  distance_km?: number;
  visit_count?: number;
}

export type PlaceCategory =
  | 'historical'
  | 'nature'
  | 'adventure'
  | 'spiritual'
  | 'food'
  | 'beach'
  | 'wildlife'
  | 'cultural'
  | 'photography'
  | 'shopping'
  | 'nightlife'
  | 'architecture'
  | 'museum'
  | 'park'
  | 'lake'
  | 'waterfall'
  | 'hill_station'
  | 'market';

export interface Place {
  id: string;
  city_id: string;
  name: string;
  slug?: string;
  description: string;
  category: PlaceCategory | string;
  sub_category?: string;
  cover_image: string;
  images?: string[];
  latitude: number;
  longitude: number;
  address?: string;
  opening_hours?: Record<string, string>;
  opening_time?: string;
  closing_time?: string;
  entry_fee?: number;
  entry_fee_currency?: string;
  avg_visit_duration?: number; // in minutes
  crowd_level?: 'low' | 'moderate' | 'high';
  safety_rating?: number;
  avg_rating?: number;
  review_count?: number;
  best_time_to_visit?: string;
  tags?: string[];
  is_hidden_gem?: boolean;
  is_featured?: boolean;
  // Enriched fields
  city_name?: string;
  state_name?: string;
  distance_km?: number;
}

// ─── User & Auth Types ──────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  home_city?: string;
  location?: string;
  website?: string;
  travel_style?: string;
  total_trips?: number;
  total_places_visited?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Itinerary Types ────────────────────────────────────────────────────────

export type TravelStyle = 'solo' | 'family' | 'couple' | 'friends' | 'adventure' | 'spiritual' | 'luxury' | 'budget';
export type BudgetLevel = 'budget' | 'moderate' | 'luxury';

export interface ItineraryConfig {
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
  days: number;
  budget: BudgetLevel;
  travelStyle: TravelStyle;
}

export interface TimeSlot {
  time: string; // e.g. "9:00 AM"
  label: 'morning' | 'afternoon' | 'evening';
  place: Place;
  duration: number; // minutes
  notes?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  slots: TimeSlot[];
  totalDistance?: number;
}

export interface GeneratedItinerary {
  id: string;
  config: ItineraryConfig;
  days: ItineraryDay[];
  totalPlaces: number;
  hiddenGemsCount: number;
  estimatedBudget?: number;
  createdAt: string;
}

// Saved itinerary (Supabase)
export interface SavedItinerary {
  id: string;
  user_id: string;
  title: string;
  config: ItineraryConfig;
  itinerary_data: GeneratedItinerary;
  cover_image?: string;
  status?: 'upcoming' | 'active' | 'completed';
  is_public?: boolean;
  share_token?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── UI Types ───────────────────────────────────────────────────────────────

export interface MasonryItem {
  id: string;
  img: string;
  height: number;
  title?: string;
  url?: string;
}

export interface PlaceFilters {
  category?: string;
  min_rating?: number;
  max_entry_fee?: number;
  is_free?: boolean;
  is_hidden_gem?: boolean;
  sort_by?: 'rating' | 'popularity' | 'distance' | 'recent';
  search?: string;
  page?: number;
  limit?: number;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  city_name: string;
}
