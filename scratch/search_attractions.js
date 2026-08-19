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

const places = parseCSV(fs.readFileSync('DATASET/DATASET_1/Places.csv', 'utf8'));

const searchTerms = [
  'Shore Temple',
  'Sundarbans',
  'Vembanad Lake',
  'Radhanagar Beach'
];

for (const term of searchTerms) {
  const matched = places.filter(p => p.Place.toLowerCase().includes(term.toLowerCase()) || p.Place_desc.toLowerCase().includes(term.toLowerCase()));
  console.log(`Matches for "${term}":`, matched.length);
  if (matched.length > 0) {
    console.log(matched.map(m => ({ city: m.City, place: m.Place })));
  }
}
