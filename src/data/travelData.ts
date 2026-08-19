import type { State, City, Place } from '../types';
import { generatedStates, generatedCities, generatedPlaces, cityTransportInfo } from './generatedData';

export const states: State[] = generatedStates;
export const cities: City[] = generatedCities;
export const places: Place[] = generatedPlaces;

// Re-export transport info for use in city pages / PDF
export { cityTransportInfo };
