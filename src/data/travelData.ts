import type { State, City, Place } from '../types';
import { generatedStates, generatedCities, generatedPlaces, cityTransportInfo } from './generatedData';

export const states: State[] = generatedStates;
export const cities: City[] = generatedCities;
export const places: Place[] = generatedPlaces;

export function getDatasetStatistics() {
  const uniqueStates = new Set(states.map(s => s.name.trim().toLowerCase())).size;
  const uniqueCities = new Set(cities.map(c => c.name.trim().toLowerCase())).size;
  const attractions = places.length;
  const hiddenGems = places.filter(p => p.is_hidden_gem).length;

  return {
    states: uniqueStates,
    cities: uniqueCities,
    attractions,
    hiddenGems,
  };
}

// Re-export transport info for use in city pages / PDF
export { cityTransportInfo };
