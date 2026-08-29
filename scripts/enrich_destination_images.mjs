import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read PEXELS_API_KEY from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/PEXELS_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

if (!apiKey) {
  console.error('ERROR: PEXELS_API_KEY not found in .env.local!');
  process.exit(1);
}

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

// Create lookup maps
const stateMap = new Map();
states.forEach(s => stateMap.set(s.id, s.name));

const cityMap = new Map();
cities.forEach(c => {
  const stateName = stateMap.get(c.state_id) || '';
  cityMap.set(c.id, { name: c.name, state: stateName });
});

// Cache for Pexels API responses
const cachePath = path.resolve(__dirname, 'pexels_search_cache.json');
let pexelsCache = {};
if (fs.existsSync(cachePath)) {
  try {
    pexelsCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch (e) {
    pexelsCache = {};
  }
}

function saveCache() {
  fs.writeFileSync(cachePath, JSON.stringify(pexelsCache, null, 2), 'utf8');
}

// Build candidate photo map
const candidateMap = new Map();
Object.values(pexelsCache).forEach(list => {
  if (Array.isArray(list)) {
    list.forEach(p => {
      if (p && p.id) {
        candidateMap.set(String(p.id), p);
      }
    });
  }
});
const candidateList = Array.from(candidateMap.values());

let rateLimitHit = false;

async function fetchPexelsSearch(query) {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  if (pexelsCache[normalizedQuery]) {
    return pexelsCache[normalizedQuery];
  }

  if (rateLimitHit || !apiKey) {
    return [];
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: apiKey,
        'User-Agent': 'WanderSphere-Travel/1.0',
      }
    });

    if (res.status === 429) {
      console.warn('Pexels 429 Limit hit. Switching to smart candidate matching...');
      rateLimitHit = true;
      return [];
    }

    if (res.ok) {
      const data = await res.json();
      const photos = (data.photos || []).map(p => ({
        id: p.id,
        url: p.src.large2x || p.src.large || p.src.original,
        medium: p.src.medium,
        small: p.src.small,
        photographer: p.photographer || 'Pexels Contributor',
        alt: p.alt || '',
      }));
      pexelsCache[normalizedQuery] = photos;
      photos.forEach(p => {
        if (p && p.id && !candidateMap.has(String(p.id))) {
          candidateMap.set(String(p.id), p);
          candidateList.push(p);
        }
      });
      return photos;
    }
  } catch (err) {
    console.error(`Fetch error for query "${query}":`, err.message);
  }

  pexelsCache[normalizedQuery] = [];
  return [];
}

// Clean title
function cleanTitle(name) {
  if (!name) return '';
  let cleaned = name.replace(/^(Go Clubbing by the|Engage in the Adventures of|Marvel at the|Capture the Sceneries of|Take a Glimpse of|Visit the|Explore the|Walk through|Experience the|Trek to the|Enjoy the|Discover the)\s+/i, '');
  cleaned = cleaned.replace(/\s*\((.*?)\)/g, '').trim();
  return cleaned;
}

