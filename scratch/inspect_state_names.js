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

console.log('--- 36 MASTER STATES ---');
const officialStates = statesCSV.map(s => s.state).filter(Boolean);
console.log(officialStates);

console.log('\n--- STATES IN PLACES CSV NOT IN OFFICIAL 36 ---');
const officialSet = new Set(officialStates);
const placesStates = new Set(placesCSV.map(p => p.state || p.union_territory).filter(Boolean));

const unmapped = [];
for (const s of placesStates) {
  if (!officialSet.has(s)) unmapped.push(s);
}
console.log(unmapped);
