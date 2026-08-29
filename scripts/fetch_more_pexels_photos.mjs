import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/PEXELS_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

if (!apiKey) {
  console.error('No API key');
  process.exit(1);
}

const cachePath = path.resolve(__dirname, 'pexels_search_cache.json');
let pexelsCache = {};
if (fs.existsSync(cachePath)) {
  pexelsCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
}

const searchTerms = [
  'India waterfall', 'India temple', 'India fort', 'India beach', 'India mountain',
  'India heritage', 'India nature', 'India lake', 'India market', 'India garden',
  'India monument', 'India river', 'India forest', 'India palace', 'India street',
  'India valley', 'India museum', 'India sunset', 'India architecture', 'India landscape',
  'Kerala travel', 'Tamil Nadu travel', 'Rajasthan travel', 'Himachal travel',
  'Karnataka travel', 'Goa travel', 'Maharashtra travel', 'Uttarakhand travel',
  'Ladakh travel', 'Kashmir travel', 'Delhi travel', 'Mumbai travel',
  'Indian food', 'Indian bazaar', 'Indian sculpture', 'Indian hill station'
];

async function run() {
  console.log(`Starting expanded photo pool fetch across ${searchTerms.length} queries...`);
  let addedCount = 0;

  for (let t = 0; t < searchTerms.length; t++) {
    const term = searchTerms[t];
    for (let page = 1; page <= 4; page++) {
      const qKey = `${term.toLowerCase()} page ${page}`;
      if (pexelsCache[qKey]) continue;

      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=80&page=${page}&orientation=landscape`;
      try {
        const res = await fetch(url, {
          headers: { Authorization: apiKey }
        });

        if (res.status === 429) {
          console.warn('Rate limit 429. Sleeping 60s...');
          await new Promise(r => setTimeout(r, 60000));
          page--; // retry
          continue;
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
          pexelsCache[qKey] = photos;
          addedCount += photos.length;
          fs.writeFileSync(cachePath, JSON.stringify(pexelsCache, null, 2), 'utf8');
          await new Promise(r => setTimeout(r, 300));
        }
      } catch (err) {
        console.error(`Error fetching "${term}" page ${page}:`, err.message);
      }
    }
    console.log(`Fetched query ${t+1}/${searchTerms.length}: "${term}"`);
  }

  console.log(`Expansion complete. Added ${addedCount} new candidate photos to cache.`);
}

run();
