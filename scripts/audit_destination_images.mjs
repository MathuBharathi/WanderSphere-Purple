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

  // Find matching bracket
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
    try {
      const fn = new Function(`return ${jsonSlice}`);
      return fn();
    } catch (e) {
      console.error(`Failed to parse ${arrayName}:`, e.message);
      return [];
    }
  }
}

const states = extractArray('generatedStates');
const cities = extractArray('generatedCities');
const places = extractArray('generatedPlaces');

console.log('════════════════════════════════════════════════════════════════');
console.log('         WANDERSPHERE DESTINATION IMAGE AUDIT REPORT            ');
console.log('════════════════════════════════════════════════════════════════');
console.log(`Total States       : ${states.length}`);
console.log(`Total Cities       : ${cities.length}`);
console.log(`Total Places       : ${places.length}`);

const attractions = places.filter(p => !p.is_hidden_gem);
const hiddenGems = places.filter(p => p.is_hidden_gem);

console.log(`  - Attractions    : ${attractions.length}`);
console.log(`  - Hidden Gems    : ${hiddenGems.length}`);

const allDestinations = [
  ...states.map(s => ({ type: 'State', name: s.name, cover: s.cover_image, id: s.id })),
  ...cities.map(c => ({ type: 'City', name: c.name, cover: c.cover_image, id: c.id })),
  ...places.map(p => ({ type: 'Place', name: p.name, city: p.city_id, cover: p.cover_image, id: p.id }))
];

let unsplashCount = 0;
let pexelsCount = 0;
let missingCount = 0;
let otherCount = 0;

const photoIdMap = new Map(); // photoId -> Array of destination names

allDestinations.forEach(item => {
  const url = item.cover || '';
  if (!url) {
    missingCount++;
    return;
  }
  if (url.includes('unsplash.com')) {
    unsplashCount++;
  } else if (url.includes('pexels.com')) {
    pexelsCount++;
    // Extract photo ID
    const match = url.match(/\/photos\/(\d+)\//);
    const photoId = match ? match[1] : url;
    if (!photoIdMap.has(photoId)) {
      photoIdMap.set(photoId, []);
    }
    photoIdMap.get(photoId).push(`${item.type}: ${item.name}`);
  } else {
    otherCount++;
  }
});

console.log('────────────────────────────────────────────────────────────────');
console.log(`Pexels URLs        : ${pexelsCount}`);
console.log(`Unsplash URLs      : ${unsplashCount}`);
console.log(`Missing Image URLs : ${missingCount}`);
console.log(`Other Image URLs   : ${otherCount}`);
console.log('────────────────────────────────────────────────────────────────');

let duplicatePhotoCount = 0;
let totalDuplicateAssignments = 0;

photoIdMap.forEach((destList, photoId) => {
  if (destList.length > 1) {
    duplicatePhotoCount++;
    totalDuplicateAssignments += (destList.length - 1);
  }
});

console.log(`Unique Pexels Photos Used : ${photoIdMap.size}`);
console.log(`Duplicate Pexels Photo IDs : ${duplicatePhotoCount}`);
console.log(`Total Duplicate Assignments: ${totalDuplicateAssignments}`);
console.log('────────────────────────────────────────────────────────────────');

if (duplicatePhotoCount > 0) {
  console.log('\nTop Duplicate Photo Breakdown (First 10):');
  let logged = 0;
  photoIdMap.forEach((destList, photoId) => {
    if (destList.length > 1 && logged < 10) {
      console.log(`\nPhoto ID: ${photoId} (Used by ${destList.length} destinations):`);
      console.log(`  Sample usages:`);
      destList.slice(0, 5).forEach(d => console.log(`   - ${d}`));
      if (destList.length > 5) console.log(`   ... and ${destList.length - 5} more`);
      logged++;
    }
  });
}

console.log('\n════════════════════════════════════════════════════════════════\n');
