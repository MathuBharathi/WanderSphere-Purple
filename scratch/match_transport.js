const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (vals[idx] || '').trim();
    });
    return obj;
  });
}

const cityRows = parseCSV(fs.readFileSync('DATASET/DATASET_1/City.csv', 'utf8'));
const ds2Rows = parseCSV(fs.readFileSync('DATASET/DATASET_2/Expanded_Indian_Travel_Dataset.csv', 'utf8'));

const uniqueDs2 = new Set(ds2Rows.map(r => r['Destination Name'] || r['Destination_Name']).filter(Boolean));

console.log('Unique destinations in Dataset 2:', [...uniqueDs2]);

// Check exact matches
const exactMatches = [];
const closeMatches = [];
const noMatch = [];

for (const city of cityRows) {
  const name = city.City;
  if (!name) continue;
  
  if (uniqueDs2.has(name)) {
    exactMatches.push(name);
  } else {
    // Try to find close matches
    let foundClose = false;
    for (const d of uniqueDs2) {
      if (d.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(d.toLowerCase())) {
        closeMatches.push({ city: name, ds2: d });
        foundClose = true;
        break;
      }
    }
    if (!foundClose) {
      noMatch.push(name);
    }
  }
}

console.log('\nExact matches between City.csv and Dataset 2:', exactMatches);
console.log('\nClose matches between City.csv and Dataset 2:', closeMatches);
