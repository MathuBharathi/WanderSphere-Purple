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

const cityCsvPath = path.join(__dirname, '..', 'DATASET', 'DATASET_1', 'City.csv');
const ds2CsvPath = path.join(__dirname, '..', 'DATASET', 'DATASET_2', 'Expanded_Indian_Travel_Dataset.csv');

const cityRows = parseCSV(fs.readFileSync(cityCsvPath, 'utf8'));
const ds2Rows = parseCSV(fs.readFileSync(ds2CsvPath, 'utf8'));

const citiesInCityCsv = new Set(cityRows.map(r => r.City).filter(Boolean));
console.log('Total unique cities in City.csv:', citiesInCityCsv.size);

const uniqueDs2Destinations = new Set();
for (const row of ds2Rows) {
  const dest = row['Destination Name'] || row['Destination_Name'];
  if (dest) uniqueDs2Destinations.add(dest);
}

console.log('Unique destinations in Dataset 2:', [...uniqueDs2Destinations]);
const missingInCityCsv = [...uniqueDs2Destinations].filter(d => !citiesInCityCsv.has(d));
console.log('Destinations in Dataset 2 but NOT in City.csv:', missingInCityCsv);
