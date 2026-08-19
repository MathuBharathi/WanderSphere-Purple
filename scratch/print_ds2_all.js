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

const ds2Rows = parseCSV(fs.readFileSync('DATASET/DATASET_2/Expanded_Indian_Travel_Dataset.csv', 'utf8'));
const uniqueRows = [];
const seen = new Set();

for (const row of ds2Rows) {
  const key = JSON.stringify(row);
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRows.push(row);
  }
}

console.log('Total unique rows in Dataset 2:', uniqueRows.length);
console.log('Unique rows in Dataset 2:', uniqueRows);
