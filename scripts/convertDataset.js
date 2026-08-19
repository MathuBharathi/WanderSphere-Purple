/**
 * WanderSphere — Dataset Converter
 * 
 * Reads DATASET_1/City.csv, DATASET_1/Places.csv, DATASET_2/Expanded_Indian_Travel_Dataset.csv
 * and generates src/data/generatedData.ts with all States, Cities, and Places.
 */

const fs = require('fs');
const path = require('path');

// ─── CSV Parser (simple, handles quoted fields) ───────────────────────────────
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

// ─── City to State Mapping ────────────────────────────────────────────────────
const CITY_STATE_MAP = {
  'Manali': 'Himachal Pradesh',
  'Leh Ladakh': 'Ladakh',
  'Coorg': 'Karnataka',
  'Andaman': 'Andaman & Nicobar',
  'Lakshadweep': 'Lakshadweep',
  'Goa': 'Goa',
  'Udaipur': 'Rajasthan',
  'Srinagar': 'Jammu & Kashmir',
  'Gangtok': 'Sikkim',
  'Munnar': 'Kerala',
  'Varkala': 'Kerala',
  'Mcleodganj': 'Himachal Pradesh',
  'Rishikesh': 'Uttarakhand',
  'Alleppey': 'Kerala',
  'Darjeeling': 'West Bengal',
  'Nainital': 'Uttarakhand',
  'Shimla': 'Himachal Pradesh',
  'Ooty': 'Tamil Nadu',
  'Jaipur': 'Rajasthan',
  'Lonavala': 'Maharashtra',
  'Mussoorie': 'Uttarakhand',
  'Kodaikanal': 'Tamil Nadu',
  'Dalhousie': 'Himachal Pradesh',
  'Pachmarhi': 'Madhya Pradesh',
  'Varanasi': 'Uttar Pradesh',
  'Mumbai': 'Maharashtra',
  'Agra': 'Uttar Pradesh',
  'Kolkata': 'West Bengal',
  'Jodhpur': 'Rajasthan',
  'Bangalore': 'Karnataka',
  'Amritsar': 'Punjab',
  'Delhi': 'Delhi',
  'Jaisalmer': 'Rajasthan',
  'Mount Abu': 'Rajasthan',
  'Wayanad': 'Kerala',
  'Hyderabad': 'Telangana',
  'Pondicherry': 'Puducherry',
  'Khajuraho': 'Madhya Pradesh',
  'Chennai': 'Tamil Nadu',
  'Vaishno Devi': 'Jammu & Kashmir',
  'Ajanta and Ellora Caves': 'Maharashtra',
  'Haridwar': 'Uttarakhand',
  'Kanyakumari': 'Tamil Nadu',
  'Pune': 'Maharashtra',
  'Kochi': 'Kerala',
  'Ahmedabad': 'Gujarat',
  'Kanha National Park': 'Madhya Pradesh',
  'Mysore': 'Karnataka',
  'Chandigarh': 'Chandigarh',
  'Hampi': 'Karnataka',
  'Gulmarg': 'Jammu & Kashmir',
  'Almora': 'Uttarakhand',
  'Shirdi': 'Maharashtra',
  'Auli': 'Uttarakhand',
  'Madurai': 'Tamil Nadu',
  'Amarnath': 'Jammu & Kashmir',
  'Bodh Gaya': 'Bihar',
  'Mahabaleshwar': 'Maharashtra',
  'Visakhapatnam': 'Andhra Pradesh',
  'Kasol': 'Himachal Pradesh',
  'Nashik': 'Maharashtra',
  'Tirupati': 'Andhra Pradesh',
  'Ujjain': 'Madhya Pradesh',
  'Jim Corbett National Park': 'Uttarakhand',
  'Gwalior': 'Madhya Pradesh',
  'Mathura': 'Uttar Pradesh',
  'Jog Falls': 'Karnataka',
  'Alibaug': 'Maharashtra',
  'Rameshwaram': 'Tamil Nadu',
  'Vrindavan': 'Uttar Pradesh',
  'Coimbatore': 'Tamil Nadu',
  'Lucknow': 'Uttar Pradesh',
  'Digha': 'West Bengal',
  'Dharamshala': 'Himachal Pradesh',
  'Kovalam': 'Kerala',
  'Kaziranga National Park': 'Assam',
  'Madikeri': 'Karnataka',
  'Matheran': 'Maharashtra',
  'Ranthambore': 'Rajasthan',
  'Agartala': 'Tripura',
  'Khandala': 'Maharashtra',
  'Kalimpong': 'West Bengal',
  'Thanjavur': 'Tamil Nadu',
  'Bhubaneswar': 'Odisha',
  'Ajmer': 'Rajasthan',
  'Aurangabad': 'Maharashtra',
  'Jammu': 'Jammu & Kashmir',
  'Dehradun': 'Uttarakhand',
  'Puri': 'Odisha',
  'Cherrapunji': 'Meghalaya',
  'Bikaner': 'Rajasthan',
  'Shimoga (Shivamogga)': 'Karnataka',
  'Hogenakkal': 'Tamil Nadu',
  'Gir National Park': 'Gujarat',
  'Kasauli': 'Himachal Pradesh',
  'Pushkar': 'Rajasthan',
  'Chittorgarh': 'Rajasthan',
  'Nahan': 'Himachal Pradesh',
  'Lavasa': 'Maharashtra',
  'Poovar': 'Kerala',
};

