const fs = require('fs');
const path = require('path');
const { processPlace, generatedDataPath } = require('./enrichPexelsImages');

console.log('===========================================================');
console.log('RUNNING MANDATORY STEP 22 — PEXELS 20-PLACE TEST REPORT');
console.log('===========================================================\n');

// Load generated data
const content = fs.readFileSync(generatedDataPath, 'utf8');

const stateMatch = content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/);
const cityMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const placeMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);

const states = JSON.parse(stateMatch[1]);
const cities = JSON.parse(cityMatch[1]);
const places = JSON.parse(placeMatch[1]);

const stateMap = new Map(states.map(s => [s.id, s]));
const cityMap = new Map(cities.map(c => [c.id, c]));

// Select 20 varied places across categories
const testPlaceNames = [
  'Taj Mahal',                      // Famous Monument
  'Kapaleeshwarar Temple',         // Temple
  'Radhanagar Beach',              // Beach
  'Suruli Falls',                  // Waterfall
  'Meghamalai (Highwavys Range)',  // Hill Station
  'Kaziranga National Park',       // Wildlife
  'Victoria Memorial',             // Museum / Memorial
  'Amer Fort',                     // Fort
  'Dal Lake',                      // Lake
  'Rock Garden',                   // Park
  'Qutub Minar',                   // Monument
  'Meenakshi Amman Temple',        // Temple
  'Baga Beach',                    // Beach
  'Dudhsagar Falls',               // Waterfall
  'Solang Valley',                 // Adventure / Hill
  'Gir National Park',             // Wildlife
  'Red Fort',                      // Fort
  'Lake Pichola',                  // Lake
  'Cubbon Park',                   // Park
  'Hampi Ruins'                    // Cultural / Heritage
];

const selectedPlaces = [];
testPlaceNames.forEach(name => {
  const p = places.find(item => item.name.toLowerCase().includes(name.toLowerCase()));
  if (p) selectedPlaces.push(p);
});

// If fewer than 20 matched by name, fill up to 20 from diverse categories
if (selectedPlaces.length < 20) {
  places.forEach(p => {
    if (selectedPlaces.length < 20 && !selectedPlaces.some(sp => sp.id === p.id)) {
      selectedPlaces.push(p);
    }
  });
}

console.log(`Selected ${selectedPlaces.length} test places.\n`);

const usedPhotoIds = new Set();
const testResults = [];

async function runTest() {
  for (let i = 0; i < selectedPlaces.length; i++) {
    const p = selectedPlaces[i];
    console.log(`Processing [${i + 1}/20]: ${p.name}...`);
    const res = await processPlace(p, cityMap, stateMap, usedPhotoIds);
    testResults.push(res);
  }

  console.log('\n===========================================================');
  console.log('STEP 22 — PEXELS 20-PLACE TEST REPORT SUMMARY');
  console.log('===========================================================');

  let exactCount = 0;
  let relevantCount = 0;
  let keptCount = 0;

  testResults.forEach((res, idx) => {
    if (res.match_type === 'exact') exactCount++;
    else if (res.match_type === 'relevant') relevantCount++;
    else keptCount++;

    console.log(`\n[#${idx + 1}] ${res.place_name} (${res.city}, ${res.state})`);
    console.log(`- Query Used: ${res.query_used}`);
    console.log(`- Photo ID: ${res.pexels_photo_id || 'N/A'}`);
    console.log(`- Score: ${res.match_score} | Match Type: ${res.match_type.toUpperCase()}`);
    console.log(`- Decision: ${res.status.toUpperCase()}`);
    console.log(`- Old Image: ${res.old_image_url.substring(0, 60)}...`);
    console.log(`- New Image: ${res.new_image_url.substring(0, 60)}...`);
  });

  console.log('\n-----------------------------------------------------------');
  console.log(`TEST STATS: Exact Matches: ${exactCount} | Relevant Matches: ${relevantCount} | Kept Existing: ${keptCount}`);
  console.log('-----------------------------------------------------------');

  // Save report JSON
  const reportPath = path.join(__dirname, '../scratch/pexels_test_20_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
  console.log(`Saved test report to ${reportPath}`);
}

runTest();
