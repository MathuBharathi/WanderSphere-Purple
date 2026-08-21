/**
 * Intelligent Image Resolver for Indian Tourist Cities, Places & Destinations
 * Provides accurate, distinct, high-resolution Unsplash photos for every city and place.
 */

// Pool of 30 distinct, stunning Unsplash travel photos across India for unique fallbacks
const DIVERSE_INDIA_PHOTO_POOL = [
  'photo-1507525428034-b723cf961d3e?w=800', // Tropical beach
  'photo-1548013146-72479768bada?w=800', // Heritage architecture
  'photo-1582510003544-4d00b7f74220?w=800', // Dravidian temple
  'photo-1600100397608-e4b1373030a8?w=800', // Royal palace / fort
  'photo-1432405972618-c60b0225b8f9?w=800', // Waterfall & nature
  'photo-1626621341517-bbf3d9990a23?w=800', // Snow mountain valley
  'photo-1564507592333-c60657eea523?w=800', // Taj Mahal / Agra
  'photo-1514222709107-a180c68d72b4?w=800', // Golden Temple
  'photo-1598091383021-15ddea10925d?w=800', // Tea gardens / hill station
  'photo-1602216056096-3b40cc0c9944?w=800', // Backwaters houseboat
  'photo-1596040033229-a9821ebd058d?w=800', // Spice plantation
  'photo-1534447677768-be436bb09401?w=800', // Night market / bazaar
  'photo-1534188753412-3e26d0d618d6?w=800', // Wildlife safari
  'photo-1587474260584-136574528ed5?w=800', // Qutub Minar / Delhi
  'photo-1570168007204-dfb528c6958f?w=800', // Gateway of India / Mumbai
  'photo-1558431382-27e303142255?w=800', // Victoria Memorial / Kolkata
  'photo-1599661046289-e31897846e41?w=800', // Pink city / Hawa Mahal
  'photo-1566837945700-30057527ade0?w=800', // Kashmir Dal Lake
  'photo-1589179899502-29d1047c0868?w=800', // Andaman ocean
  'photo-1593693397690-362cb9666fc2?w=800', // Ladakh monastery & lake
  'photo-1605379399642-870262d3d051?w=800', // Charminar Hyderabad
  'photo-1596176530529-78163a4f7af2?w=800', // Garden city Bangalore
  'photo-1609949279531-cf48d64bed89?w=800', // Madurai Meenakshi
  'photo-1590050752117-238cb0fb12b1?w=800', // Rishikesh Ganga river
  'photo-1512343879784-a960bf40e7f2?w=800', // Goa palm beach
  'photo-1511193311914-0346f16efe90?w=800', // River cruise / casino
  'photo-1513836279014-a89f7a76ae86?w=800', // Deep forest & trail
  'photo-1544735716-392fe2489ffa?w=800', // Tea gardens Northeast
  'photo-1591018653367-4e9dc40dce49?w=800', // Bodh Gaya stupa
  'photo-1589308078059-be1415eab4c3?w=800', // Kutch white desert
];

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─── CITY IMAGE MAPPINGS ──────────────────────────────────────────────────
const CITY_IMAGE_MAP: Record<string, string> = {
  srinagar: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
  munnar: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800',
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
  alappuzha: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
  coimbatore: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  ooty: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800',
  kodaikanal: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  shimla: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  ladakh: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800',
  leh: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800',
  andaman: 'https://images.unsplash.com/photo-1589179899502-29d1047c0868?w=800',
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
  udaipur: 'https://images.unsplash.com/photo-1600100397608-e4b1373030a8?w=800',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
  amritsar: 'https://images.unsplash.com/photo-1514222709107-a180c68d72b4?w=800',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800',
  kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800',
  hyderabad: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800',
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  madurai: 'https://images.unsplash.com/photo-1609949279531-cf48d64bed89?w=800',
  mysore: 'https://images.unsplash.com/photo-1600100397608-e4b1373030a8?w=800',
  rishikesh: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800',
};

