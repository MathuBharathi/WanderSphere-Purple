import { NextResponse } from 'next/server';
import { cities, places } from '@/data/travelData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ cities: [], places: [] });
  }

  const q = query.trim().toLowerCase();

  const matchedCities = cities
    .filter(c => c.name.toLowerCase().includes(q))
    .slice(0, 6);

  const matchedPlaces = places
    .filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
    .slice(0, 8);

  return NextResponse.json({
    cities: matchedCities,
    places: matchedPlaces,
  });
}
