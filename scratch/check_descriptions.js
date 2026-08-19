const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/data/generatedData.ts', 'utf8');

const placesMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);
const places = JSON.parse(placesMatch[1]);

const citiesMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const cities = JSON.parse(citiesMatch[1]);

console.log('Total places:', places.length);
console.log('Total cities:', cities.length);

const badPlaces = [];
for (const p of places) {
  if (p.description.startsWith('[') || p.description.includes("['") || p.description.includes('["')) {
    badPlaces.push({ id: p.id, desc: p.description });
  }
}
console.log('Places with bad descriptions:', badPlaces.length);

const badCities = [];
for (const c of cities) {
  if (c.description.startsWith('[') || c.description.includes("['") || c.description.includes('["')) {
    badCities.push({ id: c.id, desc: c.description });
  }
}
console.log('Cities with bad descriptions:', badCities.length);
if (badCities.length > 0) {
  console.log('Sample bad cities:', badCities.slice(0, 5));
}
