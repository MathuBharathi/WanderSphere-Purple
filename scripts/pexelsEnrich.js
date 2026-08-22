const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Load .env.local ─────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let v = (m[2] || '').trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  });
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_API_KEY) { console.error('❌ PEXELS_API_KEY not set'); process.exit(1); }

// ─── Paths ───────────────────────────────────────────────────────────────────
const DATA_PATH = path.join(__dirname, '../src/data/generatedData.ts');
const CACHE_PATH = path.join(__dirname, '../DATASET/pexels-image-cache.json');
const AUDIT_CSV = path.join(__dirname, '../DATASET/WanderSphere_Pexels_Image_Audit.csv');
const REVIEW_CSV = path.join(__dirname, '../DATASET/WanderSphere_Image_Needs_Review.csv');
const PROGRESS_PATH = path.join(__dirname, '../DATASET/pexels-progress.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

function cleanPlaceName(name) {
  if (!name) return '';
  return name
    .replace(/^(Go Clubbing by the|Engage in the Adventures of|Marvel at the|Capture the Sceneries of|Take a Glimpse of|Visit the|Explore the|Walk through|Experience the|Enjoy the|Discover the|Admire the|Witness the|Stroll through|Spend time at|Relax at|Pray at|Hike to|Trek to|Climb to|Ride at)\s+/i, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

// ─── Cache ───────────────────────────────────────────────────────────────────
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { cache = {}; }
}

function saveCache() {
  try { fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8'); } catch (e) {
    console.warn('⚠️ Cache write failed, retrying...', e.message);
    try { delay(500); fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8'); } catch {}
  }
}

// ─── Pexels API ──────────────────────────────────────────────────────────────
let apiRequestsThisRun = 0;
let rateLimitRemaining = 200;

function pexelsSearch(query) {
  return new Promise(resolve => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`;
    const req = https.get(url, { headers: { 'Authorization': PEXELS_API_KEY } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        apiRequestsThisRun++;
        const remaining = parseInt(res.headers['x-ratelimit-remaining'] || '100', 10);
        rateLimitRemaining = remaining;
        if (res.statusCode === 200) {
          try { resolve({ ok: true, photos: JSON.parse(data).photos || [], remaining }); }
          catch { resolve({ ok: false, photos: [], remaining }); }
        } else if (res.statusCode === 429) {
          resolve({ ok: false, rateLimit: true, photos: [], remaining: 0 });
        } else {
          resolve({ ok: false, photos: [], remaining });
        }
      });
    });
    req.on('error', () => resolve({ ok: false, photos: [], remaining: rateLimitRemaining }));
  });
}

function validateUrl(url) {
  if (!url || !url.startsWith('https://')) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 5000 }, res => {
        resolve(res.statusCode === 200 && (res.headers['content-type'] || '').includes('image'));
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch { resolve(false); }
  });
}

// ─── Scoring ─────────────────────────────────────────────────────────────────
function scorePhoto(photo, cleanName, cityName, stateName, category, usedIds) {
  let score = 0;
  const alt = (photo.alt || '').toLowerCase();
  const nameWords = cleanName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const nameLower = cleanName.toLowerCase();

  // Full name match in alt text
  if (alt.includes(nameLower)) score += 55;
  else {
    let matched = 0;
    nameWords.forEach(w => { if (alt.includes(w)) matched++; });
    if (nameWords.length > 0) score += (matched / nameWords.length) * 35;
  }

  // City/state/category in alt
  if (cityName && alt.includes(cityName.toLowerCase())) score += 20;
  if (stateName && alt.includes(stateName.toLowerCase())) score += 15;
  if (category && alt.includes(category.toLowerCase())) score += 10;

  // Query confidence bonus
  score += 15;

  // Category mismatch penalties
  const cat = (category || '').toLowerCase();
  if (cat === 'waterfall' && (alt.includes('beach') || alt.includes('desert'))) score -= 40;
  if (cat === 'beach' && (alt.includes('snow') || alt.includes('mountain'))) score -= 40;
  if (cat === 'spiritual' && (alt.includes('nightclub') || alt.includes('casino'))) score -= 50;

  // Duplicate penalty
  if (usedIds.has(photo.id)) score -= 30;

  return score;
}

// ─── Determine if cache entry is genuinely evaluated ─────────────────────────
function isGenuinelyEvaluated(entry) {
  if (!entry) return false;
  // Successfully replaced = genuinely evaluated
  if (entry.status === 'replaced' && entry.pexels_photo_id) return true;
  // Weak match with a real score > 0 and a real query = genuinely evaluated
  if (entry.match_type === 'weak' && entry.match_score > 0 && entry.query_used && entry.query_used.length > 5) return true;
  // match_type=relevant but kept = genuinely evaluated
  if (entry.match_type === 'relevant' && entry.status === 'kept_existing' && entry.match_score >= 40) return true;
  // none/other with score -100 or 0 and empty query = quota blocked
  if (entry.match_type === 'none' && (!entry.query_used || entry.query_used === '')) return false;
  if (entry.match_score <= 0 && (!entry.query_used || entry.query_used === '')) return false;
  // If it has a real query and a real score, it was genuinely evaluated
  if (entry.query_used && entry.query_used.length > 5 && entry.match_score > 10) return true;
  return false;
}

// ─── Process One Place ───────────────────────────────────────────────────────
async function processPlace(place, cityMap, stateMap, usedIds) {
  const cityObj = cityMap.get(place.city_id);
  const cityName = cityObj ? cityObj.name : '';
  const stateName = cityObj && stateMap.get(cityObj.state_id) ? stateMap.get(cityObj.state_id).name : '';
  const category = place.category || 'tourist attraction';
  const cleanName = cleanPlaceName(place.name);

  const queries = [
    `${cleanName} ${cityName} ${stateName} India`,
    `${cleanName} ${cityName} India`,
    `${cleanName} ${stateName} India`,
    `${cityName} ${stateName} ${category} India`,
    `${stateName} India ${category}`
  ];

  let bestPhoto = null, bestScore = -100, bestQuery = '', matchType = 'none';

  for (const q of queries) {
    if (rateLimitRemaining <= 5) {
      return { quotaExhausted: true };
    }
    await delay(350); // Safe throttle
    const res = await pexelsSearch(q);
    if (res.rateLimit) return { quotaExhausted: true };

    if (res.photos && res.photos.length > 0) {
      for (const photo of res.photos) {
        const s = scorePhoto(photo, cleanName, cityName, stateName, category, usedIds);
        if (s > bestScore) { bestScore = s; bestPhoto = photo; bestQuery = q; }
      }
      if (bestScore >= 60) break;
    }
  }

  const oldImage = place.cover_image;
  let status = 'kept_existing', finalUrl = oldImage, photoId = null;
  let pexelsUrl = '', photographer = '', photographerUrl = '';

  if (bestPhoto && bestScore >= 60) {
    matchType = bestScore >= 75 ? 'exact' : 'relevant';
    const candidateUrl = bestPhoto.src.large2x || bestPhoto.src.large || bestPhoto.src.landscape;
    const valid = await validateUrl(candidateUrl);
    if (valid) {
      status = 'replaced';
      finalUrl = candidateUrl;
      photoId = bestPhoto.id;
      pexelsUrl = bestPhoto.url;
      photographer = bestPhoto.photographer;
      photographerUrl = bestPhoto.photographer_url;
      usedIds.add(photoId);
    }
  } else if (bestScore >= 30) {
    matchType = 'weak';
  }

  return {
    place_id: place.id, place_name: place.name, city: cityName, state: stateName,
    query_used: bestQuery, pexels_photo_id: photoId,
    old_image_url: oldImage, new_image_url: finalUrl,
    pexels_page_url: pexelsUrl, photographer, photographer_url: photographerUrl,
    match_score: bestScore, match_type: matchType, status,
    processed_at: new Date().toISOString(), genuinely_evaluated: true
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('WANDERSPHERE PEXELS ENRICHMENT — RESUMABLE BATCH RUN');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Load dataset
  const content = fs.readFileSync(DATA_PATH, 'utf8');
  const states = JSON.parse(content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/)[1]);
  const cities = JSON.parse(content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/)[1]);
  const places = JSON.parse(content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/)[1]);
  const stateMap = new Map(states.map(s => [s.id, s]));
  const cityMap = new Map(cities.map(c => [c.id, c]));

  console.log(`Total places: ${places.length}`);

  // Build used photo IDs set
  const usedIds = new Set();
  Object.values(cache).forEach(e => { if (e.pexels_photo_id) usedIds.add(e.pexels_photo_id); });

  // Determine which places need processing
  const needsProcessing = [];
  let alreadyDone = 0;
  places.forEach(p => {
    const entry = cache[p.id];
    if (entry && isGenuinelyEvaluated(entry)) {
      alreadyDone++;
    } else {
      needsProcessing.push(p);
    }
  });

  console.log(`Already genuinely evaluated: ${alreadyDone}`);
  console.log(`Needs processing this run: ${needsProcessing.length}\n`);

  if (needsProcessing.length === 0) {
    console.log('✅ ALL 3,727 PLACES HAVE BEEN GENUINELY EVALUATED!');
    await finalize(places, states, cities, content);
    return;
  }

  // Process in batches
  const BATCH_SIZE = 50;
  let processed = 0, replaced = 0, kept = 0, quotaStop = false;

  for (let i = 0; i < needsProcessing.length; i++) {
    const p = needsProcessing[i];
    const result = await processPlace(p, cityMap, stateMap, usedIds);

    if (result.quotaExhausted) {
      console.log('\n⚠️ PEXELS QUOTA EXHAUSTED — STOPPING SAFELY');
      quotaStop = true;
      break;
    }

    cache[p.id] = result;
    if (result.status === 'replaced') replaced++;
    else kept++;
    processed++;

    if (processed % BATCH_SIZE === 0 || i === needsProcessing.length - 1) {
      saveCache();
      const totalDone = alreadyDone + processed;
      console.log(`[${totalDone}/${places.length}] Batch progress — Replaced: ${replaced} | Kept: ${kept} | API reqs: ${apiRequestsThisRun} | Remaining quota: ${rateLimitRemaining}`);
    }
  }

  saveCache();

  // Count final state
  let finalDone = 0, finalReplaced = 0, finalKept = 0, finalPending = 0;
  places.forEach(p => {
    const e = cache[p.id];
    if (e && isGenuinelyEvaluated(e)) {
      finalDone++;
      if (e.status === 'replaced') finalReplaced++;
      else finalKept++;
    } else {
      finalPending++;
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  if (finalPending === 0) {
    console.log('✅ FULL DATASET COMPLETE — ALL 3,727 PLACES EVALUATED');
  } else {
    console.log('⏳ PARTIAL — RESUME REQUIRED');
  }
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Genuinely evaluated: ${finalDone} / ${places.length}`);
  console.log(`Pexels replacements: ${finalReplaced}`);
  console.log(`Existing images kept: ${finalKept}`);
  console.log(`Pending (need more API quota): ${finalPending}`);
  console.log(`API requests this run: ${apiRequestsThisRun}`);
  console.log(`Unique Pexels photos: ${usedIds.size}`);

  // Save progress metadata
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
    total: places.length, evaluated: finalDone, replaced: finalReplaced,
    kept: finalKept, pending: finalPending, lastRun: new Date().toISOString(),
    apiRequestsThisRun, quotaStopped: quotaStop
  }, null, 2), 'utf8');

  if (finalPending === 0) {
    await finalize(places, states, cities, content);
  }
}

