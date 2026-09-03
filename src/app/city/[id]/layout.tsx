import type { Metadata } from 'next';
import { getCityById } from '@/lib/api';
import { getCanonicalUrl, SITE_NAME } from '@/lib/siteConfig';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const city = await getCityById(params.id);
  if (!city) {
    return {
      title: `City Not Found | ${SITE_NAME}`,
      description: 'The requested city could not be found on WanderSphere.',
    };
  }

  const title = `Best Places to Visit in ${city.name} | ${SITE_NAME}`;
  const description =
    city.description ||
    `Explore top tourist attractions, hidden gems, weather forecasts, and custom travel itineraries for ${city.name}, ${city.state_name || 'India'}.`;
  const canonical = getCanonicalUrl(`/city/${city.id}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: city.cover_image ? [{ url: city.cover_image, alt: city.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: city.cover_image ? [city.cover_image] : [],
    },
  };
}

export default function CityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
