const fs = require('fs');
const path = require('path');

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length === 0) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (vals[idx] || '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[\s\W_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Unsplash Default Cover Images by Category ────────────────────────────────
const CATEGORY_IMAGES = {
  historical: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
  nature: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
  adventure: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
  spiritual: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  wildlife: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800',
  cultural: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  photography: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
  shopping: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
  food: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
  architecture: 'https://images.unsplash.com/photo-1600100397608-e4b1373030a8?w=800',
  museum: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800',
  park: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800',
  lake: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  waterfall: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800',
  hill_station: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  market: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800',
  nightlife: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  default: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800'
};

const CITY_STATE_FALLBACK = {
  'ahilyanagar': 'Maharashtra',
  'alibaug': 'Maharashtra',
  'alleppey': 'Kerala',
  'amarnath': 'Jammu and Kashmir',
  'andaman': 'Andaman and Nicobar Islands',
  'andaman islands': 'Andaman and Nicobar Islands',
  'chhatrapati sambhajinagar': 'Maharashtra',
  'dharamshala': 'Himachal Pradesh',
  'hubli': 'Karnataka',
  'jim corbett national park': 'Uttarakhand',
  'kasol': 'Himachal Pradesh',
  'khandala': 'Maharashtra',
  'lakshadweep': 'Lakshadweep',
  'lavasa': 'Maharashtra',
  'leh ladakh': 'Ladakh',
  'mcleodganj': 'Himachal Pradesh',
  'mumbai': 'Maharashtra',
  'nanded': 'Maharashtra',
  'poovar': 'Kerala',
  'raigad': 'Maharashtra',
  'rameshwaram': 'Tamil Nadu',
  'ranthambore': 'Rajasthan',
  'sangli': 'Maharashtra',
  'shimoga (shivamogga)': 'Karnataka',
  'sindhudurg': 'Maharashtra',
  'trichy': 'Tamil Nadu',
  'vaishno devi': 'Jammu and Kashmir'
};

// ─── Category Mapping ────────────────────────────────────────────────────────
function mapCategory(primary, secondary, subcategory, placeType) {
  const text = `${primary} ${secondary} ${subcategory} ${placeType}`.toLowerCase();
  
  if (text.includes('temple') || text.includes('spiritual') || text.includes('religious') || text.includes('ashram') || text.includes('church') || text.includes('mosque') || text.includes('monastery') || text.includes('gurudwara') || text.includes('jyotirlinga') || text.includes('dargah')) {
    return 'spiritual';
  }
  if (text.includes('beach') || text.includes('coastal') || text.includes('island') || text.includes('sea')) {
    return 'beach';
  }
  if (text.includes('wildlife') || text.includes('national park') || text.includes('sanctuary') || text.includes('zoo') || text.includes('safari') || text.includes('tiger reserve')) {
    return 'wildlife';
  }
  if (text.includes('waterfall') || text.includes('falls')) {
    return 'waterfall';
  }
  if (text.includes('lake') || text.includes('dam') || text.includes('backwater') || text.includes('river')) {
    return 'lake';
  }
  if (text.includes('hill') || text.includes('peak') || text.includes('valley') || text.includes('viewpoint') || text.includes('pass') || text.includes('snow')) {
    return 'hill_station';
  }
  if (text.includes('fort') || text.includes('palace') || text.includes('historical') || text.includes('monument') || text.includes('heritage') || text.includes('ruins') || text.includes('caves') || text.includes('tomb') || text.includes('archaeological')) {
    return 'historical';
  }
  if (text.includes('adventure') || text.includes('trek') || text.includes('rafting') || text.includes('camping') || text.includes('sports')) {
    return 'adventure';
  }
  if (text.includes('museum') || text.includes('gallery') || text.includes('memorial')) {
    return 'museum';
  }
  if (text.includes('park') || text.includes('garden')) {
    return 'park';
  }
  if (text.includes('market') || text.includes('bazaar') || text.includes('shopping') || text.includes('mall')) {
    return 'shopping';
  }
  if (text.includes('food') || text.includes('restaurant') || text.includes('cuisine') || text.includes('cafe')) {
    return 'food';
  }
  if (text.includes('nature')) {
    return 'nature';
  }
  if (text.includes('architecture')) {
    return 'architecture';
  }
  return 'cultural';
}

// ─── Main Conversion Function ────────────────────────────────────────────────
function convert() {
  console.log('Starting Master Dataset Conversion...');

  const masterDir = path.join(__dirname, '../DATASET/Master_DATASET');
  const statesCSV = parseCSV(fs.readFileSync(path.join(masterDir, 'WanderSphere_States.csv'), 'utf8'));
  const citiesCSV = parseCSV(fs.readFileSync(path.join(masterDir, 'WanderSphere_Cities.csv'), 'utf8'));
  const placesCSV = parseCSV(fs.readFileSync(path.join(masterDir, 'WanderSphere_Master_Places.csv'), 'utf8'));

  const legacyMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/legacy_map.json'), 'utf8'));

  // Maps for Legacy Lookups
  const legacyStateBySlug = new Map();
  const legacyStateByName = new Map();
  legacyMap.legacyStates.forEach(s => {
    legacyStateBySlug.set(s.slug, s);
    legacyStateByName.set(s.name.toLowerCase().trim(), s);
  });

  const legacyCityBySlug = new Map();
  const legacyCityByNameState = new Map();
  legacyMap.legacyCities.forEach(c => {
    legacyCityBySlug.set(c.slug, c);
    legacyCityByNameState.set(`${c.name.toLowerCase().trim()}__${c.state_id}`, c);
  });

  const legacyPlaceBySlug = new Map();
  const legacyPlaceByNameCity = new Map();
  legacyMap.legacyPlaces.forEach(p => {
    if (p.slug) legacyPlaceBySlug.set(p.slug, p);
    legacyPlaceByNameCity.set(`${p.name.toLowerCase().trim()}__${p.city_id}`, p);
  });

  // 1. PROCESS STATES
  const stateMap = new Map(); // key: normalized name -> state object
  const stateCodeMap = new Map(); // key: state_code -> state object

  statesCSV.forEach(s => {
    const rawName = s.state.trim();
    if (!rawName) return;
    
    const slug = slugify(rawName);
    const legacy = legacyStateByName.get(rawName.toLowerCase()) || legacyStateBySlug.get(slug);

    const stateObj = {
      id: legacy ? legacy.id : `state-${slug}`,
      name: rawName,
      code: s.state_code || (legacy ? legacy.code : slug.substring(0, 2).toUpperCase()),
      slug: slug,
      description: (legacy && legacy.description) || `Explore the stunning destinations, rich culture, and top tourist places across ${rawName}.`,
      cover_image: (legacy && legacy.cover_image) || CATEGORY_IMAGES.default
    };

    stateMap.set(rawName.toLowerCase(), stateObj);
    if (s.state_code) stateCodeMap.set(s.state_code, stateObj);
  });

  // Handle common aliases for state lookup
  const stateAliasMap = new Map();
  stateMap.forEach((val, key) => {
    stateAliasMap.set(key, val);
  });
  stateAliasMap.set('andaman & nicobar', stateMap.get('andaman and nicobar islands'));
  stateAliasMap.set('andaman and nicobar', stateMap.get('andaman and nicobar islands'));
  stateAliasMap.set('jammu & kashmir', stateMap.get('jammu and kashmir'));
  stateAliasMap.set('dadra and nagar haveli', stateMap.get('dadra and nagar haveli and daman and diu'));
  stateAliasMap.set('daman and diu', stateMap.get('dadra and nagar haveli and daman and diu'));

  // 2. PROCESS CITIES
  const cityMap = new Map(); // key: city_id or city_name__state_id -> city object
  const finalCities = [];
  const processedCityIds = new Set();

  // Helper city normalization
  function normalizeCityName(name) {
    if (!name) return '';
    let n = name.trim();
    if (n.toLowerCase() === 'bangalore') return 'Bengaluru';
    if (n.toLowerCase() === 'bombay') return 'Mumbai';
    if (n.toLowerCase() === 'madras') return 'Chennai';
    if (n.toLowerCase() === 'calcutta') return 'Kolkata';
    if (n.toLowerCase() === 'trivandrum') return 'Thiruvananthapuram';
    if (n.toLowerCase() === 'pondicherry') return 'Puducherry';
    return n;
  }

  citiesCSV.forEach(c => {
    const rawCityName = normalizeCityName(c.city_name);
    if (!rawCityName) return;

    let rawStateName = (c.state || '').trim();
    if (!rawStateName) {
      const fallbackState = CITY_STATE_FALLBACK[rawCityName.toLowerCase()];
      if (fallbackState) rawStateName = fallbackState;
    }

    let stateObj = stateAliasMap.get(rawStateName.toLowerCase()) || stateCodeMap.get(c.state_code);
    if (!stateObj) {
      // Fallback state search
      stateMap.forEach((s) => {
        if (s.name.toLowerCase() === rawStateName.toLowerCase()) stateObj = s;
      });
    }

    if (!stateObj) {
      console.warn(`City ${rawCityName} has unmapped state: ${rawStateName}`);
      return;
    }

    const citySlug = slugify(rawCityName);
    const legacy = legacyCityByNameState.get(`${rawCityName.toLowerCase()}__${stateObj.id}`) || legacyCityBySlug.get(citySlug);

    const cityId = legacy ? legacy.id : `city-${citySlug}`;
    if (processedCityIds.has(cityId)) return;
    processedCityIds.add(cityId);

    const lat = parseFloat(c.latitude) || (legacy ? legacy.latitude : 20.5937);
    const lng = parseFloat(c.longitude) || (legacy ? legacy.longitude : 78.9629);

    const cityObj = {
      id: cityId,
      state_id: stateObj.id,
      name: rawCityName,
      slug: citySlug,
      description: c.description || (legacy && legacy.description) || `Discover top attractions, cultural landmarks, and hidden gems in ${rawCityName}, ${stateObj.name}.`,
      cover_image: (legacy && legacy.cover_image) || CATEGORY_IMAGES.default,
      latitude: lat,
      longitude: lng,
      best_season: c.best_time_to_visit || (legacy && legacy.best_season) || 'October-March',
      avg_temp_celsius: (legacy && legacy.avg_temp_celsius) || 22,
      is_featured: c.is_major_destination === 'True' || (legacy ? legacy.is_featured : false),
      is_trending: (legacy ? legacy.is_trending : false),
      tags: (legacy && legacy.tags) || ['popular', 'heritage']
    };

    finalCities.push(cityObj);
    cityMap.set(c.city_id, cityObj);
    cityMap.set(c.city_name.toLowerCase().trim(), cityObj);
    cityMap.set(`${rawCityName.toLowerCase()}__${stateObj.id}`, cityObj);
  });

  // 3. PROCESS PLACES
  const finalPlaces = [];
  const processedPlaceIds = new Set();
  let duplicateCount = 0;

  placesCSV.forEach((p, idx) => {
    const rawPlaceName = (p.place_name || '').trim();
    if (!rawPlaceName) return;

    // Find city for place
    let matchedCity = cityMap.get(p.city_id);
    if (!matchedCity && p.city_id) {
      matchedCity = cityMap.get(p.city_id.toLowerCase().trim());
    }
    if (!matchedCity && p.city) {
      const normCity = normalizeCityName(p.city);
      matchedCity = cityMap.get(normCity.toLowerCase().trim());
    }

    // If city is still unlinked, check state/district to link or dynamically register city
    if (!matchedCity) {
      const stateNameStr = p.state || p.union_territory || '';
      let stateObj = stateAliasMap.get(stateNameStr.toLowerCase());
      if (!stateObj && p.state_code) stateObj = stateCodeMap.get(p.state_code);
      if (!stateObj) stateObj = stateMap.get('karnataka'); // Default fallback for orphan district records

      const cityName = normalizeCityName(p.city || p.district || 'Tourist Hub');
      const citySlug = slugify(cityName);
      const cityId = `city-${citySlug}`;

      matchedCity = {
        id: cityId,
        state_id: stateObj.id,
        name: cityName,
        slug: citySlug,
        description: `Explore attractions in ${cityName}, ${stateObj.name}.`,
        cover_image: CATEGORY_IMAGES.default,
        latitude: parseFloat(p.latitude) || 20.5937,
        longitude: parseFloat(p.longitude) || 78.9629,
        best_season: 'October-March',
        avg_temp_celsius: 24,
        is_featured: false,
        is_trending: false,
        tags: ['sightseeing']
      };

      if (!processedCityIds.has(cityId)) {
        processedCityIds.add(cityId);
        finalCities.push(matchedCity);
      }
      cityMap.set(cityId, matchedCity);
      cityMap.set(cityName.toLowerCase(), matchedCity);
    }

    const category = mapCategory(p.primary_category, p.secondary_categories, p.subcategory, p.place_type);
    const placeSlug = slugify(rawPlaceName);

    // Look for legacy place match
    const legacy = legacyPlaceByNameCity.get(`${rawPlaceName.toLowerCase()}__${matchedCity.id}`) || legacyPlaceBySlug.get(placeSlug);

    let placeId = legacy ? legacy.id : `place-${placeSlug}-${matchedCity.slug}`;
    
    // Ensure unique ID
    if (processedPlaceIds.has(placeId)) {
      duplicateCount++;
      placeId = `place-${placeSlug}-${matchedCity.slug}-${idx}`;
    }
    processedPlaceIds.add(placeId);

    // Image resolution
    let coverImg = p.image_url && p.image_url.startsWith('http') ? p.image_url : null;
    if (!coverImg && legacy && legacy.cover_image) coverImg = legacy.cover_image;
    if (!coverImg) coverImg = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default;

    // Rating & reviews
    const rating = parseFloat(p.rating || p.google_rating) || (legacy ? legacy.avg_rating : 4.3);
    const reviews = parseInt(p.review_count || p.google_review_count, 10) || (legacy ? legacy.review_count : 250);
    const fee = parseFloat(p.entry_fee) || (legacy ? legacy.entry_fee : 0);
    const durationHours = parseFloat(p.estimated_visit_duration_hours) || 1.5;
    const durationMins = Math.round(durationHours * 60);

    const isHiddenGem = p.is_hidden_gem === 'True' || p.is_offbeat === 'True' || (legacy ? legacy.is_hidden_gem : false);
    const isFeatured = p.is_featured === 'True' || p.is_popular === 'True' || (legacy ? legacy.is_featured : false);

    const desc = p.description || p.short_description || (legacy && legacy.description) || `${rawPlaceName} is a popular ${category.replace('_', ' ')} attraction located in ${matchedCity.name}.`;

    const placeObj = {
      id: placeId,
      city_id: matchedCity.id,
      name: rawPlaceName,
      slug: placeSlug,
      description: desc,
      category: category,
      sub_category: p.subcategory || p.place_type || category,
      cover_image: coverImg,
      images: [coverImg],
      latitude: parseFloat(p.latitude) || matchedCity.latitude,
      longitude: parseFloat(p.longitude) || matchedCity.longitude,
      address: p.address || `${rawPlaceName}, ${matchedCity.name}`,
      opening_time: p.opening_time || '09:00 AM',
      closing_time: p.closing_time || '06:00 PM',
      entry_fee: fee,
      entry_fee_currency: 'INR',
      avg_visit_duration: durationMins,
      crowd_level: (legacy && legacy.crowd_level) || (reviews > 5000 ? 'high' : reviews > 1000 ? 'moderate' : 'low'),
      safety_rating: (legacy && legacy.safety_rating) || 4.5,
      avg_rating: rating,
      review_count: reviews,
      best_time_to_visit: p.best_time_to_visit || 'Morning',
      tags: Array.from(new Set([category, matchedCity.slug, p.tourism_theme || 'sightseeing'].filter(Boolean))),
      is_hidden_gem: isHiddenGem,
      is_featured: isFeatured
    };

    finalPlaces.push(placeObj);
  });

  const finalStatesArray = Array.from(stateMap.values());

  console.log('\n--- CONVERSION SUMMARY ---');
  console.log(`- Final States/UTs Count: ${finalStatesArray.length}`);
  console.log(`- Final Cities Count: ${finalCities.length}`);
  console.log(`- Final Places Count: ${finalPlaces.length}`);
  console.log(`- Place ID Duplicates Handled: ${duplicateCount}`);

  // GENERATE CODE FILE CONTENT
  const codeContent = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/buildMasterDataset.js — DO NOT EDIT MANUALLY
// Generated from DATASET/Master_DATASET (WanderSphere Master India Tourism Dataset)
// ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════════════════════════════

import type { State, City, Place } from '../types';

export const generatedStates: State[] = ${JSON.stringify(finalStatesArray, null, 2)};

export const generatedCities: City[] = ${JSON.stringify(finalCities, null, 2)};

export const generatedPlaces: Place[] = ${JSON.stringify(finalPlaces, null, 2)};

export const cityTransportInfo: Record<string, { airport?: string; railway?: string; bus?: string }> = {
  "Bengaluru": { airport: "Kempegowda International Airport (BLR)", railway: "KSR Bengaluru City Junction (SBC)", bus: "Majestic Bus Stand (KBS)" },
  "Mumbai": { airport: "Chhatrapati Shivaji Maharaj International Airport (BOM)", railway: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", bus: "Mumbai Central Bus Station" },
  "Delhi": { airport: "Indira Gandhi International Airport (DEL)", railway: "New Delhi Railway Station (NDLS)", bus: "ISBT Kashmiri Gate" },
  "Chennai": { airport: "Chennai International Airport (MAA)", railway: "Chennai Central (MAS)", bus: "CMBT Koyambedu" },
  "Kolkata": { airport: "Netaji Subhash Chandra Bose International Airport (CCU)", railway: "Howrah Junction (HWH)", bus: "Esplanade Bus Station" },
  "Hyderabad": { airport: "Rajiv Gandhi International Airport (HYD)", railway: "Secunderabad Junction (SC)", bus: "MGBS Hyderabad" },
  "Jaipur": { airport: "Jaipur International Airport (JAI)", railway: "Jaipur Junction (JP)", bus: "Sindhi Camp Bus Stand" },
  "Kochi": { airport: "Cochin International Airport (COK)", railway: "Ernakulam Junction (ERS)", bus: "KSRTC Bus Stand Ernakulam" },
  "Visakhapatnam": { airport: "Visakhapatnam International Airport (VTZ)", railway: "Visakhapatnam Junction (VSKP)", bus: "RTC Complex Bus Station" },
  "Ahmedabad": { airport: "Sardar Vallabhbhai Patel International Airport (AMD)", railway: "Ahmedabad Junction (ADI)", bus: "GSRTC Geeta Mandir Bus Station" }
};
`;

  const outputPath = path.join(__dirname, '../src/data/generatedData.ts');
  fs.writeFileSync(outputPath, codeContent, 'utf8');
  console.log(`\nSuccessfully wrote ${outputPath} (${(codeContent.length / 1024 / 1024).toFixed(2)} MB)`);
}

convert();
