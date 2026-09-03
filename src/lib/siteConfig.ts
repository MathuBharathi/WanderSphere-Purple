export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wandersphere-in.vercel.app';
export const SITE_NAME = 'WanderSphere';
export const SITE_TAGLINE = 'Discover the Best Places to Travel in India';
export const SITE_DESCRIPTION = 'Plan personalized, AI-powered travel itineraries across Indian states and cities. Discover famous attractions, hidden gems, weather forecasts, and interactive maps.';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath === '/' ? '' : cleanPath}`;
}