// ─── PLACE KEYWORD MAPPINGS ───────────────────────────────────────────────
const PLACE_IMAGE_MAP: { keywords: string[]; url: string }[] = [
  {
    keywords: ['casino', 'deltin', 'pride', 'mandovi', 'cruise', 'yacht', 'floating casino'],
    url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800'
  },
  {
    keywords: ['church', 'immaculate', 'conception', 'basilica', 'bom jesus', 'cathedral', 'se cathedral'],
    url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800'
  },
  {
    keywords: ['beach', 'baga', 'calangute', 'anjuna', 'palolem', 'candolim', 'vagator', 'colva', 'morjim', 'radhanagar'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    keywords: ['fort', 'aguada', 'chapora', 'reis magos', 'red fort', 'amer', 'mehrangarh', 'gwalior', 'jaisalmer', 'palace'],
    url: 'https://images.unsplash.com/photo-1600100397608-e4b1373030a8?w=800'
  },
  {
    keywords: ['waterfall', 'dudhsagar', 'jog', 'athirappilly', 'falls', 'hogenakkal', 'courtallam', 'chitrakote'],
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800'
  },
  {
    keywords: ['temple', 'meenakshi', 'brihadeeswarar', 'kedarnath', 'tirupati', 'somnath', 'golden temple', 'jagannath', 'kashi', 'vishwanath', 'mandir'],
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800'
  },
  {
    keywords: ['taj mahal', 'agra', 'mumtaz'],
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800'
  },
  {
    keywords: ['golden temple', 'amritsar', 'harmandir'],
    url: 'https://images.unsplash.com/photo-1514222709107-a180c68d72b4?w=800'
  },
  {
    keywords: ['tea', 'munnar', 'darjeeling', 'ooty', 'plantation', 'estate', 'coorg', 'valparai'],
    url: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800'
  },
  {
    keywords: ['backwater', 'alleppey', 'kumarakom', 'houseboat', 'kerala backwaters', 'lake'],
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800'
  },
  {
    keywords: ['spice', 'tropical spice', 'farm', 'herbs', 'cardamom', 'vanilla'],
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'
  },
  {
    keywords: ['market', 'bazaar', 'flea', 'night market', 'shopping', 'street food', 'chandni chowk', 'mapusa'],
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800'
  },
  {
    keywords: ['wildlife', 'safari', 'national park', 'kaziranga', 'ranthambore', 'gir', 'lion', 'tiger', 'rhino', 'zoo', 'sanctuary'],
    url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800'
  },
  {
    keywords: ['mountain', 'snow', 'manali', 'shimla', 'leh', 'ladakh', 'gulmarg', 'solang', 'rohtang', 'peak', 'himalaya'],
    url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800'
  },
  {
    keywords: ['monument', 'qutub', 'gateway', 'victoria', 'charminar', 'hampi', 'ruins', 'caves', 'ajanta', 'ellora'],
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800'
  }
];

/**
 * Returns an accurate, distinct Unsplash image URL for any city.
 */
export function getCityImageUrl(cityName?: string, currentImage?: string): string {
  if (!cityName) {
    return currentImage || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800';
  }

  const nameClean = cityName.toLowerCase().trim();
  if (CITY_IMAGE_MAP[nameClean]) {
    return CITY_IMAGE_MAP[nameClean];
  }

  // If currentImage is valid and not generic fallback
  if (currentImage && !currentImage.includes('1524492412937-b28074a5d7da') && !currentImage.includes('1498050108023-c5249f4df085')) {
    return currentImage;
  }

  // Deterministic unique fallback photo based on city name hash
  const photoId = DIVERSE_INDIA_PHOTO_POOL[getHash(cityName) % DIVERSE_INDIA_PHOTO_POOL.length];
  return `https://images.unsplash.com/${photoId}`;
}

/**
 * Returns an accurate, distinct Unsplash image URL for any place based on its name & category.
 */
export function getPlaceImageUrl(placeName?: string, category?: string, currentImage?: string): string {
  if (!placeName) {
    return currentImage || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800';
  }

  const nameLower = placeName.toLowerCase();

  // Check keyword mappings
  for (const entry of PLACE_IMAGE_MAP) {
    if (entry.keywords.some((kw) => nameLower.includes(kw))) {
      return entry.url;
    }
  }

  // If currentImage is valid and not generic fallback
  if (currentImage && !currentImage.includes('1524492412937-b28074a5d7da') && !currentImage.includes('1498050108023-c5249f4df085')) {
    return currentImage;
  }

  // Deterministic unique fallback photo based on place name hash
  const photoId = DIVERSE_INDIA_PHOTO_POOL[getHash(placeName) % DIVERSE_INDIA_PHOTO_POOL.length];
  return `https://images.unsplash.com/${photoId}`;
}
