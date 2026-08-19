const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/data/generatedData.ts', 'utf8');

// Match all places in generatedPlaces
const placesMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);
const places = JSON.parse(placesMatch[1]);

console.log('Total places:', places.length);

const corrupted = [];
for (const p of places) {
  if (p.name.includes('"') || p.name.includes('[') || p.name.startsWith('.') || p.name.startsWith(',')) {
    corrupted.push({ id: p.id, name: p.name });
  }
}

console.log('Places with suspicious names:', corrupted.length);
if (corrupted.length > 0) {
  console.log('Suspicious places:', corrupted.slice(0, 10));
}
