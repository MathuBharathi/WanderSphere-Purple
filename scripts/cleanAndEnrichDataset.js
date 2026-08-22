const fs = require('fs');
const path = require('path');

const generatedDataPath = path.join(__dirname, '../src/data/generatedData.ts');
const content = fs.readFileSync(generatedDataPath, 'utf8');

const stateMatch = content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/);
const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

let states = JSON.parse(stateMatch[1]);
let cities = JSON.parse(cityMatch[1]);
let places = JSON.parse(placeMatch[1]);

console.log(`Initial Counts: ${states.length} States, ${cities.length} Cities, ${places.length} Places.`);

// ─── 1. CITY MERGE MAP (Merge duplicate/alias cities into canonical cities) ─
// Format: source_city_id -> target_city_id
const CITY_MERGE_MAP = {
  // Ooty duplicates
  'city-ooty': 'city-ooty-udhagamandalam',

  // Trichy duplicates
  'city-trichy': 'city-tiruchirappalli',

  // Rameswaram duplicates
  'city-rameswaram': 'city-rameshwaram',

  // Mangalore duplicates
  'city-mangalore': 'city-mangaluru',

  // McLeod Ganj duplicates
  'city-mcleod-ganj': 'city-mcleodganj',

  // Shimoga duplicates
  'city-shivamogga': 'city-shimoga-shivamogga',

  // Mysuru duplicates
  'city-mysuru': 'city-mysore',

  // Leh duplicates
  'city-leh': 'city-leh-ladakh',

  // Kaziranga duplicates
  'city-kaziranga-national-park': 'city-kaziranga',

  // Jim Corbett duplicates
  'city-jim-corbett': 'city-jim-corbett-national-park',

  // Andaman duplicates
  'city-andaman-islands': 'city-andaman',

  // Delhi / New Delhi
  'city-new-delhi': 'city-delhi',

  // Taj Mahal city orphan
  'city-taj-mahal': 'city-agra'
};

// ─── CANONICAL CITY NAMES UPDATE ─────────────────────────────────────────────
const CITY_NAME_UPDATES = {
  'city-ooty-udhagamandalam': 'Ooty (Udhagamandalam)',
  'city-tiruchirappalli': 'Tiruchirappalli (Trichy)',
  'city-rameshwaram': 'Rameswaram',
  'city-mangaluru': 'Mangaluru (Mangalore)',
  'city-mcleodganj': 'Mcleodganj',
  'city-shimoga-shivamogga': 'Shivamogga (Shimoga)',
  'city-mysore': 'Mysuru (Mysore)',
  'city-leh-ladakh': 'Leh Ladakh',
  'city-kaziranga': 'Kaziranga National Park',
  'city-jim-corbett-national-park': 'Jim Corbett National Park',
  'city-andaman': 'Port Blair & Andaman Islands',
  'city-delhi': 'Delhi'
};

// Reassign places from source_city_id to target_city_id
places.forEach(p => {
  if (CITY_MERGE_MAP[p.city_id]) {
    p.city_id = CITY_MERGE_MAP[p.city_id];
  }
});

// Remove merged source cities
const citiesToRemove = new Set(Object.keys(CITY_MERGE_MAP));
cities = cities.filter(c => !citiesToRemove.has(c.id));

// Update city names for canonical cities
cities.forEach(c => {
  if (CITY_NAME_UPDATES[c.id]) {
    c.name = CITY_NAME_UPDATES[c.id];
  }
});

console.log(`After merging duplicate cities: ${cities.length} Cities left.`);

// ─── 2. DEDUPLICATE PLACES WITHIN CITIES ─────────────────────────────────────
const uniquePlacesMap = new Map();
let removedDuplicatePlaces = 0;

places.forEach(p => {
  const normName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `${normName}__${p.city_id}`;
  if (!uniquePlacesMap.has(key)) {
    uniquePlacesMap.set(key, p);
  } else {
    removedDuplicatePlaces++;
    // Keep the record with longer description or higher ratings
    const existing = uniquePlacesMap.get(key);
    if ((p.description && p.description.length > (existing.description || '').length) || (p.review_count > existing.review_count)) {
      uniquePlacesMap.set(key, p);
    }
  }
});

places = Array.from(uniquePlacesMap.values());
console.log(`Deduplicated ${removedDuplicatePlaces} duplicate place records. Total places: ${places.length}`);

