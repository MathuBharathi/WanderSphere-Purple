const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/generatedData.ts'), 'utf8');

const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

const cities = JSON.parse(cityMatch[1]);
const places = JSON.parse(placeMatch[1]);

console.log(`Loaded ${cities.length} cities and ${places.length} places.`);

// Group cities by state_id
const citiesByState = {};
cities.forEach(c => {
  if (!citiesByState[c.state_id]) citiesByState[c.state_id] = [];
  citiesByState[c.state_id].push(c);
});

console.log('\n--- POTENTIAL CITY DUPLICATES BY STATE ---');

Object.keys(citiesByState).forEach(stateId => {
  const stateCities = citiesByState[stateId];
  // Find cities with similar names or aliases
  for (let i = 0; i < stateCities.length; i++) {
    for (let j = i + 1; j < stateCities.length; j++) {
      const c1 = stateCities[i];
      const c2 = stateCities[j];

      const n1 = c1.name.toLowerCase().replace(/[^a-z]/g, '');
      const n2 = c2.name.toLowerCase().replace(/[^a-z]/g, '');

      // Check if one contains another or high similarity
      if (n1.includes(n2) || n2.includes(n1) || (n1.substring(0, 4) === n2.substring(0, 4) && Math.abs(n1.length - n2.length) <= 3)) {
        const c1Places = places.filter(p => p.city_id === c1.id).length;
        const c2Places = places.filter(p => p.city_id === c2.id).length;
        console.log(`[${stateId}] "${c1.name}" (${c1.id}, ${c1Places} places) <---> "${c2.name}" (${c2.id}, ${c2Places} places)`);
      }
    }
  }
});
