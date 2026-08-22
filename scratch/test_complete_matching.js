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

// Build city maps
const cityById = new Map();
const cityByName = new Map();

citiesCSV.forEach(c => {
  cityById.set(c.city_id, c);
  const nameKey = c.city_name.toLowerCase().trim();
  if (!cityByName.has(nameKey)) {
    cityByName.set(nameKey, c);
  }
});

let matchedCount = 0;
let unlinked = [];

placesCSV.forEach(p => {
  let matched = cityById.get(p.city_id);
  if (!matched && p.city_id) {
    matched = cityByName.get(p.city_id.toLowerCase().trim());
  }
  if (!matched && p.city) {
    matched = cityByName.get(p.city.toLowerCase().trim());
  }
  if (matched) {
    matchedCount++;
  } else {
    unlinked.push(p);
  }
});

console.log(`Total Places: ${placesCSV.length}`);
console.log(`Matched Places: ${matchedCount}`);
console.log(`Unlinked Places: ${unlinked.length}`);

if (unlinked.length > 0) {
  console.log('\nSample Unlinked Places:', unlinked.slice(0, 10).map(p => ({
    place_id: p.place_id,
    name: p.place_name,
    city: p.city,
    city_id: p.city_id,
    state: p.state,
    ut: p.union_territory
  })));
}
