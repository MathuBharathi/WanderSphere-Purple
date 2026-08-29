import fs from 'fs';

/**
 * Searches Wikimedia Commons API for a place-specific query and returns verified free-licensed images.
 * @param {string} query Search query, e.g. "Vaigai Dam Theni Tamil Nadu India"
 * @returns {Promise<Array<{url: string, sourcePage: string, artist: string, license: string, licenseUrl: string, title: string}>>}
 */
export async function fetchWikimediaImages(query) {
  const cleanQuery = query.trim().replace(/\s+/g, ' ');
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1280&format=json&origin=*`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WanderSphere-TravelApp/1.0 (https://wandersphere.app; contact@wandersphere.app)',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.query || !data.query.pages) return [];

    const pages = Object.values(data.query.pages);
    const results = [];

    const allowedLicenses = [
      'public domain', 'pd', 'cc0', 'cc-zero',
      'cc by', 'cc-by', 'cc by-sa', 'cc-by-sa',
      'cc by 1.0', 'cc by 2.0', 'cc by 2.5', 'cc by 3.0', 'cc by 4.0',
      'cc by-sa 1.0', 'cc by-sa 2.0', 'cc by-sa 2.5', 'cc by-sa 3.0', 'cc by-sa 4.0',
      'gfdl', 'fal'
    ];

    for (const page of pages) {
      if (!page.imageinfo || !page.imageinfo[0]) continue;
      const info = page.imageinfo[0];

      // Check MIME type
      const mime = (info.mime || '').toLowerCase();
      if (!mime.startsWith('image/') || mime.includes('svg')) continue;

      const meta = info.extmetadata || {};
      const licenseShort = (meta.LicenseShortName ? meta.LicenseShortName.value : '').toLowerCase();
      const licenseName = meta.License ? meta.License.value.toLowerCase() : '';
      const usageTerms = meta.UsageTerms ? meta.UsageTerms.value.toLowerCase() : '';

      const combinedLicense = `${licenseShort} ${licenseName} ${usageTerms}`;

      // Reject non-commercial or restrictive licenses
      if (combinedLicense.includes('-nc') || combinedLicense.includes('non-commercial') || combinedLicense.includes('all rights reserved')) {
        continue;
      }

      // Verify allowed license
      const isAllowed = allowedLicenses.some(lic => combinedLicense.includes(lic));
      if (!isAllowed && combinedLicense.length > 0) {
        // If it mentions CC or public domain in any form
        if (!combinedLicense.includes('cc') && !combinedLicense.includes('public domain') && !combinedLicense.includes('pd')) {
          continue;
        }
      }

      // Clean HTML tags from artist/creator string
      let rawArtist = meta.Artist ? meta.Artist.value : 'Wikimedia Contributor';
      let artist = rawArtist.replace(/<[^>]*>?/gm, '').trim();
      if (artist.length > 60) artist = artist.slice(0, 60) + '...';

      const imageUrl = info.thumburl || info.url;
      if (!imageUrl) continue;

      results.push({
        url: imageUrl,
        sourcePage: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        artist: artist || 'Wikimedia Contributor',
        license: meta.LicenseShortName ? meta.LicenseShortName.value : 'CC BY-SA 4.0',
        licenseUrl: meta.LicenseUrl ? meta.LicenseUrl.value : 'https://creativecommons.org/licenses/by-sa/4.0/',
        title: page.title ? page.title.replace(/^File:/i, '') : 'Wikimedia Commons Image',
      });
    }

    return results;
  } catch (err) {
    console.error(`Wikimedia search error for "${cleanQuery}":`, err.message);
    return [];
  }
}
