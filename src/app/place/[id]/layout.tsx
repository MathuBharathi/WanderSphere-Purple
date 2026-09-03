import type { Metadata } from 'next';
import { getPlaceById } from '@/lib/api';
import { getCanonicalUrl, SITE_NAME } from '@/lib/siteConfig';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const place = await getPlaceById(params.id);
  if (!place) {
    return {
      title: `Place Not Found | ${SITE_NAME}`,
      description: 'The requested attraction could not be found on WanderSphere.',
    };
  }

  const locationLabel = place.city_name ? `${place.city_name}` : 'India';
  const title = `${place.name}, ${locationLabel} | Travel Guide | ${SITE_NAME}`;
  const description =
    place.description ||
    `Discover ${place.name} in ${locationLabel}. View photos, visitor reviews, opening hours, and travel recommendations.`;
  const canonical = getCanonicalUrl(`/place/${place.id}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: place.cover_image ? [{ url: place.cover_image, alt: place.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: place.cover_image ? [place.cover_image] : [],
    },
  };
}

export default function PlaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
