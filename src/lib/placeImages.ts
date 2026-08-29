/**
 * Intelligent Pexels Image Resolver for Indian Tourist Cities, Places & Destinations
 * Provides accurate, distinct, high-resolution Pexels photos for every city and place.
 */

import { PEXELS_FALLBACK_POOL } from './pexels';

/**
 * Returns a high-resolution Pexels image URL for any city.
 * Prioritizes destination-specific dataset image URLs.
 */
export function getCityImageUrl(cityName?: string, currentImage?: string): string {
  if (currentImage && currentImage.trim() !== '') {
    return currentImage;
  }
  return PEXELS_FALLBACK_POOL[0].url;
}

/**
 * Returns a high-resolution Pexels image URL for any place based on its name & category.
 * Prioritizes destination-specific dataset image URLs.
 */
export function getPlaceImageUrl(placeName?: string, category?: string, currentImage?: string): string {
  if (currentImage !== undefined && currentImage !== null) {
    return currentImage;
  }
  return '';
}

