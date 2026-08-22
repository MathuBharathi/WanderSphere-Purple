const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local
const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.error('❌ ERROR: PEXELS_API_KEY is not defined in .env.local!');
  process.exit(1);
}

// ─── Paths ───────────────────────────────────────────────────────────────────
const generatedDataPath = path.join(__dirname, '../src/data/generatedData.ts');
const cachePath = path.join(__dirname, '../DATASET/pexels-image-cache.json');
const auditCsvPath = path.join(__dirname, '../DATASET/WanderSphere_Pexels_Image_Audit.csv');
const reviewCsvPath = path.join(__dirname, '../DATASET/WanderSphere_Image_Needs_Review.csv');

// ─── Load Cache ──────────────────────────────────────────────────────────────
let cache = {};
if (fs.existsSync(cachePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    cache = {};
  }
}

function saveCache() {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

// ─── Pexels API Helper ───────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanPlaceName(name) {
  if (!name) return '';
  let cleaned = name.replace(/^(Go Clubbing by the|Engage in the Adventures of|Marvel at the|Capture the Sceneries of|Take a Glimpse of|Visit the|Explore the|Walk through|Experience the)\s+/i, '');
  cleaned = cleaned.replace(/\s*\((.*?)\)/g, ''); // remove parentheses for query clean
  return cleaned.trim();
}

