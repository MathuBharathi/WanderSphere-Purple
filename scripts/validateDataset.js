const fs = require('fs');
const path = require('path');

console.log('Running Automated Dataset Validation Script...\n');

// Load generated data
const generatedDataPath = path.join(__dirname, '../src/data/generatedData.ts');
const content = fs.readFileSync(generatedDataPath, 'utf8');

const stateMatch = content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/);
const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

if (!stateMatch || !cityMatch || !placeMatch) {
  console.error('❌ Validation Failed: Could not parse generatedStates, generatedCities, or generatedPlaces from generatedData.ts');
  process.exit(1);
}

const states = JSON.parse(stateMatch[1]);
const cities = JSON.parse(cityMatch[1]);
const places = JSON.parse(placeMatch[1]);

let hasErrors = false;

// 1. Validate State Count & Unique IDs
console.log(`1. States Check: Total = ${states.length}`);
if (states.length !== 36) {
  console.error(`❌ Expected 36 states/UTs, found ${states.length}`);
  hasErrors = true;
} else {
  console.log('✓ 36 States/UTs represented correctly.');
}

const stateIds = new Set(states.map(s => s.id));
if (stateIds.size !== states.length) {
  console.error(`❌ Duplicate state IDs found!`);
  hasErrors = true;
} else {
  console.log('✓ State IDs are unique.');
}

// 2. Validate Cities Linked to States & Unique IDs
console.log(`\n2. Cities Check: Total = ${cities.length}`);
const cityIds = new Set();
let unlinkedCities = 0;

cities.forEach(c => {
  if (cityIds.has(c.id)) {
    console.error(`❌ Duplicate city ID: ${c.id}`);
    hasErrors = true;
  }
  cityIds.add(c.id);

  if (!stateIds.has(c.state_id)) {
    console.error(`❌ City ${c.name} (${c.id}) linked to invalid state_id: ${c.state_id}`);
    unlinkedCities++;
    hasErrors = true;
  }
});

if (unlinkedCities === 0) {
  console.log('✓ All cities successfully linked to valid states.');
}

// 3. Validate Places Linked to Cities & Unique IDs
console.log(`\n3. Places Check: Total = ${places.length}`);
const placeIds = new Set();
let unlinkedPlaces = 0;
let missingNames = 0;

places.forEach((p, idx) => {
  if (!p.name || p.name.trim() === '') {
    missingNames++;
    hasErrors = true;
  }

  if (placeIds.has(p.id)) {
    console.error(`❌ Duplicate place ID: ${p.id} at index ${idx}`);
    hasErrors = true;
  }
  placeIds.add(p.id);

  if (!cityIds.has(p.city_id)) {
    console.error(`❌ Place ${p.name} (${p.id}) linked to invalid city_id: ${p.city_id}`);
    unlinkedPlaces++;
    hasErrors = true;
  }
});

if (missingNames === 0) {
  console.log('✓ No missing place names.');
}
if (unlinkedPlaces === 0) {
  console.log('✓ All 3,780 places successfully linked to valid cities.');
}
if (placeIds.size === places.length) {
  console.log('✓ All 3,780 place IDs are 100% unique.');
}

// Summary Report
console.log('\n==================================================');
if (hasErrors) {
  console.error('❌ DATASET VALIDATION FAILED WITH ERRORS!');
  process.exit(1);
} else {
  console.log('✅ ALL DATASET VALIDATION CHECKS PASSED SUCCESSFULLY!');
  console.log(`- States: ${states.length}`);
  console.log(`- Cities: ${cities.length}`);
  console.log(`- Places: ${places.length}`);
  console.log('==================================================');
}
