const path = require('path');
const fs = require('fs');

const generatedDataPath = path.join(__dirname, '../src/data/generatedData.ts');

// We can read lines to count objects or evaluate
const content = fs.readFileSync(generatedDataPath, 'utf8');

console.log('generatedData.ts size (bytes):', content.length);

// Count states, cities, places
const stateMatch = content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/);
const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

if (stateMatch) {
  const states = JSON.parse(stateMatch[1]);
  console.log('Current generatedStates count:', states.length);
  console.log('Sample State:', states[0]);
}

if (cityMatch) {
  const cities = JSON.parse(cityMatch[1]);
  console.log('Current generatedCities count:', cities.length);
  console.log('Sample City:', cities[0]);
}

if (placeMatch) {
  const places = JSON.parse(placeMatch[1]);
  console.log('Current generatedPlaces count:', places.length);
  console.log('Sample Place:', places[0]);
}
