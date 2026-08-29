import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWikimediaImages } from './lib/wikimedia.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure public/images/places directory exists
const imagesDir = path.resolve(__dirname, '../public/images/places');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read PEXELS_API_KEY from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/PEXELS_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

// Read generatedData.ts
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

function extractTransportInfo() {
  const marker = `export const cityTransportInfo`;
  const startIdx = fileContent.indexOf(marker);
  if (startIdx === -1) return {};

  const equalsIdx = fileContent.indexOf('=', startIdx);
  const objectIdx = fileContent.indexOf('{', equalsIdx);

  let depth = 0;
  let endIdx = -1;
  for (let i = objectIdx; i < fileContent.length; i++) {
    if (fileContent[i] === '{') depth++;
    else if (fileContent[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) return {};

  const jsonSlice = fileContent.slice(objectIdx, endIdx);
  try {
    return JSON.parse(jsonSlice);
  } catch (err) {
    const fn = new Function(`return ${jsonSlice}`);
    return fn();
  }
}

const states = extractArray('generatedStates');
const cities = extractArray('generatedCities');
const places = extractArray('generatedPlaces');
const cityTransportInfo = extractTransportInfo();

console.log(`Loaded dataset: ${states.length} states, ${cities.length} cities, ${places.length} places.`);

// Lookup maps
const stateMap = new Map();
states.forEach(s => stateMap.set(s.id, s.name));

const cityMap = new Map();
const cityCoverSet = new Set();
cities.forEach(c => {
  const stateName = stateMap.get(c.state_id) || '';
  cityMap.set(c.id, { name: c.name, state: stateName, cover_image: c.cover_image });
  if (c.cover_image) cityCoverSet.add(c.cover_image);
});

// Cache setup
const pexelsCachePath = path.resolve(__dirname, 'pexels_search_cache.json');
let pexelsCache = {};
if (fs.existsSync(pexelsCachePath)) {
  try { pexelsCache = JSON.parse(fs.readFileSync(pexelsCachePath, 'utf8')); } catch (e) {}
}

const wikimediaCachePath = path.resolve(__dirname, 'wikimedia_search_cache.json');
let wikimediaCache = {};
if (fs.existsSync(wikimediaCachePath)) {
  try { wikimediaCache = JSON.parse(fs.readFileSync(wikimediaCachePath, 'utf8')); } catch (e) {}
}

function saveCaches() {
  fs.writeFileSync(pexelsCachePath, JSON.stringify(pexelsCache, null, 2), 'utf8');
  fs.writeFileSync(wikimediaCachePath, JSON.stringify(wikimediaCache, null, 2), 'utf8');
}

// Load existing image attributions
const attrPath = path.resolve(__dirname, '../src/data/imageAttributions.ts');
let attributions = {};
if (fs.existsSync(attrPath)) {
  try {
    const attrText = fs.readFileSync(attrPath, 'utf8');
    const match = attrText.match(/export const placeAttributions: Record<string, ImageAttribution> = ({[\s\S]*});/);
    if (match) {
      const fn = new Function(`return ${match[1]}`);
      attributions = fn();
    }
  } catch (e) {}
}

// Build Pexels candidate map
const candidateMap = new Map();
Object.values(pexelsCache).forEach(list => {
  if (Array.isArray(list)) {
    list.forEach(p => {
      if (p && p.id) candidateMap.set(String(p.id), p);
    });
  }
});
const candidateList = Array.from(candidateMap.values());

async function searchWikimediaCached(query) {
  const normQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  if (wikimediaCache[normQuery]) return wikimediaCache[normQuery];
  const results = await fetchWikimediaImages(query);
  wikimediaCache[normQuery] = results;
  return results;
}

function cleanTitle(name) {
  if (!name) return '';
  let cleaned = name.replace(/^(Go Clubbing by the|Engage in the Adventures of|Marvel at the|Capture the Sceneries of|Take a Glimpse of|Visit the|Explore the|Walk through|Experience the|Trek to the|Enjoy the|Discover the)\s+/i, '');
  cleaned = cleaned.replace(/\s*\((.*?)\)/g, '').trim();
  return cleaned;
}

// SAFEGUARD #2: Strict Semantic Place Validation
function hasExactPlaceToken(photoText, placeName) {
  const words = cleanTitle(placeName).toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return true;
  return words.some(w => photoText.includes(w));
}

function scorePhotoSemantic(photo, destinationName, cityName, stateName, category, usedUrls) {
  if (usedUrls.has(photo.url)) return -99999;

  const photoText = `${photo.alt || ''} ${photo.url || ''} ${photo.photographer || ''}`.toLowerCase();
  
  // SAFEGUARD #2: Reject if it does NOT contain explicit place name token!
  if (!hasExactPlaceToken(photoText, destinationName)) {
    return -99999;
  }

  let score = 0;
  const destWords = destinationName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  destWords.forEach(w => {
    if (photoText.includes(w)) score += 35;
  });

  if (cityName && photoText.includes(cityName.toLowerCase())) score += 15;
  if (stateName && photoText.includes(stateName.toLowerCase())) score += 8;

  return score;
}

// Download image locally to public/images/places/
async function downloadImageLocally(url, placeId) {
  try {
    const ext = url.includes('.png') ? '.png' : '.jpg';
    const filename = `${placeId}${ext}`;
    const localPath = path.resolve(imagesDir, filename);
    const publicUrl = `/images/places/${filename}`;

    if (fs.existsSync(localPath)) {
      return publicUrl;
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'WanderSphere-TravelApp/1.0' }
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(localPath, Buffer.from(buffer));
      return publicUrl;
    }
  } catch (err) {
    console.warn(`Local download failed for place ${placeId}, using remote URL:`, err.message);
  }

  return url;
}

async function runSurgical461ReAudit() {
  console.log('\n================================================================');
  console.log('    SURGICAL 461 FALLBACK PLACE RE-AUDIT (WITH SAFEGUARDS)    ');
  console.log('================================================================\n');

  // SAFEGUARD #1: Identify ONLY the 461 places currently using city cover image fallbacks
  const fallbackPlaces = [];
  const verifiedPlaces = [];

  places.forEach(p => {
    const parentCity = cityMap.get(p.city_id);
    const isCityCoverFallback = parentCity && p.cover_image === parentCity.cover_image;
    if (isCityCoverFallback) {
      fallbackPlaces.push(p);
    } else {
      verifiedPlaces.push(p);
    }
  });

  console.log(`Verified places protected (DO NOT TOUCH): ${verifiedPlaces.length}`);
  console.log(`Fallback places targeted for re-audit : ${fallbackPlaces.length}\n`);

  const usedUrls = new Set();
  places.forEach(p => {
    if (p.cover_image && !cityCoverSet.has(p.cover_image)) {
      usedUrls.add(p.cover_image);
    }
  });

  let pexelsMatchCount = 0;
  let wikimediaMatchCount = 0;
  let noVerifiedMatchCount = 0;

  for (let i = 0; i < fallbackPlaces.length; i++) {
    const p = fallbackPlaces[i];
    const parentCity = cityMap.get(p.city_id) || { name: '', state: '' };
    const cleanedName = cleanTitle(p.name);

    let resolvedUrl = null;

    // Step 1: Pexels candidate pool with strict semantic place validation
    let bestP = null;
    let bestScore = -99999;

    for (const cand of candidateList) {
      const score = scorePhotoSemantic(cand, cleanedName, parentCity.name, parentCity.state, p.category, usedUrls);
      if (score > bestScore) {
        bestScore = score;
        bestP = cand;
      }
    }

    if (bestP && bestScore > 12) {
      resolvedUrl = bestP.url;
      usedUrls.add(bestP.url);
      pexelsMatchCount++;
    }

    // Step 2: Wikimedia Commons API search with local file download
    if (!resolvedUrl) {
      const wikiQuery = `${cleanedName} ${parentCity.name} ${parentCity.state} India`.trim().replace(/\s+/g, ' ');
      const wikiResults = await searchWikimediaCached(wikiQuery);
      if (wikiResults && wikiResults.length > 0) {
        for (const w of wikiResults) {
          const wikiText = `${w.title || ''} ${w.sourcePage || ''}`.toLowerCase();
          // Semantic place name check for Wikimedia result
          if (hasExactPlaceToken(wikiText, cleanedName) && !usedUrls.has(w.url)) {
            // Download image locally
            const localUrl = await downloadImageLocally(w.url, p.id);
            resolvedUrl = localUrl;
            usedUrls.add(localUrl);
            wikimediaMatchCount++;

            // Record attribution metadata
            attributions[p.id] = {
              placeId: p.id,
              placeName: p.name,
              imageUrl: localUrl,
              source: 'wikimedia_commons',
              sourcePage: w.sourcePage,
              creator: w.artist,
              license: w.license,
              licenseUrl: w.licenseUrl,
              attribution: `Photo by ${w.artist} via Wikimedia Commons (${w.license})`,
              verified: true,
            };
            break;
          }
        }
      }
    }

    // SAFEGUARD #3: ZERO CITY COVER FALLBACK RULE
    if (!resolvedUrl) {
      resolvedUrl = ""; // NO_VERIFIED_PLACE_IMAGE
      noVerifiedMatchCount++;
    }

    p.cover_image = resolvedUrl;

    if ((i + 1) % 100 === 0 || i === fallbackPlaces.length - 1) {
      console.log(`Fallback places processed: ${i + 1}/${fallbackPlaces.length}`);
    }
  }

  saveCaches();

  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Surgical 461 Fallback Re-Audit Complete!');
  console.log(`Target Fallback Places               : ${fallbackPlaces.length}`);
  console.log(`Matched Verified Pexels Photos       : ${pexelsMatchCount}`);
  console.log(`Matched Verified Wikimedia (Local)   : ${wikimediaMatchCount}`);
  console.log(`No Verified Match (cover_image="")   : ${noVerifiedMatchCount}`);
  console.log(`City Cover Fallbacks Remaining       : 0`);
  console.log('────────────────────────────────────────────────────────────────\n');

  // Write updated dataset to generatedData.ts
  const fileHeader = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/enrich_461_fallback_places.mjs (Surgical Pass)
// ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════════════════════════════

import type { State, City, Place } from '../types';

export const generatedStates: State[] = ${JSON.stringify(states, null, 2)};

export const generatedCities: City[] = ${JSON.stringify(cities, null, 2)};

export const generatedPlaces: Place[] = ${JSON.stringify(places, null, 2)};

export const cityTransportInfo = ${JSON.stringify(cityTransportInfo, null, 2)};
`;

  fs.writeFileSync(generatedDataPath, fileHeader, 'utf8');
  console.log('Successfully updated src/data/generatedData.ts!');

  // Write attribution registry to src/data/imageAttributions.ts
  const attrContent = `// AUTO-GENERATED Image Attribution Registry for Free/Open-Licensed Media
// ${new Date().toISOString()}

export interface ImageAttribution {
  placeId: string;
  placeName: string;
  imageUrl: string;
  source: 'pexels' | 'wikimedia_commons' | 'public_domain';
  sourcePage: string;
  creator: string;
  license: string;
  licenseUrl: string;
  attribution: string;
  verified: boolean;
}

export const placeAttributions: Record<string, ImageAttribution> = ${JSON.stringify(attributions, null, 2)};
`;

  fs.writeFileSync(attrPath, attrContent, 'utf8');
  console.log('Successfully updated src/data/imageAttributions.ts!');
}

runSurgical461ReAudit().catch(err => {
  console.error('461 fallback re-audit failed:', err);
  process.exit(1);
});
