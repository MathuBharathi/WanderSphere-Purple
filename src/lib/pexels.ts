/**
 * Centralized Server-Side Pexels API Service
 * Handles destination-specific Pexels photo searches, caching, rate limiting, and attribution.
 */

export interface PexelsPhotoResult {
  id: number | string;
  url: string;
  large: string;
  medium: string;
  small: string;
  photographer: string;
  photographer_url: string;
  pexels_url: string;
  alt?: string;
}

// In-Memory Cache to prevent redundant Pexels API requests
const pexelsCache = new Map<string, PexelsPhotoResult>();

// Curated pool of high-quality Pexels travel photos across India destinations for fallback
export const PEXELS_FALLBACK_POOL: PexelsPhotoResult[] = [
  {
    id: 11948442,
    url: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Abhinav Sharma',
    photographer_url: 'https://www.pexels.com/@abhi31',
    pexels_url: 'https://www.pexels.com/photo/the-taj-mahal-in-india-11948442/',
    alt: 'Taj Mahal, Agra'
  },
  {
    id: 35981367,
    url: 'https://images.pexels.com/photos/35981367/pexels-photo-35981367.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/35981367/pexels-photo-35981367.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/35981367/pexels-photo-35981367.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/35981367/pexels-photo-35981367.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Naman Aggarwal',
    photographer_url: 'https://www.pexels.com/@naman-aggarwal-16616480',
    pexels_url: 'https://www.pexels.com/photo/kaziranga-national-park-35981367/',
    alt: 'Kaziranga Wildlife'
  },
  {
    id: 37938064,
    url: 'https://images.pexels.com/photos/37938064/pexels-photo-37938064.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/37938064/pexels-photo-37938064.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/37938064/pexels-photo-37938064.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/37938064/pexels-photo-37938064.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Pexels Contributor',
    photographer_url: 'https://www.pexels.com',
    pexels_url: 'https://www.pexels.com',
    alt: 'Kerala Backwaters'
  },
  {
    id: 14094276,
    url: 'https://images.pexels.com/photos/14094276/pexels-photo-14094276.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/14094276/pexels-photo-14094276.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/14094276/pexels-photo-14094276.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/14094276/pexels-photo-14094276.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Pexels Contributor',
    photographer_url: 'https://www.pexels.com',
    pexels_url: 'https://www.pexels.com',
    alt: 'Rajasthan Fort'
  },
  {
    id: 672638,
    url: 'https://images.pexels.com/photos/672638/pexels-photo-672638.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/672638/pexels-photo-672638.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/672638/pexels-photo-672638.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/672638/pexels-photo-672638.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Pexels Contributor',
    photographer_url: 'https://www.pexels.com',
    pexels_url: 'https://www.pexels.com',
    alt: 'Goa Ocean Beach'
  },
  {
    id: 37316520,
    url: 'https://images.pexels.com/photos/37316520/pexels-photo-37316520.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/37316520/pexels-photo-37316520.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/37316520/pexels-photo-37316520.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/37316520/pexels-photo-37316520.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Pexels Contributor',
    photographer_url: 'https://www.pexels.com',
    pexels_url: 'https://www.pexels.com',
    alt: 'Himalayan Mountain Landscape'
  },
  {
    id: 6738359,
    url: 'https://images.pexels.com/photos/6738359/pexels-photo-6738359.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    large: 'https://images.pexels.com/photos/6738359/pexels-photo-6738359.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    medium: 'https://images.pexels.com/photos/6738359/pexels-photo-6738359.jpeg?auto=compress&cs=tinysrgb&w=600',
    small: 'https://images.pexels.com/photos/6738359/pexels-photo-6738359.jpeg?auto=compress&cs=tinysrgb&w=400',
    photographer: 'Pexels Contributor',
    photographer_url: 'https://www.pexels.com',
    pexels_url: 'https://www.pexels.com',
    alt: 'South Indian Temple'
  }
];

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Clean destination/place names for precise Pexels API search queries
 */
export function cleanPexelsQuery(name: string, city?: string, state?: string): string {
  if (!name) return `${city || ''} ${state || ''} India`.trim();
  
  let cleaned = name.replace(/^(Go Clubbing by the|Engage in the Adventures of|Marvel at the|Capture the Sceneries of|Take a Glimpse of|Visit the|Explore the|Walk through|Experience the)\s+/i, '');
  cleaned = cleaned.replace(/\s*\((.*?)\)/g, '').trim();

  const parts = [cleaned];
  if (city && !cleaned.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  if (state && !cleaned.toLowerCase().includes(state.toLowerCase())) parts.push(state);
  parts.push('India');

  return parts.join(' ');
}

/**
 * Server-side function to search Pexels API for a destination image
 */
export async function fetchPexelsPhoto(query: string): Promise<PexelsPhotoResult> {
  const cacheKey = query.toLowerCase().trim().replace(/\s+/g, ' ');
  
  if (pexelsCache.has(cacheKey)) {
    return pexelsCache.get(cacheKey)!;
  }

  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    const fallback = PEXELS_FALLBACK_POOL[getHash(query) % PEXELS_FALLBACK_POOL.length];
    pexelsCache.set(cacheKey, fallback);
    return fallback;
  }

  // Progressive search queries: full query -> trimmed queries -> destination + India
  const searchQueries = [
    query,
    query.replace(/\s+India$/i, '').trim() + ' India',
    query.split(' ')[0] + ' India'
  ].filter((q, idx, self) => q && self.indexOf(q) === idx);

  for (const q of searchQueries) {
    try {
      const encodedQuery = encodeURIComponent(q);
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=10&orientation=landscape`, {
        headers: {
          Authorization: apiKey,
          'User-Agent': 'WanderSphere-Travel/1.0',
        },
        next: { revalidate: 86400 } // Cache for 24 hours in Next.js Data Cache
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          // Pick top photo from search results
          const photo = data.photos[0];
          const result: PexelsPhotoResult = {
            id: photo.id,
            url: photo.src.large2x || photo.src.large || photo.src.original,
            large: photo.src.large2x || photo.src.large,
            medium: photo.src.medium,
            small: photo.src.small,
            photographer: photo.photographer || 'Pexels Contributor',
            photographer_url: photo.photographer_url || 'https://www.pexels.com',
            pexels_url: photo.url || 'https://www.pexels.com',
            alt: photo.alt || query,
          };
          pexelsCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch Pexels photo for query "${q}":`, error);
    }
  }

  // Fallback if all API queries return no photos
  const fallback = PEXELS_FALLBACK_POOL[getHash(query) % PEXELS_FALLBACK_POOL.length];
  pexelsCache.set(cacheKey, fallback);
  return fallback;
}