// ─── City Coordinates (approximate) ──────────────────────────────────────────
const CITY_COORDS = {
  'Manali': [32.2396, 77.1887],
  'Leh Ladakh': [34.1526, 77.5771],
  'Coorg': [12.4244, 75.7382],
  'Andaman': [11.7401, 92.6586],
  'Lakshadweep': [10.5667, 72.6417],
  'Goa': [15.2993, 74.124],
  'Udaipur': [24.5854, 73.7125],
  'Srinagar': [34.0837, 74.7973],
  'Gangtok': [27.3389, 88.6065],
  'Munnar': [10.0889, 77.0595],
  'Varkala': [8.7379, 76.7163],
  'Mcleodganj': [32.2426, 76.3213],
  'Rishikesh': [30.0869, 78.2676],
  'Alleppey': [9.4981, 76.3388],
  'Darjeeling': [27.0360, 88.2627],
  'Nainital': [29.3803, 79.4636],
  'Shimla': [31.1048, 77.1734],
  'Ooty': [11.4102, 76.695],
  'Jaipur': [26.9124, 75.7873],
  'Lonavala': [18.7546, 73.4062],
  'Mussoorie': [30.4598, 78.0644],
  'Kodaikanal': [10.2381, 77.4892],
  'Dalhousie': [32.5387, 75.9709],
  'Pachmarhi': [22.4675, 78.4305],
  'Varanasi': [25.3176, 82.9739],
  'Mumbai': [19.076, 72.8777],
  'Agra': [27.1767, 78.0081],
  'Kolkata': [22.5726, 88.3639],
  'Jodhpur': [26.2389, 73.0243],
  'Bangalore': [12.9716, 77.5946],
  'Amritsar': [31.634, 74.8723],
  'Delhi': [28.7041, 77.1025],
  'Jaisalmer': [26.9157, 70.9083],
  'Mount Abu': [24.5926, 72.7156],
  'Wayanad': [11.6854, 76.132],
  'Hyderabad': [17.385, 78.4867],
  'Pondicherry': [11.9416, 79.8083],
  'Khajuraho': [24.8318, 79.9199],
  'Chennai': [13.0827, 80.2707],
  'Vaishno Devi': [33.0308, 74.949],
  'Ajanta and Ellora Caves': [20.5519, 75.7033],
  'Haridwar': [29.9457, 78.1642],
  'Kanyakumari': [8.0883, 77.5385],
  'Pune': [18.5204, 73.8567],
  'Kochi': [9.9312, 76.2673],
  'Ahmedabad': [23.0225, 72.5714],
  'Kanha National Park': [22.335, 80.6115],
  'Mysore': [12.2958, 76.6394],
  'Chandigarh': [30.7333, 76.7794],
  'Hampi': [15.335, 76.46],
  'Gulmarg': [34.0484, 74.3805],
  'Almora': [29.5971, 79.6591],
  'Shirdi': [19.7515, 74.4771],
  'Auli': [30.5286, 79.5674],
  'Madurai': [9.9252, 78.1198],
  'Amarnath': [34.2153, 75.5008],
  'Bodh Gaya': [24.6961, 84.9869],
  'Mahabaleshwar': [17.9307, 73.6477],
  'Visakhapatnam': [17.6868, 83.2185],
  'Kasol': [32.0098, 77.3142],
  'Nashik': [19.9975, 73.7898],
  'Tirupati': [13.6288, 79.4192],
  'Ujjain': [23.1793, 75.7849],
  'Jim Corbett National Park': [29.53, 78.776],
  'Gwalior': [26.2183, 78.1828],
  'Mathura': [27.4924, 77.6737],
  'Jog Falls': [14.2295, 74.8126],
  'Alibaug': [18.6414, 72.8722],
  'Rameshwaram': [9.2876, 79.3129],
  'Vrindavan': [27.5946, 77.7019],
  'Coimbatore': [11.0168, 76.9558],
  'Lucknow': [26.8467, 80.9462],
  'Digha': [21.6273, 87.5075],
  'Dharamshala': [32.219, 76.3234],
  'Kovalam': [8.3988, 76.9784],
  'Kaziranga National Park': [26.5775, 93.1711],
  'Madikeri': [12.4244, 75.7382],
  'Matheran': [18.9862, 73.2712],
  'Ranthambore': [26.0173, 76.5026],
  'Agartala': [23.8315, 91.2868],
  'Khandala': [18.7557, 73.3719],
  'Kalimpong': [27.066, 88.4696],
  'Thanjavur': [10.787, 79.1378],
  'Bhubaneswar': [20.2961, 85.8245],
  'Ajmer': [26.4499, 74.6399],
  'Aurangabad': [19.8762, 75.3433],
  'Jammu': [32.7266, 74.857],
  'Dehradun': [30.3165, 78.0322],
  'Puri': [19.7983, 85.8249],
  'Cherrapunji': [25.2707, 91.7322],
  'Bikaner': [28.0229, 73.3119],
  'Shimoga (Shivamogga)': [13.9299, 75.568],
  'Hogenakkal': [12.1155, 77.777],
  'Gir National Park': [21.1243, 70.8242],
  'Kasauli': [30.8985, 76.9657],
  'Pushkar': [26.4897, 74.5511],
  'Chittorgarh': [24.8887, 74.6269],
  'Nahan': [30.5596, 77.2960],
  'Lavasa': [18.4050, 73.5070],
  'Poovar': [8.3157, 77.0662],
};

