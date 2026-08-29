import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatedDataPath = path.resolve(__dirname, '../src/data/generatedData.ts');
const fileContent = fs.readFileSync(generatedDataPath, 'utf8');

function extractArray(arrayName) {
  const marker = `export const ${arrayName}`;
  const startIdx = fileContent.indexOf(marker);
  if (startIdx === -1) return [];

  const equalsIdx = fileContent.indexOf('=', startIdx);
  const bracketIdx = fileContent.indexOf('[', equalsIdx);

  let depth = 0;
  let endIdx = -1;
  for (let i = bracketIdx; i < fileContent.length; i++) {
    if (fileContent[i] === '[') depth++;
    else if (fileContent[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) return [];

  const jsonSlice = fileContent.slice(bracketIdx, endIdx);
  try {
    return JSON.parse(jsonSlice);
  } catch (err) {
    const fn = new Function(`return ${jsonSlice}`);
    return fn();
  }
}

const cities = extractArray('generatedCities');
const places = extractArray('generatedPlaces');

const testCities = [
  'Delhi', 'Mumbai', 'Chennai', 'Bengaluru', 'Jaipur', 'Udaipur',
  'Varanasi', 'Munnar', 'Manali', 'Mysore', 'Mysuru', 'Madurai',
  'Coimbatore', 'Varkala', 'Tirupati', 'Hampi', 'Goa'
];

const testPlaces = [
  'Hogenakkal Falls', 'Qutub Minar', 'Mysore Palace', 'Meenakshi Amman Temple',
  'Marina Beach', 'Golden Temple', 'Varkala Beach', 'City Shopping',
  'Akasaganga Teertham', 'Chittoor', 'Nagalapuram', 'Nellore'
];

console.log('================================================================');
console.log('     SPECIFIC TEST DESTINATIONS IMAGE VERIFICATION REPORT       ');
console.log('================================================================\n');

console.log('--- TEST CITIES ---');
testCities.forEach(cityName => {
  const found = cities.find(c => c.name.toLowerCase().trim() === cityName.toLowerCase().trim());
  if (found) {
    console.log(`City: ${found.name.padEnd(15)} | Image: ${found.cover_image}`);
  } else {
    console.log(`City: ${cityName.padEnd(15)} | NOT FOUND IN CITIES ARRAY`);
  }
});

console.log('\n--- TEST ATTRACTIONS & PLACES ---');
testPlaces.forEach(placeName => {
  const found = places.find(p => p.name.toLowerCase().includes(placeName.toLowerCase()));
  if (found) {
    console.log(`Place: ${found.name.padEnd(30)} | Image: ${found.cover_image}`);
  } else {
    console.log(`Place: ${placeName.padEnd(30)} | NOT FOUND IN PLACES ARRAY`);
  }
});

console.log('\n================================================================\n');
