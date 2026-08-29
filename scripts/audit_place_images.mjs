import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const places = extractArray('generatedPlaces');

let pexelsCount = 0;
let wikimediaCount = 0;
let unsplashCount = 0;
let otherCount = 0;
let missingCount = 0;

const urlMap = new Map();

places.forEach(p => {
  const url = p.cover_image || '';
  if (!url) {
    missingCount++;
  } else if (url.includes('images.pexels.com')) {
    pexelsCount++;
  } else if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
    wikimediaCount++;
  } else if (url.includes('unsplash.com')) {
    unsplashCount++;
  } else {
    otherCount++;
  }

  if (url) {
    const count = urlMap.get(url) || 0;
    urlMap.set(url, count + 1);
  }
});

let duplicateUrlCount = 0;
urlMap.forEach((count) => {
  if (count > 1) duplicateUrlCount++;
});

console.log('════════════════════════════════════════════════════════════════');
console.log('         WANDERSPHERE PLACE-LEVEL IMAGE AUDIT REPORT            ');
console.log('════════════════════════════════════════════════════════════════');
console.log(`Total Places Audited : ${places.length}`);
console.log('────────────────────────────────────────────────────────────────');
console.log(`Pexels Image URLs    : ${pexelsCount}`);
console.log(`Wikimedia Image URLs : ${wikimediaCount}`);
console.log(`Unsplash Image URLs  : ${unsplashCount}`);
console.log(`Other Image URLs     : ${otherCount}`);
console.log(`Missing Image URLs   : ${missingCount}`);
console.log('────────────────────────────────────────────────────────────────');
console.log(`Unique Photo URLs    : ${urlMap.size}`);
console.log(`Shared / Fallback URLs: ${duplicateUrlCount}`);
console.log('════════════════════════════════════════════════════════════════\n');
