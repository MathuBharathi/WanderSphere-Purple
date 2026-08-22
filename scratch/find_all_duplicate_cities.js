const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/generatedData.ts'), 'utf8');

const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

const cities = JSON.parse(cityMatch[1]);
const places = JSON.parse(placeMatch[1]);

console.log('All Cities in dataset:');
cities.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
  const pCount = places.filter(p => p.city_id === c.id).length;
  console.log(`- [${c.state_id}] ${c.name} (id: ${c.id}) -> ${pCount} places`);
});