// Extract Photo ID from URL
function getPhotoIdFromUrl(url) {
  if (!url) return '';
  const m = url.match(/\/photos\/(\d+)\//);
  return m ? m[1] : url;
}

// Score a candidate photo
function scorePhoto(photo, destinationName, cityName, stateName, category, usedPhotoIds) {
  const photoIdStr = String(photo.id);
  if (usedPhotoIds.has(photoIdStr)) {
    return -99999; // Strict duplicate penalty
  }

  const photoText = `${photo.alt || ''} ${photo.url || ''} ${photo.photographer || ''}`.toLowerCase();
  let score = 0;

  const destWords = destinationName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  destWords.forEach(w => {
    if (photoText.includes(w)) score += 35;
  });

  if (cityName && photoText.includes(cityName.toLowerCase())) score += 15;
  if (stateName && photoText.includes(stateName.toLowerCase())) score += 8;
  if (category && photoText.includes(category.toLowerCase())) score += 5;
  if (photoText.includes('india')) score += 2;

  return score;
}

const usedPhotoIds = new Set();
let keptCount = 0;
let replacedCount = 0;

async function auditAndResolvePhoto(currentUrl, destName, cityName = '', stateName = '', category = '') {
  const cleanedName = cleanTitle(destName);
  const currentPhotoId = getPhotoIdFromUrl(currentUrl);

  // Check if current image is valid, non-duplicate, and matches destination
  if (currentUrl && currentUrl.includes('images.pexels.com') && !usedPhotoIds.has(currentPhotoId)) {
    const photoObj = candidateMap.get(currentPhotoId);
    let isMatching = false;
    if (photoObj) {
      const score = scorePhoto(photoObj, cleanedName, cityName, stateName, category, new Set());
      if (score > 10) {
        isMatching = true;
      }
    } else {
      // If URL contains destination keyword
      const urlLower = currentUrl.toLowerCase();
      const destFirstWord = cleanedName.toLowerCase().split(' ')[0];
      if (destFirstWord.length > 3 && urlLower.includes(destFirstWord)) {
        isMatching = true;
      }
    }

    if (isMatching) {
      usedPhotoIds.add(currentPhotoId);
      keptCount++;
      return currentUrl;
    }
  }

  // Current photo is wrong/generic/duplicate -> Search destination-specific Pexels query
  replacedCount++;

  const queries = [
    `${cleanedName} ${cityName} ${stateName} India`,
    `${cleanedName} ${cityName} India`,
    `${cleanedName} ${stateName} India`,
    `${cleanedName} India`
  ].map(q => q.trim().replace(/\s+/g, ' '));

  for (const query of queries) {
    const photos = await fetchPexelsSearch(query);
    if (photos && photos.length > 0) {
      let bestPhoto = null;
      let bestScore = -99999;
      for (const p of photos) {
        const score = scorePhoto(p, cleanedName, cityName, stateName, category, usedPhotoIds);
        if (score > bestScore) {
          bestScore = score;
          bestPhoto = p;
        }
      }

      if (bestPhoto && !usedPhotoIds.has(String(bestPhoto.id)) && bestScore > 0) {
        usedPhotoIds.add(String(bestPhoto.id));
        return bestPhoto.url;
      }
    }
  }

  // Scan candidate pool for best un-used matching photo
  let bestPhoto = null;
  let bestScore = -99999;

  for (const p of candidateList) {
    const score = scorePhoto(p, cleanedName, cityName, stateName, category, usedPhotoIds);
    if (score > bestScore) {
      bestScore = score;
      bestPhoto = p;
    }
  }

  if (bestPhoto && !usedPhotoIds.has(String(bestPhoto.id))) {
    usedPhotoIds.add(String(bestPhoto.id));
    return bestPhoto.url;
  }

  // Fallback hash index from candidate pool if all unused candidates were exhausted
  if (candidateList.length > 0) {
    let hash = 0;
    const str = `${destName}-${cityName}-${stateName}`;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    const fallbackPhoto = candidateList[Math.abs(hash) % candidateList.length];
    return fallbackPhoto.url;
  }

  return currentUrl || 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
}

async function runSurgicalAudit() {
  console.log('\n================================================================');
  console.log('      SURGICAL DESTINATION IMAGE AUDIT & CORRECTION             ');
  console.log('================================================================\n');

  // 1. Audit States
  console.log('--- Auditing States ---');
  for (const s of states) {
    s.cover_image = await auditAndResolvePhoto(s.cover_image, s.name, '', s.name, 'tourism');
  }

  // 2. Audit Cities
  console.log('--- Auditing Cities ---');
  for (const c of cities) {
    const stateName = stateMap.get(c.state_id) || '';
    c.cover_image = await auditAndResolvePhoto(c.cover_image, c.name, c.name, stateName, 'skyline');
  }

  // 3. Audit Places
  console.log('--- Auditing Places ---');
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const parentCity = cityMap.get(p.city_id) || { name: '', state: '' };
    p.cover_image = await auditAndResolvePhoto(p.cover_image, p.name, parentCity.name, parentCity.state, p.category);
    if ((i + 1) % 500 === 0 || i === places.length - 1) {
      console.log(`Places audited: ${i + 1}/${places.length}`);
    }
  }

  saveCache();

  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Audit & Correction Complete!');
  console.log(`Kept Unchanged (Verified Correct) : ${keptCount}`);
  console.log(`Replaced (Wrong/Generic/Duplicate): ${replacedCount}`);
  console.log(`Unique Photo IDs Assigned         : ${usedPhotoIds.size}`);
  console.log('────────────────────────────────────────────────────────────────\n');

  console.log('Writing updated dataset to src/data/generatedData.ts...');

  const fileHeader = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/enrich_destination_images.mjs (Surgical Pass)
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
}

runSurgicalAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
