import { create } from 'zustand';
import type { City, Place, State, Profile, GeneratedItinerary, ItineraryConfig } from '../types';

interface AppStore {
  // Location
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;

  // Auth
  user: any | null;
  setUser: (u: any | null) => void;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  authReady: boolean;
  setAuthReady: (v: boolean) => void;

  // Search selections
  selectedState: State | null;
  selectedCity: City | null;
  setSelectedState: (s: State | null) => void;
  setSelectedCity: (c: City | null) => void;

  // Active place for detail view
  activePlace: Place | null;
  setActivePlace: (p: Place | null) => void;

  // Map filter
  mapFilter: string;
  setMapFilter: (f: string) => void;

  // Trip list (places user wants to plan a trip for)
  tripList: Place[];
  addToTrip: (place: Place) => void;
  removeFromTrip: (placeId: string) => void;
  clearTripList: () => void;
  tripListOpen: boolean;
  setTripListOpen: (v: boolean) => void;

  // Saved places (localStorage, list of place IDs)
  savedPlaces: string[];
  toggleSavedPlace: (placeId: string) => void;
  setSavedPlaces: (placeIds: string[]) => void;

  // Itinerary generation state
  generatedItinerary: GeneratedItinerary | null;
  setGeneratedItinerary: (itinerary: GeneratedItinerary | null) => void;
  itineraryConfig: ItineraryConfig | null;
  setItineraryConfig: (config: ItineraryConfig | null) => void;
  currentItineraryId: string | null;
  setCurrentItineraryId: (id: string | null) => void;

  // UI
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),

  // Auth
  user: null,
  setUser: (u) => set({ user: u }),
  profile: null,
  setProfile: (p) => set({ profile: p }),
  authReady: false,
  setAuthReady: (v) => set({ authReady: v }),

  selectedState: null,
  selectedCity: null,
  setSelectedState: (s) => set({ selectedState: s, selectedCity: null }),
  setSelectedCity: (c) => set({ selectedCity: c }),

  activePlace: null,
  setActivePlace: (p) => set({ activePlace: p }),

  mapFilter: 'all',
  setMapFilter: (f) => set({ mapFilter: f }),

  // Trip list
  tripList: [],
  addToTrip: (place) => {
    const current = get().tripList;
    if (current.find((p) => p.id === place.id)) return;
    const updated = [...current, place];
    set({ tripList: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wandersphere_trip_list', JSON.stringify(updated.map(p => p.id)));
    }
  },
  removeFromTrip: (placeId) => {
    const updated = get().tripList.filter((p) => p.id !== placeId);
    set({ tripList: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wandersphere_trip_list', JSON.stringify(updated.map(p => p.id)));
    }
  },
  clearTripList: () => {
    set({ tripList: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wandersphere_trip_list');
    }
  },
  tripListOpen: false,
  setTripListOpen: (v) => set({ tripListOpen: v }),

  // Saved places
  savedPlaces: [],
  toggleSavedPlace: (placeId) => {
    const current = get().savedPlaces;
    const isSaved = current.includes(placeId);
    const updated = isSaved ? current.filter(id => id !== placeId) : [...current, placeId];
    set({ savedPlaces: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wandersphere_saved_places', JSON.stringify(updated));
    }
  },
  setSavedPlaces: (placeIds) => {
    set({ savedPlaces: placeIds });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wandersphere_saved_places', JSON.stringify(placeIds));
    }
  },

  // Itinerary generation
  generatedItinerary: null,
  setGeneratedItinerary: (itinerary) => set({ generatedItinerary: itinerary }),
  itineraryConfig: null,
  setItineraryConfig: (config) => set({ itineraryConfig: config }),
  currentItineraryId: null,
  setCurrentItineraryId: (id) => set({ currentItineraryId: id }),

  isSearchOpen: false,
  setIsSearchOpen: (v) => set({ isSearchOpen: v }),

  isDarkMode: true,
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
}));
