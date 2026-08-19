const fs = require('fs');
const path = require('path');

const convertScriptContent = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'convertDataset.js'), 'utf8');

// Extract CITY_COORDS keys from the script content
const coordsBlockMatch = convertScriptContent.match(/const CITY_COORDS = \{([\s\S]*?)\};/);
const coordsBlock = coordsBlockMatch[1];
const coordsKeys = [];
const lines = coordsBlock.split('\n');
for (const line of lines) {
  const match = line.match(/'(.*?)':/);
  if (match) {
    coordsKeys.push(match[1]);
  }
}

const cityCsvPath = path.join(__dirname, '..', 'DATASET', 'DATASET_1', 'City.csv');
// Simple parse
const cityRows = fs.readFileSync(cityCsvPath, 'utf8')
  .split('\n')
  .slice(1)
  .map(l => l.split(',')[0].trim())
  .filter(Boolean);

console.log('Total cities in CSV:', cityRows.length);
console.log('Total keys in CITY_COORDS:', coordsKeys.length);

const missingCoords = cityRows.filter(c => !coordsKeys.includes(c));
console.log('Cities missing in CITY_COORDS:', missingCoords);
