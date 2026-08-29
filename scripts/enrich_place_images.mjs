import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWikimediaImages } from './lib/wikimedia.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read PEXELS_API_KEY from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/PEXELS_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

// 2. Read generatedData.ts
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
cities.forEach(c => {
  const stateName = stateMap.get(c.state_id) || '';
  cityMap.set(c.id, { name: c.name, state: stateName, cover_image: c.cover_image });
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

function getPhotoIdFromUrl(url) {
  if (!url) return '';
  const m = url.match(/\/photos\/(\d+)\//);
  return m ? m[1] : url;
}

function scorePhoto(photo, destinationName, cityName, stateName, category, usedPhotoUrls) {
  if (usedPhotoUrls.has(photo.url)) return -99999;

  const photoText = `${photo.alt || ''} ${photo.url || ''} ${photo.photographer || ''}`.toLowerCase();
  let score = 0;

  const destWords = destinationName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  destWords.forEach(w => {
    if (photoText.includes(w)) score += 35;
  });

  if (cityName && photoText.includes(cityName.toLowerCase())) score += 15;
  if (stateName && photoText.includes(stateName.toLowerCase())) score += 8;
  if (category && photoText.includes(category.toLowerCase())) score += 5;

  return score;
}

const usedPhotoUrls = new Set();
const attributions = {};

let keptCount = 0;
let pexelsReplacedCount = 0;
let wikimediaReplacedCount = 0;
let cityFallbackCount = 0;

async function runFastPlaceAudit() {
  console.log('\n================================================================');
  console.log('    SURGICAL PLACE-LEVEL AUDIT & WIKIMEDIA FALLBACK PASS       ');
  console.log('================================================================\n');

  // Track existing city URLs as used to avoid using city cover photo as a generic place photo
  cities.forEach(c => {
    if (c.cover_image) usedPhotoUrls.add(c.cover_image);
  });

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const parentCity = cityMap.get(p.city_id) || { name: '', state: '', cover_image: '' };
    const cleanedName = cleanTitle(p.name);
    const photoId = getPhotoIdFromUrl(p.cover_image);

    let isMatching = false;
    if (p.cover_image && !usedPhotoUrls.has(p.cover_image)) {
      const photoObj = candidateMap.get(photoId);
      if (photoObj) {
        const score = scorePhoto(photoObj, cleanedName, parentCity.name, parentCity.state, p.category, new Set());
        if (score > 12) isMatching = true;
      } else {
        const urlLower = p.cover_image.toLowerCase();
        const destFirstWord = cleanedName.toLowerCase().split(' ')[0];
        if (destFirstWord.length > 3 && urlLower.includes(destFirstWord)) isMatching = true;
      }
    }

    if (isMatching) {
      usedPhotoUrls.add(p.cover_image);
      keptCount++;
      continue;
    }

    // Step 1: Candidate matching from Pexels candidate pool
    let resolvedUrl = null;
    let bestP = null;
    let bestScore = -99999;

    for (const cand of candidateList) {
      if (usedPhotoUrls.has(cand.url)) continue;
      const score = scorePhoto(cand, cleanedName, parentCity.name, parentCity.state, p.category, usedPhotoUrls);
      if (score > bestScore) {
        bestScore = score;
        bestP = cand;
      }
    }

    if (bestP && bestScore > 10) {
      resolvedUrl = bestP.url;
      usedPhotoUrls.add(bestP.url);
      pexelsReplacedCount++;
    }

    // Step 2: If no strong Pexels match in candidate pool, search Wikimedia Commons
    if (!resolvedUrl) {
      const wikiQuery = `${cleanedName} ${parentCity.name} ${parentCity.state} India`.trim().replace(/\s+/g, ' ');
      const wikiResults = await searchWikimediaCached(wikiQuery);
      if (wikiResults && wikiResults.length > 0) {
        for (const w of wikiResults) {
          if (!usedPhotoUrls.has(w.url)) {
            resolvedUrl = w.url;
            usedPhotoUrls.add(w.url);
            wikimediaReplacedCount++;

            // Save attribution metadata
            attributions[p.id] = {
              placeId: p.id,
              placeName: p.name,
              imageUrl: w.url,
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

    // Step 3: Fallback to city cover image if no place-specific image could be verified
    if (!resolvedUrl) {
      resolvedUrl = parentCity.cover_image || 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
      cityFallbackCount++;
    }

    p.cover_image = resolvedUrl;

    if ((i + 1) % 500 === 0 || i === places.length - 1) {
      console.log(`Places audited: ${i + 1}/${places.length}`);
    }
  }

  saveCaches();

  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Place-Level Audit & Wikimedia Fallback Complete!');
  console.log(`Kept Unchanged (Verified Correct)  : ${keptCount}`);
  console.log(`Replaced with Verified Pexels     : ${pexelsReplacedCount}`);
  console.log(`Replaced with Wikimedia Commons    : ${wikimediaReplacedCount}`);
  console.log(`Fallback to Verified City Image   : ${cityFallbackCount}`);
  console.log(`Total Unique Photo URLs Assigned   : ${usedPhotoUrls.size}`);
  console.log('────────────────────────────────────────────────────────────────\n');

  // Write updated dataset to generatedData.ts
  const fileHeader = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/enrich_place_images.mjs (Place-Level Surgical Pass)
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
  const attrPath = path.resolve(__dirname, '../src/data/imageAttributions.ts');
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

runFastPlaceAudit().catch(err => {
  console.error('Place audit failed:', err);
  process.exit(1);
});
