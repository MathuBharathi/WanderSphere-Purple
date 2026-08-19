const fs = require('fs');
const path = require('path');

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

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const vals = [];
    let curVal = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQ = !inQ;
      } else if (char === ',' && !inQ) {
        vals.push(curVal);
        curVal = '';
      } else {
        curVal += char;
      }
    }
    vals.push(curVal);
    
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (vals[idx] || '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

const cityRows = parseCSV(fs.readFileSync('DATASET/DATASET_1/City.csv', 'utf8'));
const placeRows = parseCSV(fs.readFileSync('DATASET/DATASET_1/Places.csv', 'utf8'));

// Build cityIdMap
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

const cityIdMap = {};
for (const row of cityRows) {
  if (CITY_STATE_MAP[row.City]) {
    cityIdMap[row.City] = 'city-' + row.City.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}

let noCityName = 0;
let noCityId = 0;
let noPlaceName = 0;
let validCount = 0;

function cleanPlaceName(name) {
  return name.replace(/^\s*\d+\.\s*/, '').trim();
}

for (const row of placeRows) {
  const cityName = row.City;
  if (!cityName) {
    noCityName++;
    continue;
  }
  const cityId = cityIdMap[cityName];
  if (!cityId) {
    noCityId++;
    continue;
  }
  const rawName = cleanPlaceName(row.Place || '');
  if (!rawName) {
    noPlaceName++;
    continue;
  }
  validCount++;
}

console.log('Results:');
console.log('  Total place rows in CSV:', placeRows.length);
console.log('  Rows with empty city name:', noCityName);
console.log('  Rows where cityId was not found:', noCityId);
console.log('  Rows with empty cleaned place name:', noPlaceName);
console.log('  Total valid and imported places:', validCount);
