const fs = require('fs');
const path = require('path');

// ─── CSV Parser (same as convertDataset.js) ──────────────────────────────────
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

const cityCsvPath = path.join(__dirname, '..', 'DATASET', 'DATASET_1', 'City.csv');
const placesCsvPath = path.join(__dirname, '..', 'DATASET', 'DATASET_1', 'Places.csv');

const cityRows = parseCSV(fs.readFileSync(cityCsvPath, 'utf8'));
const placeRows = parseCSV(fs.readFileSync(placesCsvPath, 'utf8'));

console.log('City.csv has', cityRows.length, 'cities.');
console.log('Places.csv has', placeRows.length, 'places.');

// Check if any cities in City.csv are missing in CITY_STATE_MAP
const missingCitiesInMap = [];
for (const row of cityRows) {
  if (!row.City) continue;
  if (!CITY_STATE_MAP[row.City]) {
    missingCitiesInMap.push(row.City);
  }
}
console.log('Cities in City.csv but missing in CITY_STATE_MAP:', missingCitiesInMap);

// Check if any cities in Places.csv are missing in CITY_STATE_MAP or do not exist in City.csv
const citiesInPlaces = new Set();
const missingPlacesCities = [];
const placesWithNoCity = [];

for (const row of placeRows) {
  const cityName = row.City;
  if (!cityName) {
    placesWithNoCity.push(row.Place);
    continue;
  }
  citiesInPlaces.add(cityName);
  if (!CITY_STATE_MAP[cityName]) {
    missingPlacesCities.push({ place: row.Place, city: cityName });
  }
}

console.log('Unique cities in Places.csv:', citiesInPlaces.size);
console.log('Places with no city column value at all:', placesWithNoCity.length);

const missingUniqueCities = [...new Set(missingPlacesCities.map(m => m.city))];
console.log('Unique cities in Places.csv that are NOT in CITY_STATE_MAP:', missingUniqueCities);

// Let's also verify if there are place records that didn't get imported for some other reasons
// e.g. because of spelling mismatch between City.csv and Places.csv
const citiesInCityCsv = new Set(cityRows.map(r => r.City).filter(Boolean));
const citiesInPlacesNotInCityCsv = [...citiesInPlaces].filter(c => !citiesInCityCsv.has(c));
console.log('Cities in Places.csv but NOT in City.csv:', citiesInPlacesNotInCityCsv);