// ─── State metadata ──────────────────────────────────────────────────────────
const STATE_META = {
  'Himachal Pradesh': { code: 'HP', desc: 'The Land of Gods — snow-capped Himalayas, apple orchards, and ancient temples nestled in pristine valleys.' },
  'Ladakh': { code: 'LA', desc: 'The roof of India — dramatic moonscapes, turquoise lakes, and Buddhist monasteries in the world\'s coldest desert.' },
  'Karnataka': { code: 'KA', desc: 'Silicon Valley of India meets ancient heritage — from Hampi ruins to Coorg coffee plantations and coastal temples.' },
  'Andaman & Nicobar': { code: 'AN', desc: 'A tropical paradise with turquoise waters, coral reefs, and white sandy beaches far from the mainland.' },
  'Lakshadweep': { code: 'LD', desc: 'India\'s smallest Union Territory — pristine coral atolls, crystal lagoons, and untouched marine ecosystems.' },
  'Goa': { code: 'GA', desc: 'India\'s beach capital — Portuguese heritage, vibrant nightlife, spice plantations, and golden coastline.' },
  'Rajasthan': { code: 'RJ', desc: 'Land of Kings — majestic forts, golden deserts, vibrant culture, and opulent palaces from a royal era.' },
  'Jammu & Kashmir': { code: 'JK', desc: 'Paradise on Earth — Dal Lake houseboats, Mughal gardens, snow-clad peaks, and the sacred Vaishno Devi shrine.' },
  'Sikkim': { code: 'SK', desc: 'The hidden Himalayan gem — rhododendron valleys, Buddhist monasteries, and views of Kanchenjunga.' },
  'Kerala': { code: 'KL', desc: 'God\'s Own Country — tranquil backwaters, Ayurveda traditions, tea hills, and pristine Malabar coast.' },
  'Uttarakhand': { code: 'UK', desc: 'Devbhoomi — the Land of Gods — Himalayan pilgrimages, river adventures, and tiger reserves in pristine forests.' },
  'Tamil Nadu': { code: 'TN', desc: 'Land of temples, classical arts, and a rich Dravidian heritage along the Bay of Bengal coast.' },
  'Maharashtra': { code: 'MH', desc: 'From Mumbai\'s skyline to the ancient caves of Ajanta — forts, beaches, hill stations, and Bollywood magic.' },
  'Uttar Pradesh': { code: 'UP', desc: 'The heartland of Indian civilization — Taj Mahal, holy Varanasi ghats, and the birthplace of Lord Krishna.' },
  'West Bengal': { code: 'WB', desc: 'Cultural capital of India — colonial Kolkata, Darjeeling tea gardens, Sundarbans mangroves, and Tagore\'s legacy.' },
  'Punjab': { code: 'PB', desc: 'Land of five rivers — the Golden Temple, vibrant Bhangra culture, rich cuisine, and warm Punjabi hospitality.' },
  'Telangana': { code: 'TS', desc: 'The city of pearls and beyond — Charminar, Golconda Fort, and the bustling IT hub of Hyderabad.' },
  'Madhya Pradesh': { code: 'MP', desc: 'The Heart of India — Khajuraho temples, tiger safaris, Sanchi Stupa, and the holy city of Ujjain.' },
  'Gujarat': { code: 'GJ', desc: 'Land of legends — Asiatic lions of Gir, the white desert of Kutch, and Mahatma Gandhi\'s Sabarmati Ashram.' },
  'Andhra Pradesh': { code: 'AP', desc: 'The Kohinoor State — sacred Tirupati hills, Araku Valley coffee, and stunning Visakhapatnam coastline.' },
  'Odisha': { code: 'OD', desc: 'The Soul of India — Konark Sun Temple, Jagannath Puri, pristine Chilika Lake, and tribal heritage.' },
  'Assam': { code: 'AS', desc: 'Gateway to Northeast India — one-horned rhinos of Kaziranga, tea gardens, and Brahmaputra river cruises.' },
  'Meghalaya': { code: 'ML', desc: 'Abode of Clouds — living root bridges, the wettest place on earth, and crystal-clear rivers in deep canyons.' },
  'Bihar': { code: 'BR', desc: 'The cradle of civilization — Bodh Gaya where Buddha attained enlightenment, Nalanda university ruins, and Rajgir.' },
  'Puducherry': { code: 'PY', desc: 'A French colonial gem on the Coromandel Coast — pastel heritage streets, Auroville, and serene beaches.' },
  'Chandigarh': { code: 'CH', desc: 'Le Corbusier\'s modernist masterpiece — Rock Garden, Sukhna Lake, and India\'s best-planned city.' },
  'Tripura': { code: 'TR', desc: 'The jewel of Northeast — Ujjayanta Palace, Neermahal water palace, and lush bamboo forests.' },
  'Delhi': { code: 'DL', desc: 'India\'s capital — a vibrant tapestry of Mughal monuments, bustling bazaars, street food paradise, and modern marvels.' },
};

