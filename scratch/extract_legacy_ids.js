const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/generatedData.ts'), 'utf8');

const stateMatch = content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/);
const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

const legacyStates = JSON.parse(stateMatch[1]);
const legacyCities = JSON.parse(cityMatch[1]);
const legacyPlaces = JSON.parse(placeMatch[1]);

console.log('Legacy Data Stats:');
console.log(`- States: ${legacyStates.length}`);
console.log(`- Cities: ${legacyCities.length}`);
console.log(`- Places: ${legacyPlaces.length}`);

// Save to scratch file for converter script to import
const mapData = {
  legacyStates,
  legacyCities,
  legacyPlaces
};

fs.writeFileSync(path.join(__dirname, '../scratch/legacy_map.json'), JSON.stringify(mapData, null, 2));
console.log('Saved scratch/legacy_map.json');
