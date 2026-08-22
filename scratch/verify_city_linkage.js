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
const statesCSV = parseCSV(fs.readFileSync(path.join(masterDir, 'WanderSphere_States.csv'), 'utf8'));
const citiesCSV = parseCSV(fs.readFileSync(path.join(masterDir, 'WanderSphere_Cities.csv'), 'utf8'));
const placesCSV = parseCSV(fs.readFileSync(path.join(masterDir, 'WanderSphere_Master_Places.csv'), 'utf8'));

const cityMap = new Map();
citiesCSV.forEach(c => {
  cityMap.set(c.city_id, c);
  // Also map by city_name + state
  cityMap.set(`${c.city_name.toLowerCase()}__${c.state.toLowerCase()}`, c);
});

console.log('Total Cities in Cities CSV:', citiesCSV.length);

let placesLinkedByCityId = 0;
let placesLinkedByNameState = 0;
let unlinkedPlaces = 0;

placesCSV.forEach((p, idx) => {
  let matchedCity = cityMap.get(p.city_id);
  if (matchedCity) {
    placesLinkedByCityId++;
  } else {
    const key = `${(p.city || '').toLowerCase()}__${(p.state || p.union_territory || '').toLowerCase()}`;
    matchedCity = cityMap.get(key);
    if (matchedCity) {
      placesLinkedByNameState++;
    } else {
      unlinkedPlaces++;
      if (unlinkedPlaces <= 5) {
        console.log(`Unlinked place #${idx}:`, { place_id: p.place_id, name: p.place_name, city: p.city, city_id: p.city_id, state: p.state });
      }
    }
  }
});

console.log(`\nLinkage Summary:`);
console.log(`- Linked by city_id: ${placesLinkedByCityId}`);
console.log(`- Linked by city_name + state: ${placesLinkedByNameState}`);
console.log(`- Unlinked places: ${unlinkedPlaces}`);