// ─── 3. ADD THENI DISTRICT (TAMIL NADU) AND ITS TOURIST PLACES ───────────────
const theniCityId = 'city-theni';
const theniCityExists = cities.some(c => c.id === theniCityId);

if (!theniCityExists) {
  const theniCity = {
    id: theniCityId,
    state_id: 'state-tamil-nadu',
    name: 'Theni',
    slug: 'theni',
    description: 'A picturesque agricultural and hill district in Tamil Nadu, nestled at the foot of the Western Ghats, renowned for waterfalls, cardamom plantations, and lush valleys.',
    cover_image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    latitude: 10.0104,
    longitude: 77.4768,
    best_season: 'October-March',
    avg_temp_celsius: 25,
    is_featured: true,
    is_trending: true,
    tags: ['waterfalls', 'hills', 'nature', 'tea_estates']
  };
  cities.push(theniCity);
  console.log('✓ Added city "Theni" under state "Tamil Nadu".');
}

const theniPlaces = [
  {
    id: 'place-suruli-falls-theni',
    city_id: theniCityId,
    name: 'Suruli Falls',
    slug: 'suruli-falls',
    description: 'Suruli Falls is a famous 2-stage cascading waterfall dropping 56 metres in Theni district. Originating from the Meghamalai range, its waters are believed to possess natural medicinal properties.',
    category: 'waterfall',
    sub_category: 'Waterfall',
    cover_image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800',
    images: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800'],
    latitude: 9.6644,
    longitude: 77.2662,
    address: 'Suruli Falls, Cumbum Highway, Theni District, Tamil Nadu',
    opening_time: '07:00 AM',
    closing_time: '05:00 PM',
    entry_fee: 20,
    entry_fee_currency: 'INR',
    avg_visit_duration: 120,
    crowd_level: 'moderate',
    safety_rating: 4.6,
    avg_rating: 4.6,
    review_count: 6800,
    best_time_to_visit: 'June to October',
    tags: ['waterfall', 'theni', 'nature'],
    is_hidden_gem: false,
    is_featured: true
  },
  {
    id: 'place-meghamalai-theni',
    city_id: theniCityId,
    name: 'Meghamalai (Highwavys Range)',
    slug: 'meghamalai',
    description: 'Often called Paccha Kumachi (Green Peaks), Meghamalai is a misty hill station at 1500m elevation, famous for tea plantations, cardamom estates, wild elephants, and serene mountain lakes.',
    category: 'hill_station',
    sub_category: 'Hill Station',
    cover_image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    images: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800'],
    latitude: 9.6974,
    longitude: 77.3975,
    address: 'Meghamalai Hills, Theni District, Tamil Nadu',
    opening_time: '06:00 AM',
    closing_time: '06:00 PM',
    entry_fee: 0,
    entry_fee_currency: 'INR',
    avg_visit_duration: 240,
    crowd_level: 'low',
    safety_rating: 4.7,
    avg_rating: 4.7,
    review_count: 8200,
    best_time_to_visit: 'October to May',
    tags: ['hills', 'tea_estates', 'theni', 'hidden_gem'],
    is_hidden_gem: true,
    is_featured: true
  },
  {
    id: 'place-kumbakkarai-falls-theni',
    city_id: theniCityId,
    name: 'Kumbakkarai Waterfalls',
    slug: 'kumbakkarai-waterfalls',
    description: 'Located at the foothills of the Kodaikanal Hills near Periyakulam, Kumbakkarai is a natural two-stage waterfall fed by the Pambar River with crystal clear mountain rock pools.',
    category: 'waterfall',
    sub_category: 'Waterfall',
    cover_image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
    images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],
    latitude: 10.1802,
    longitude: 77.5303,
    address: 'Kumbakkarai Falls, Periyakulam, Theni District, Tamil Nadu',
    opening_time: '08:00 AM',
    closing_time: '04:00 PM',
    entry_fee: 15,
    entry_fee_currency: 'INR',
    avg_visit_duration: 90,
    crowd_level: 'moderate',
    safety_rating: 4.5,
    avg_rating: 4.5,
    review_count: 4500,
    best_time_to_visit: 'July to December',
    tags: ['waterfall', 'theni', 'nature'],
    is_hidden_gem: false,
    is_featured: true
  },
  {
    id: 'place-vaigai-dam-theni',
    city_id: theniCityId,
    name: 'Vaigai Dam & Garden',
    slug: 'vaigai-dam',
    description: 'A major reservoir dam built across the Vaigai River near Andipatti. Features the Little Brindavan landscaped park, children playground, and scenic views over the Vaigai basin.',
    category: 'nature',
    sub_category: 'Dam & Park',
    cover_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'],
    latitude: 10.0543,
    longitude: 77.5878,
    address: 'Vaigai Dam, Andipatti Taluk, Theni District, Tamil Nadu',
    opening_time: '06:00 AM',
    closing_time: '06:00 PM',
    entry_fee: 10,
    entry_fee_currency: 'INR',
    avg_visit_duration: 120,
    crowd_level: 'moderate',
    safety_rating: 4.4,
    avg_rating: 4.4,
    review_count: 5400,
    best_time_to_visit: 'September to March',
    tags: ['dam', 'park', 'theni', 'family'],
    is_hidden_gem: false,
    is_featured: true
  },
  {
    id: 'place-kurangani-hills-theni',
    city_id: theniCityId,
    name: 'Kurangani Hills & Trek',
    slug: 'kurangani-hills',
    description: 'A serene mountain ridge near Bodinayakanur famous for high-altitude trekking routes, cardamom plantations, shola forests, and spectacular views towards Kolukkumalai.',
    category: 'adventure',
    sub_category: 'Trekking & Hills',
    cover_image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    images: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'],
    latitude: 10.0833,
    longitude: 77.2667,
    address: 'Kurangani Hills, Bodinayakanur, Theni District, Tamil Nadu',
    opening_time: '06:00 AM',
    closing_time: '05:00 PM',
    entry_fee: 0,
    entry_fee_currency: 'INR',
    avg_visit_duration: 180,
    crowd_level: 'low',
    safety_rating: 4.6,
    avg_rating: 4.6,
    review_count: 3200,
    best_time_to_visit: 'November to March',
    tags: ['trekking', 'adventure', 'theni'],
    is_hidden_gem: true,
    is_featured: true
  },
  {
    id: 'place-chinna-suruli-falls-theni',
    city_id: theniCityId,
    name: 'Chinna Suruli Falls (Cloudland Falls)',
    slug: 'chinna-suruli-falls',
    description: 'A secluded waterfall surrounded by dense evergreen forests near Kombaithozhu village, fed by natural streams flowing down from Meghamalai mountain peaks.',
    category: 'waterfall',
    sub_category: 'Waterfall',
    cover_image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800',
    images: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800'],
    latitude: 9.7123,
    longitude: 77.3456,
    address: 'Chinna Suruli, Kombaithozhu, Theni District, Tamil Nadu',
    opening_time: '08:00 AM',
    closing_time: '04:00 PM',
    entry_fee: 10,
    entry_fee_currency: 'INR',
    avg_visit_duration: 90,
    crowd_level: 'low',
    safety_rating: 4.4,
    avg_rating: 4.4,
    review_count: 1900,
    best_time_to_visit: 'October to February',
    tags: ['waterfall', 'theni', 'nature'],
    is_hidden_gem: true,
    is_featured: false
  },
  {
    id: 'place-bodinayakanur-theni',
    city_id: theniCityId,
    name: 'Bodinayakanur (Cardamom Hills)',
    slug: 'bodinayakanur',
    description: 'Known as the Cardamom Capital of India, Bodinayakanur is a hill town surrounded by the Western Ghats with vast spice markets, cardamom auctions, and mountain pass drives.',
    category: 'hill_station',
    sub_category: 'Spice Town',
    cover_image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    images: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800'],
    latitude: 10.0104,
    longitude: 77.3486,
    address: 'Bodinayakanur, Theni District, Tamil Nadu',
    opening_time: '08:00 AM',
    closing_time: '07:00 PM',
    entry_fee: 0,
    entry_fee_currency: 'INR',
    avg_visit_duration: 120,
    crowd_level: 'moderate',
    safety_rating: 4.5,
    avg_rating: 4.5,
    review_count: 2800,
    best_time_to_visit: 'September to March',
    tags: ['spices', 'hills', 'theni'],
    is_hidden_gem: false,
    is_featured: true
  },
  {
    id: 'place-kuchanur-saneeswaran-temple-theni',
    city_id: theniCityId,
    name: 'Kuchanur Saneeswaran Temple',
    slug: 'kuchanur-saneeswaran-temple',
    description: 'An ancient, renowned temple in Theni district dedicated exclusively to Lord Saneeswara (Saturn), featuring a self-manifested (Swayambu) deity situated on the Surabhi riverbank.',
    category: 'spiritual',
    sub_category: 'Temple',
    cover_image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
    images: ['https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800'],
    latitude: 9.9833,
    longitude: 77.3667,
    address: 'Kuchanur, Main Road, Theni District, Tamil Nadu',
    opening_time: '06:00 AM',
    closing_time: '08:00 PM',
    entry_fee: 0,
    entry_fee_currency: 'INR',
    avg_visit_duration: 60,
    crowd_level: 'moderate',
    safety_rating: 4.7,
    avg_rating: 4.7,
    review_count: 6100,
    best_time_to_visit: 'All Year',
    tags: ['temple', 'spiritual', 'theni'],
    is_hidden_gem: false,
    is_featured: true
  },
  {
    id: 'place-sothuparai-dam-theni',
    city_id: theniCityId,
    name: 'Sothuparai Dam',
    slug: 'sothuparai-dam',
    description: 'A tranquil dam constructed across the Varahanadhi river near Periyakulam at the foot of Kodaikanal hills, known for peaceful atmosphere, mango gardens, and mountain views.',
    category: 'nature',
    sub_category: 'Dam',
    cover_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'],
    latitude: 10.1333,
    longitude: 77.4667,
    address: 'Sothuparai Dam Road, Periyakulam, Theni District, Tamil Nadu',
    opening_time: '08:00 AM',
    closing_time: '05:00 PM',
    entry_fee: 10,
    entry_fee_currency: 'INR',
    avg_visit_duration: 60,
    crowd_level: 'low',
    safety_rating: 4.5,
    avg_rating: 4.5,
    review_count: 2400,
    best_time_to_visit: 'October to March',
    tags: ['dam', 'nature', 'theni'],
    is_hidden_gem: true,
    is_featured: false
  },
  {
    id: 'place-veerapandi-gowmariamman-temple-theni',
    city_id: theniCityId,
    name: 'Veerapandi Gowmariamman Temple',
    slug: 'veerapandi-gowmariamman-temple',
    description: 'A celebrated 14th-century temple built by King Veerapandi on the banks of the Muller river in Theni district, renowned for its Chithirai festival and sacred river ghats.',
    category: 'spiritual',
    sub_category: 'Temple',
    cover_image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
    images: ['https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800'],
    latitude: 9.9667,
    longitude: 77.4333,
    address: 'Veerapandi, Muller Riverbank, Theni District, Tamil Nadu',
    opening_time: '06:00 AM',
    closing_time: '08:00 PM',
    entry_fee: 0,
    entry_fee_currency: 'INR',
    avg_visit_duration: 60,
    crowd_level: 'moderate',
    safety_rating: 4.6,
    avg_rating: 4.6,
    review_count: 4900,
    best_time_to_visit: 'All Year',
    tags: ['temple', 'spiritual', 'theni'],
    is_hidden_gem: false,
    is_featured: true
  }
];