async function searchPexels(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=10&orientation=landscape`;

  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'Authorization': PEXELS_API_KEY,
        'User-Agent': 'WanderSphere-Enricher/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const remaining = res.headers['x-ratelimit-remaining'];
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: true, photos: parsed.photos || [], remaining: parseInt(remaining || '100', 10) });
          } catch {
            resolve({ success: false, photos: [], remaining: 100 });
          }
        } else if (res.statusCode === 429) {
          console.warn('⚠️ Pexels Rate Limit Hit (429)!');
          resolve({ success: false, rateLimit: true, photos: [], remaining: 0 });
        } else {
          resolve({ success: false, photos: [], remaining: 100 });
        }
      });
    });

    req.on('error', () => resolve({ success: false, photos: [], remaining: 100 }));
  });
}

// Validate image URL with HTTP HEAD request
async function validateImageUrl(url) {
  if (!url || !url.startsWith('https://')) return false;
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        const is200 = res.statusCode === 200;
        const isImage = (res.headers['content-type'] || '').includes('image');
        resolve(is200 && isImage);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

// ─── Score Matching Algorithm ─────────────────────────────────────────────────
function scorePhoto(photo, place, query, usedPhotoIds) {
  let score = 0;
  const altText = (photo.alt || photo.url || '').toLowerCase();
  const cleanName = cleanPlaceName(place.name).toLowerCase();
  const cityNameLower = (place.city_name || '').toLowerCase();
  const stateNameLower = (place.state_name || '').toLowerCase();
  const categoryLower = (place.category || '').toLowerCase();

  // Name match
  const placeWords = cleanName.split(/\s+/).filter(w => w.length > 2);
  let matchedWordCount = 0;
  placeWords.forEach(w => {
    if (altText.includes(w)) matchedWordCount++;
  });

  if (altText.includes(cleanName)) {
    score += 55;
  } else if (matchedWordCount > 0 && placeWords.length > 0) {
    score += (matchedWordCount / placeWords.length) * 40;
  }

  // City match
  if (cityNameLower && altText.includes(cityNameLower)) {
    score += 20;
  }

  // State match
  if (stateNameLower && altText.includes(stateNameLower)) {
    score += 15;
  }

  // Category match
  if (categoryLower && altText.includes(categoryLower)) {
    score += 10;
  }

  // If photo returns from direct search query, add query confidence
  if (query.toLowerCase().includes(cleanName)) {
    score += 15;
  }

  // Negative penalty for obvious category mismatch
  if (categoryLower === 'waterfall' && (altText.includes('beach') || altText.includes('fort') || altText.includes('desert'))) {
    score -= 40;
  }
  if (categoryLower === 'beach' && (altText.includes('mountain') || altText.includes('snow') || altText.includes('waterfall'))) {
    score -= 40;
  }
  if (categoryLower === 'spiritual' && (altText.includes('nightclub') || altText.includes('bar') || altText.includes('casino'))) {
    score -= 50;
  }

  // Penalty if photo already used
  if (usedPhotoIds.has(photo.id)) {
    score -= 30;
  }

  return score;
}

// ─── Process Single Place ─────────────────────────────────────────────────────
async function processPlace(place, cityMap, stateMap, usedPhotoIds) {
  if (cache[place.id] && cache[place.id].status) {
    if (cache[place.id].pexels_photo_id) {
      usedPhotoIds.add(cache[place.id].pexels_photo_id);
    }
    return cache[place.id];
  }

  const cityName = place.city_name || (cityMap.get(place.city_id) ? cityMap.get(place.city_id).name : '');
  const cityObj = cityMap.get(place.city_id);
  const stateName = place.state_name || (cityObj && stateMap.get(cityObj.state_id) ? stateMap.get(cityObj.state_id).name : '');
  const category = place.category || 'tourist attraction';
  const cleanName = cleanPlaceName(place.name);

  place.city_name = cityName;
  place.state_name = stateName;

  const queries = [
    `${cleanName}, ${cityName}, ${stateName}, India`,
    `${cleanName}, ${cityName}, India`,
    `${cleanName}, ${stateName}, India`,
    `${cityName}, ${stateName}, India ${category}`,
    `${stateName}, India ${category}`
  ];

  let bestPhoto = null;
  let bestScore = -100;
  let bestQuery = '';
  let matchType = 'none';

  for (const q of queries) {
    await delay(200);
    const searchRes = await searchPexels(q);

    if (searchRes.rateLimit) {
      console.warn('⚠️ Rate limit hit. Pausing batch.');
      break;
    }

    if (searchRes.photos && searchRes.photos.length > 0) {
      for (const photo of searchRes.photos) {
        const score = scorePhoto(photo, place, q, usedPhotoIds);
        if (score > bestScore) {
          bestScore = score;
          bestPhoto = photo;
          bestQuery = q;
        }
      }
      if (bestScore >= 60) break; // Good match found
    }
  }

  const oldImage = place.cover_image;
  let decision = 'kept_existing';
  let finalImageUrl = oldImage;
  let pexelsPageUrl = '';
  let photographer = '';
  let photographerUrl = '';
  let photoId = null;

  if (bestPhoto) {
    if (bestScore >= 75) matchType = 'exact';
    else if (bestScore >= 60) matchType = 'relevant';
    else matchType = 'weak';

    if (bestScore >= 60) {
      const candidateUrl = bestPhoto.src.large2x || bestPhoto.src.large || bestPhoto.src.landscape || bestPhoto.src.medium;
      const isValid = await validateImageUrl(candidateUrl);
      if (isValid) {
        decision = 'replaced';
        finalImageUrl = candidateUrl;
        photoId = bestPhoto.id;
        pexelsPageUrl = bestPhoto.url;
        photographer = bestPhoto.photographer;
        photographerUrl = bestPhoto.photographer_url;
        usedPhotoIds.add(bestPhoto.id);
      }
    }
  }

  const resultRecord = {
    place_id: place.id,
    place_name: place.name,
    city: cityName,
    state: stateName,
    query_used: bestQuery,
    pexels_photo_id: photoId,
    old_image_url: oldImage,
    new_image_url: finalImageUrl,
    pexels_page_url: pexelsPageUrl,
    photographer: photographer,
    photographer_url: photographerUrl,
    match_score: bestScore,
    match_type: matchType,
    status: decision,
    processed_at: new Date().toISOString()
  };

  cache[place.id] = resultRecord;
  saveCache();
  return resultRecord;
}

// ─── Export Main Functions ────────────────────────────────────────────────────
module.exports = {
  processPlace,
  saveCache,
  cachePath,
  auditCsvPath,
  reviewCsvPath,
  generatedDataPath
};