// ─── Unsplash cover images by state ──────────────────────────────────────────
const STATE_IMAGES = {
  'Himachal Pradesh': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  'Ladakh': 'https://images.unsplash.com/photo-1626015365107-7d5e5e6b2445?w=800',
  'Karnataka': 'https://images.unsplash.com/photo-1600100397608-e4b1373030a8?w=800',
  'Andaman & Nicobar': 'https://images.unsplash.com/photo-1589179899502-29d1047c0868?w=800',
  'Lakshadweep': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
  'Rajasthan': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800',
  'Jammu & Kashmir': 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800',
  'Sikkim': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  'Kerala': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
  'Uttarakhand': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  'Tamil Nadu': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  'Maharashtra': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800',
  'Uttar Pradesh': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
  'West Bengal': 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800',
  'Punjab': 'https://images.unsplash.com/photo-1609947017136-9dbb545271c2?w=800',
  'Telangana': 'https://images.unsplash.com/photo-1572638319457-3a26c0dab84a?w=800',
  'Madhya Pradesh': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
  'Gujarat': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800',
  'Andhra Pradesh': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800',
  'Odisha': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800',
  'Assam': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  'Meghalaya': 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800',
  'Bihar': 'https://images.unsplash.com/photo-1591018653367-4e9dc40dce49?w=800',
  'Puducherry': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  'Chandigarh': 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800',
  'Tripura': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
};

