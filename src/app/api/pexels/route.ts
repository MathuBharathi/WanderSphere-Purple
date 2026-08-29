import { NextRequest, NextResponse } from 'next/server';
import { fetchPexelsPhoto, cleanPexelsQuery } from '@/lib/pexels';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const place = searchParams.get('place') || '';
  const city = searchParams.get('city') || '';
  const state = searchParams.get('state') || '';

  const searchQuery = q || cleanPexelsQuery(place, city, state);

  if (!searchQuery) {
    return NextResponse.json({ error: 'Query parameters required' }, { status: 400 });
  }

  const result = await fetchPexelsPhoto(searchQuery);

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}