// Insert places for Theni
theniPlaces.forEach(tp => {
  if (!places.some(p => p.id === tp.id)) {
    places.push(tp);
  }
});

console.log(`✓ Added ${theniPlaces.length} tourist places for Theni District.`);

// ─── 4. WRITE UPDATED FILE ───────────────────────────────────────────────────
const codeContent = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/cleanAndEnrichDataset.js — DO NOT EDIT MANUALLY
// ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════════════════════════════

import type { State, City, Place } from '../types';

export const generatedStates: State[] = ${JSON.stringify(states, null, 2)};

export const generatedCities: City[] = ${JSON.stringify(cities, null, 2)};

export const generatedPlaces: Place[] = ${JSON.stringify(places, null, 2)};

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
  "Ahmedabad": { airport: "Sardar Vallabhbhai Patel International Airport (AMD)", railway: "Ahmedabad Junction (ADI)", bus: "GSRTC Geeta Mandir Bus Station" },
  "Theni": { airport: "Madurai International Airport (IXM - 85 km)", railway: "Theni Railway Station (TNI)", bus: "Theni Central Bus Stand" }
};
`;

fs.writeFileSync(generatedDataPath, codeContent, 'utf8');
console.log(`\nSuccessfully updated ${generatedDataPath} (${(codeContent.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Final Totals: ${states.length} States, ${cities.length} Cities, ${places.length} Places.`);