// ─── Category inference from place description/name ──────────────────────────
function inferCategory(placeName, placeDesc) {
  const text = (placeName + ' ' + placeDesc).toLowerCase();
  if (/temple|mandir|kovil|shrine|gurudwara|church|mosque|basilica|dargah|jyotirlinga|stupa/i.test(text)) return 'spiritual';
  if (/fort|palace|mahal|museum|haveli|monument|tomb|ruins|archaeological|heritage/i.test(text)) return 'historical';
  if (/beach|sea|coast|shore|island|lagoon|marine/i.test(text)) return 'beach';
  if (/waterfall|falls|cascade/i.test(text)) return 'waterfall';
  if (/lake|dam|reservoir|backwater/i.test(text)) return 'nature';
  if (/trek|rafting|paraglid|bungee|adventure|skiing|camp|safari|zip.?line|kayak|surf/i.test(text)) return 'adventure';
  if (/national.?park|wildlife|sanctuary|tiger|rhino|elephant|bird/i.test(text)) return 'wildlife';
  if (/market|bazaar|shop|mall|handicraft/i.test(text)) return 'shopping';
  if (/food|cuisine|restaurant|cafe|eat|culinary|street.?food/i.test(text)) return 'food';
  if (/garden|park|botanical|flower/i.test(text)) return 'park';
  if (/hill|valley|peak|mountain|viewpoint|ghats|pass/i.test(text)) return 'nature';
  if (/art|gallery|craft|culture|festival|dance|music/i.test(text)) return 'cultural';
  if (/architecture|bridge|tower|gate|minaret|dome/i.test(text)) return 'architecture';
  if (/river|gorge|canyon|cave|rock/i.test(text)) return 'nature';
  return 'nature';
}