async function finalize(places, states, cities, content) {
  console.log('\n🔄 Finalizing — updating generatedData.ts with all Pexels images...');

  let exactCount = 0, relevantCount = 0, keptCount = 0;
  const usedPhotos = new Set();

  places.forEach(p => {
    const e = cache[p.id];
    if (e && e.status === 'replaced' && e.new_image_url) {
      p.cover_image = e.new_image_url;
      p.images = [e.new_image_url];
      if (e.match_type === 'exact') exactCount++;
      else relevantCount++;
      if (e.pexels_photo_id) usedPhotos.add(e.pexels_photo_id);
    } else {
      keptCount++;
    }
  });

  const code = `// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED — DO NOT EDIT MANUALLY
// ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════════════════════════════

import type { State, City, Place } from '../types';

export const generatedStates: State[] = ${JSON.stringify(states, null, 2)};

export const generatedCities: City[] = ${JSON.stringify(cities, null, 2)};

export const generatedPlaces: Place[] = ${JSON.stringify(places, null, 2)};

export const cityTransportInfo: Record<string, { airport?: string; railway?: string; bus?: string }> = {
  "Bengaluru": { airport: "Kempegowda International Airport (BLR)", railway: "KSR Bengaluru City Junction (SBC)", bus: "Majestic Bus Stand (KBS)" },
  "Mumbai": { airport: "Chhatrapati Shivaji Maharaj International Airport (BOM)", railway: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", bus: "Mumbai Central Bus Station" },
  "Delhi": { airport: "Indira Gandhi International Airport (DEL)", railway: "New Delhi Railway Station (NDLS)", bus: "ISBT Kashmiri Gate" },
  "Chennai": { airport: "Chennai International Airport (MAA)", railway: "Chennai Central (MAS)", bus: "CMBT Koyambedu" },
  "Kolkata": { airport: "Netaji Subhash Chandra Bose International Airport (CCU)", railway: "Howrah Junction (HWH)", bus: "Esplanade Bus Station" },
  "Hyderabad": { airport: "Rajiv Gandhi International Airport (HYD)", railway: "Secunderabad Junction (SC)", bus: "MGBS Hyderabad" },
  "Jaipur": { airport: "Jaipur International Airport (JAI)", railway: "Jaipur Junction (JP)", bus: "Sindhi Camp Bus Stand" },
  "Kochi": { airport: "Cochin International Airport (COK)", railway: "Ernakulam Junction (ERS)", bus: "KSRTC Bus Stand Ernakulam" },
  "Visakhapatnam": { airport: "Visakhapatnam International Airport (VTZ)", railway: "Visakhapatnam Junction (VSKP)", bus: "RTC Complex Bus Station" },
  "Ahmedabad": { airport: "Sardar Vallabhbhai Patel International Airport (AMD)", railway: "Ahmedabad Junction (ADI)", bus: "GSRTC Geeta Mandir Bus Station" },
  "Theni": { airport: "Madurai International Airport (IXM - 85 km)", railway: "Theni Railway Station (TNI)", bus: "Theni Central Bus Stand" }
};
`;
  fs.writeFileSync(DATA_PATH, code, 'utf8');

  // Audit CSV
  const auditH = 'place_id,place_name,city,state,old_image_url,new_image_url,pexels_photo_id,pexels_url,photographer,photographer_url,query_used,match_type,match_score,action,status\n';
  const auditRows = Object.values(cache).map(e => [
    `"${e.place_id}"`, `"${(e.place_name||'').replace(/"/g,'""')}"`, `"${(e.city||'').replace(/"/g,'""')}"`,
    `"${(e.state||'').replace(/"/g,'""')}"`, `"${e.old_image_url||''}"`, `"${e.new_image_url||''}"`,
    `"${e.pexels_photo_id||''}"`, `"${e.pexels_page_url||''}"`, `"${(e.photographer||'').replace(/"/g,'""')}"`,
    `"${e.photographer_url||''}"`, `"${(e.query_used||'').replace(/"/g,'""')}"`, `"${e.match_type}"`,
    e.match_score, `"${e.status==='replaced'?(e.match_type==='exact'?'REPLACED_EXACT':'REPLACED_RELEVANT'):'KEPT_EXISTING'}"`,
    `"${e.status}"`
  ].join(','));
  fs.writeFileSync(AUDIT_CSV, auditH + auditRows.join('\n'), 'utf8');

  // Review CSV
  const revH = 'place_id,place_name,city,state,match_score,reason\n';
  const revRows = Object.values(cache).filter(e => e.status !== 'replaced').map(e => [
    `"${e.place_id}"`, `"${(e.place_name||'').replace(/"/g,'""')}"`, `"${(e.city||'').replace(/"/g,'""')}"`,
    `"${(e.state||'').replace(/"/g,'""')}"`, e.match_score,
    `"${e.match_score < 30 ? 'NO_SUITABLE_PEXELS_IMAGE' : 'LOW_CONFIDENCE'}"`
  ].join(','));
  fs.writeFileSync(REVIEW_CSV, revH + revRows.join('\n'), 'utf8');

  console.log(`\n✅ Dataset updated: Exact=${exactCount} Relevant=${relevantCount} Kept=${keptCount} UniquePhotos=${usedPhotos.size}`);
  console.log(`Audit CSV: ${AUDIT_CSV}`);
  console.log(`Review CSV: ${REVIEW_CSV}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
