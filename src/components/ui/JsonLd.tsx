import React from 'react';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/siteConfig';

interface JsonLdProps {
  data?: Record<string, any>;
  type?: 'website' | 'organization' | 'place' | 'breadcrumbs';
  placeData?: {
    name: string;
    description?: string;
    image?: string;
    cityName?: string;
    stateName?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
    reviewCount?: number;
    category?: string;
  };
  breadcrumbItems?: Array<{ name: string; item: string }>;
}

export function JsonLd({ data, type = 'website', placeData, breadcrumbItems }: JsonLdProps) {
  let schemaData: Record<string, any> = data || {};

  if (!data) {
    if (type === 'website' || type === 'organization') {
      schemaData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            publisher: {
              '@type': 'Organization',
              '@id': `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
            },
            inLanguage: 'en-IN',
          },
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
            sameAs: [
              'https://github.com/MathuBharathi/WanderSphere',
            ],
          },
        ],
      };
    } else if (type === 'place' && placeData) {
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: placeData.name,
        description: placeData.description || SITE_DESCRIPTION,
        image: placeData.image ? [placeData.image] : undefined,
        address: {
          '@type': 'PostalAddress',
          addressLocality: placeData.cityName,
          addressRegion: placeData.stateName,
          addressCountry: 'IN',
        },
        ...(placeData.latitude && placeData.longitude
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: placeData.latitude,
                longitude: placeData.longitude,
              },
            }
          : {}),
        ...(placeData.rating && placeData.reviewCount
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: placeData.rating,
                bestRating: '5',
                worstRating: '1',
                ratingCount: placeData.reviewCount,
              },
            }
          : {}),
      };
    } else if (type === 'breadcrumbs' && breadcrumbItems) {
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.item.startsWith('http') ? item.item : `${SITE_URL}${item.item}`,
        })),
      };
    }
  }

  if (Object.keys(schemaData).length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