// ─── Generate tags from description ──────────────────────────────────────────
function inferTags(placeName, placeDesc, category) {
  const tags = [category];
  const text = (placeName + ' ' + placeDesc).toLowerCase();
  
  const tagPatterns = [
    [/sunset/i, 'sunset'], [/sunrise/i, 'sunrise'],
    [/trek/i, 'trekking'], [/photography|scenic|panoram/i, 'photography'],
    [/heritage|UNESCO/i, 'heritage'], [/spiritual|holy|sacred|prayer/i, 'spiritual'],
    [/food|cuisine|culinary/i, 'food'], [/boating|boat/i, 'boating'],
    [/historic|ancient|old|colonial/i, 'history'],
    [/romantic|couple/i, 'romantic'], [/family/i, 'family friendly'],
    [/free|no.?entry/i, 'free entry'], [/garden|flower/i, 'garden'],
    [/meditation|yoga|ashram/i, 'meditation'],
    [/wildlife|tiger|bird|elephant/i, 'wildlife'],
    [/adventure|thrill/i, 'adventure'], [/nature|natural/i, 'nature'],
    [/shopping|market|bazaar/i, 'shopping'],
  ];
  
  for (const [pattern, tag] of tagPatterns) {
    if (pattern.test(text) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags.slice(0, 5);
}

// ─── Clean up description text ───────────────────────────────────────────────
function cleanDescription(desc) {
  if (!desc) return '';
  // Remove list brackets and quotes
  let cleaned = desc.replace(/^\[["']?\s*/, '').replace(/\s*["']?\]$/, '');
  // Remove inner quote delimiters
  cleaned = cleaned.replace(/["']\s*,\s*["']/g, ' ');
  // Remove excessive quotes
  cleaned = cleaned.replace(/['"]{2,}/g, '');
  // Remove leading/trailing quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Take only the first meaningful paragraph (up to ~300 chars)
  if (cleaned.length > 350) {
    const sentences = cleaned.split(/\.\s+/);
    let result = '';
    for (const s of sentences) {
      if ((result + s).length > 300) break;
      result += s + '. ';
    }
    cleaned = result.trim() || cleaned.substring(0, 300) + '...';
  }
  return cleaned;
}

// ─── Clean place name (remove numbering) ─────────────────────────────────────
function cleanPlaceName(name) {
  // Remove leading "1. " or "2. " etc.
  return name.replace(/^\s*\d+\.\s*/, '').trim();
}

// ─── Parse distance ──────────────────────────────────────────────────────────
function parseDistance(distStr) {
  if (!distStr) return 0;
  const match = distStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// ─── Unsplash fallback images by category ────────────────────────────────────
const CATEGORY_IMAGES = {
  'spiritual': 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=800',
  'historical': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
  'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'nature': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'adventure': 'https://images.unsplash.com/photo-1502680390548-bdbac40e4ce3?w=800',
  'wildlife': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  'food': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800',
  'cultural': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
  'park': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
  'shopping': 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800',
  'waterfall': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'architecture': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
  'museum': 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
function main() {
  const rootDir = path.resolve(__dirname, '..');
  
  // Read CSVs
  const cityCsvPath = path.join(rootDir, 'DATASET', 'DATASET_1', 'City.csv');
  const placesCsvPath = path.join(rootDir, 'DATASET', 'DATASET_1', 'Places.csv');
  const dataset2CsvPath = path.join(rootDir, 'DATASET', 'DATASET_2', 'Expanded_Indian_Travel_Dataset.csv');
  
  console.log('Reading City.csv...');
  const cityRows = parseCSV(fs.readFileSync(cityCsvPath, 'utf8'));
  console.log(`  Found ${cityRows.length} cities`);
  
  console.log('Reading Places.csv...');
  const placeRows = parseCSV(fs.readFileSync(placesCsvPath, 'utf8'));
  console.log(`  Found ${placeRows.length} places`);
  
  console.log('Reading Dataset 2...');
  const dataset2Rows = parseCSV(fs.readFileSync(dataset2CsvPath, 'utf8'));
  console.log(`  Found ${dataset2Rows.length} entries`);
  
  // Build Dataset 2 lookup (unique entries only)
  const transportMap = {};
  const seenDs2 = new Set();
  for (const row of dataset2Rows) {
    const key = row['Destination Name'] || row['Destination_Name'];
    if (!key || seenDs2.has(key)) continue;
    seenDs2.add(key);
    transportMap[key] = {
      category: row['Category'] || '',
      accessibility: row['Accessibility'] || '',
      nearestAirport: row['Nearest Airport'] || row['Nearest_Airport'] || '',
      nearestRailway: row['Nearest Railway Station'] || row['Nearest_Railway_Station'] || '',
    };
  }
  
  // ─── Build States ─────────────────────────────────────────────────────────
  const stateSet = new Set();
  for (const city of cityRows) {
    const stateName = CITY_STATE_MAP[city.City];
    if (stateName) stateSet.add(stateName);
  }
  
  const statesArr = [];
  for (const name of [...stateSet].sort()) {
    const meta = STATE_META[name] || { code: name.substring(0, 2).toUpperCase(), desc: `Explore the beautiful destinations of ${name}.` };
    const slug = name.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-');
    statesArr.push({
      id: `state-${slug}`,
      name,
      code: meta.code,
      slug,
      description: meta.desc,
      cover_image: STATE_IMAGES[name] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
    });
  }
  
  console.log(`Generated ${statesArr.length} states`);
  
  // ─── Build Cities ─────────────────────────────────────────────────────────
  const citiesArr = [];
  const cityIdMap = {}; // cityName -> cityId
  
  for (const row of cityRows) {
    const cityName = row.City;
    if (!cityName) continue;
    
    const stateName = CITY_STATE_MAP[cityName];
    if (!stateName) {
      console.warn(`  WARN: No state mapping for city "${cityName}"`);
      continue;
    }
    
    const stateSlug = stateName.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-');
    const stateId = `state-${stateSlug}`;
    const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
    const cityId = `city-${citySlug}`;
    cityIdMap[cityName] = cityId;
    
    const coords = CITY_COORDS[cityName] || [20.5, 78.9];
    const rating = parseFloat(row.Ratings) || 4.0;
    const desc = cleanDescription(row.City_desc);
    const idealDuration = row.Ideal_duration || '2-3';
    const bestTime = row.Best_time_to_visit || '';
    
    // Transport info from dataset 2
    const transport = transportMap[cityName] || {};
    
    // Determine tags from category
    const tags = [];
    if (transport.category) tags.push(transport.category.toLowerCase());
    if (/hill|mountain|valley/i.test(desc)) tags.push('hills');
    if (/beach|coast|sea/i.test(desc)) tags.push('beach');
    if (/temple|spiritual/i.test(desc)) tags.push('temples');
    if (/adventure|trek|raft/i.test(desc)) tags.push('adventure');
    if (/nature|forest|wildlife/i.test(desc)) tags.push('nature');
    if (/food|cuisine/i.test(desc)) tags.push('food');
    if (/history|heritage|fort|palace/i.test(desc)) tags.push('history');
    if (/culture/i.test(desc)) tags.push('culture');
    
    const isFeatured = rating >= 4.4;
    const isTrending = rating >= 4.5;
    
    // Determine avg temp from description context
    let avgTemp = 25;
    if (/hill|mountain|cold|snow|chilly/i.test(desc)) avgTemp = 15;
    else if (/desert|hot|arid/i.test(desc)) avgTemp = 35;
    else if (/tropical|humid|coastal/i.test(desc)) avgTemp = 30;
    
    citiesArr.push({
      id: cityId,
      state_id: stateId,
      name: cityName,
      latitude: coords[0],
      longitude: coords[1],
      is_featured: isFeatured,
      is_trending: isTrending,
      tags: [...new Set(tags)].slice(0, 5),
      description: desc || `Explore the wonderful city of ${cityName} in ${stateName}.`,
      cover_image: STATE_IMAGES[stateName] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
      best_season: bestTime,
      avg_temp_celsius: avgTemp,
      ideal_duration: idealDuration,
      nearest_airport: transport.nearestAirport || '',
      nearest_railway: transport.nearestRailway || '',
      accessibility: transport.accessibility || '',
    });
  }
  
  console.log(`Generated ${citiesArr.length} cities`);
  
  // ─── Build Places ─────────────────────────────────────────────────────────
  const placesArr = [];
  
  for (const row of placeRows) {
    const cityName = row.City;
    if (!cityName) continue;
    
    const cityId = cityIdMap[cityName];
    if (!cityId) continue;
    
    const rawName = cleanPlaceName(row.Place || '');
    if (!rawName) continue;
    
    const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
    const placeId = `place-${slug}-${cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    
    const rating = parseFloat(row.Ratings) || 4.0;
    const desc = cleanDescription(row.Place_desc);
    const distanceKm = parseDistance(row.Distance);
    const category = inferCategory(rawName, desc);
    const tags = inferTags(rawName, desc, category);
    
    // Get city coords and offset slightly for place
    const cityCoords = CITY_COORDS[cityName] || [20.5, 78.9];
    // Random offset within ~distance km (converted to degrees: ~0.01 per km)
    const latOffset = (Math.random() - 0.5) * distanceKm * 0.018;
    const lngOffset = (Math.random() - 0.5) * distanceKm * 0.018;
    
    const isHiddenGem = rating < 4.0 || /hidden|offbeat|lesser.?known|secluded|secret/i.test(desc);
    const isFeatured = rating >= 4.5;
    
    // Estimate visit duration
    let avgDuration = 90;
    if (/museum|gallery|fort|palace/i.test(rawName)) avgDuration = 120;
    if (/trek|hike|safari/i.test(rawName)) avgDuration = 180;
    if (/temple|shrine/i.test(rawName)) avgDuration = 60;
    if (/beach/i.test(rawName)) avgDuration = 120;
    if (/market|bazaar/i.test(rawName)) avgDuration = 90;
    if (/viewpoint|sunset|sunrise/i.test(rawName)) avgDuration = 45;
    
    // Estimate entry fee
    let entryFee = 0;
    if (/museum|fort|palace|monument|park|garden|zoo/i.test(rawName)) entryFee = Math.floor(Math.random() * 5) * 50 + 25;
    if (/national.?park|sanctuary|wildlife/i.test(rawName)) entryFee = 200;
    if (/temple|church|mosque|gurudwara/i.test(rawName)) entryFee = 0;
    
    // Crowd level
    let crowdLevel = 'moderate';
    if (rating >= 4.5) crowdLevel = 'high';
    if (isHiddenGem) crowdLevel = 'low';
    
    placesArr.push({
      id: placeId,
      city_id: cityId,
      name: rawName,
      slug,
      description: desc || `A popular attraction in ${cityName}.`,
      category,
      latitude: parseFloat((cityCoords[0] + latOffset).toFixed(4)),
      longitude: parseFloat((cityCoords[1] + lngOffset).toFixed(4)),
      avg_rating: rating,
      review_count: Math.floor(rating * 800 + Math.random() * 2000),
      is_featured: isFeatured,
      is_hidden_gem: isHiddenGem,
      tags,
      best_time_to_visit: 'Morning',
      cover_image: CATEGORY_IMAGES[category] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
      entry_fee: entryFee,
      avg_visit_duration: avgDuration,
      crowd_level: crowdLevel,
      safety_rating: parseFloat((3.5 + Math.random() * 1.3).toFixed(1)),
    });
  }
  
  console.log(`Generated ${placesArr.length} places`);
  
  // ─── Generate TypeScript output ────────────────────────────────────────────
  const outputPath = path.join(rootDir, 'src', 'data', 'generatedData.ts');
  
  let output = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/convertDataset.js — DO NOT EDIT MANUALLY
// Generated from DATASET_1 (City.csv + Places.csv) and DATASET_2
// ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════════════════════════════

import type { State, City, Place } from '../types';

`;

  // States
  output += `export const generatedStates: State[] = ${JSON.stringify(statesArr, null, 2)};\n\n`;
  
  // Cities — need to clean out the extra fields (ideal_duration etc.) that aren't in the City type
  const cleanCities = citiesArr.map(c => ({
    id: c.id,
    state_id: c.state_id,
    name: c.name,
    latitude: c.latitude,
    longitude: c.longitude,
    is_featured: c.is_featured,
    is_trending: c.is_trending,
    tags: c.tags,
    description: c.description,
    cover_image: c.cover_image,
    best_season: c.best_season,
    avg_temp_celsius: c.avg_temp_celsius,
  }));
  output += `export const generatedCities: City[] = ${JSON.stringify(cleanCities, null, 2)};\n\n`;
  
  // Places
  output += `export const generatedPlaces: Place[] = ${JSON.stringify(placesArr, null, 2)};\n\n`;
  
  // Also export a transport info map for city detail pages
  const transportOutput = {};
  for (const city of citiesArr) {
    if (city.nearest_airport || city.nearest_railway) {
      transportOutput[city.id] = {
        nearest_airport: city.nearest_airport,
        nearest_railway: city.nearest_railway,
        accessibility: city.accessibility,
        ideal_duration: city.ideal_duration,
        best_time_to_visit: city.best_season,
      };
    }
  }
  output += `export const cityTransportInfo: Record<string, { nearest_airport: string; nearest_railway: string; accessibility: string; ideal_duration: string; best_time_to_visit: string }> = ${JSON.stringify(transportOutput, null, 2)};\n`;
  
  // Fix any apostrophes in JSON strings
  output = output.replace(/\\'/g, "'");
  
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`\n✅ Generated ${outputPath}`);
  console.log(`   ${statesArr.length} states, ${citiesArr.length} cities, ${placesArr.length} places`);
}

main();
