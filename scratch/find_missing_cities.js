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
const placeRows = parseCSV(fs.readFileSync('DATASET/DATASET_1/Places.csv', 'utf8'));

const citiesInCityCsv = new Set(cityRows.map(r => r.City).filter(Boolean));
const citiesInPlaces = new Set(placeRows.map(p => p.City).filter(Boolean));

const missing = [...citiesInCityCsv].filter(c => !citiesInPlaces.has(c));
console.log('Cities in City.csv that do NOT have any places in Places.csv:', missing);
