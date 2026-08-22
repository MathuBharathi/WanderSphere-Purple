const fs = require('fs');
const path = require('path');

// ─── Simple CSV Parser ────────────────────────────────────────────────────────
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

const masterDir = path.join(__dirname, '../DATASET/Master_DATASET');
const statesCSV = fs.readFileSync(path.join(masterDir, 'WanderSphere_States.csv'), 'utf8');
const citiesCSV = fs.readFileSync(path.join(masterDir, 'WanderSphere_Cities.csv'), 'utf8');
const placesCSV = fs.readFileSync(path.join(masterDir, 'WanderSphere_Master_Places.csv'), 'utf8');

const masterStates = parseCSV(statesCSV);
const masterCities = parseCSV(citiesCSV);
const masterPlaces = parseCSV(placesCSV);

console.log('Master CSV Rows:');
console.log('- States:', masterStates.length);
console.log('- Cities:', masterCities.length);
console.log('- Places:', masterPlaces.length);

console.log('\nMaster Places Sample Keys:', Object.keys(masterPlaces[0]));
console.log('Sample Place[0]:', {
  place_id: masterPlaces[0].place_id,
  place_name: masterPlaces[0].place_name,
  state: masterPlaces[0].state,
  city: masterPlaces[0].city,
  primary_category: masterPlaces[0].primary_category,
  rating: masterPlaces[0].rating,
  image_url: masterPlaces[0].image_url
});

// Check unique states in places
const statesInPlaces = new Set(masterPlaces.map(p => p.state || p.union_territory).filter(Boolean));
console.log('\nUnique States/UTs in Places CSV:', statesInPlaces.size);

// Check unique cities in places
const citiesInPlaces = new Set(masterPlaces.map(p => `${p.city} (${p.state || p.union_territory})`));
console.log('Unique City+State combinations in Places CSV:', citiesInPlaces.size);
