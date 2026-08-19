import type { Place, City, GeneratedItinerary, ItineraryConfig, ItineraryDay, TimeSlot } from '../types';
import { places, cities } from '../data/travelData';

// Distance calculation helper (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function generateItinerary(config: ItineraryConfig): GeneratedItinerary {
  const { cityId, days, budget, travelStyle } = config;

  // 1. Fetch and filter places for this city
  const cityPlaces = places.filter((p) => p.city_id === cityId);

  // Separate food recommendations
  const foodPlaces = cityPlaces.filter((p) => p.category === 'food');
  const activityPlaces = cityPlaces.filter((p) => p.category !== 'food');

  // 2. Score places based on travel style and budget preferences
  const scoredPlaces = activityPlaces
    .map((place) => {
      let score = place.avg_rating || 4.0;

      // Category matches for travel style
      const category = place.category?.toLowerCase() || '';
      const tags = place.tags?.map((t) => t.toLowerCase()) || [];

      if (travelStyle === 'adventure') {
        if (category === 'adventure' || category === 'nature' || category === 'wildlife' || category === 'waterfall') {
          score += 2.0;
        }
        if (tags.includes('trekking') || tags.includes('rafting') || tags.includes('climbing') || tags.includes('safari')) {
          score += 1.5;
        }
      } else if (travelStyle === 'spiritual') {
        if (category === 'spiritual' || category === 'temple' || tags.includes('spiritual') || tags.includes('holy')) {
          score += 2.5;
        }
      } else if (travelStyle === 'family') {
        if (category === 'park' || category === 'museum' || category === 'historical' || category === 'cultural' || category === 'shopping') {
          score += 1.5;
        }
        if (place.safety_rating && place.safety_rating >= 4.5) {
          score += 1.0;
        }
        if (place.crowd_level === 'high') {
          score -= 0.5; // Families prefer less crowded places
        }
      } else if (travelStyle === 'couple') {
        if (category === 'beach' || category === 'photography' || category === 'nature' || category === 'lake' || category === 'hill_station') {
          score += 2.0;
        }
        if (tags.includes('sunset') || tags.includes('romantic') || tags.includes('views') || tags.includes('peaceful')) {
          score += 1.5;
        }
      } else if (travelStyle === 'budget') {
        if (place.entry_fee === 0) {
          score += 2.0;
        } else if (place.entry_fee && place.entry_fee < 100) {
          score += 1.0;
        }
      } else if (travelStyle === 'luxury') {
        if (place.entry_fee && place.entry_fee >= 200) {
          score += 1.0; // Luxury travelers value premium ticketed locations
        }
        if (tags.includes('palace') || tags.includes('spa') || tags.includes('resort') || tags.includes('premium')) {
          score += 1.5;
        }
      }

      // Hidden gems preference (except for strict popular/famous queries)
      if (place.is_hidden_gem) {
        if (travelStyle === 'solo' || travelStyle === 'adventure') {
          score += 1.5; // Solo and adventure travelers love hidden gems
        } else {
          score += 0.5;
        }
      }

      // Budget filtering
      if (budget === 'budget' && place.entry_fee && place.entry_fee > 300) {
        score -= 3.0; // Penalize high entry fee places for budget config
      }

      return { place, score };
    })
    .sort((a, b) => b.score - a.score);

  // Pool of available places
  let availableActivities = [...scoredPlaces];
  let availableFood = [...foodPlaces].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  const itineraryDays: ItineraryDay[] = [];
  let totalEstimatedBudget = 0;
  let hiddenGemsCount = 0;
  let placesUsed = new Set<string>();

  // Helper to get next closest place
  const getNextClosestPlace = (currentLat: number, currentLng: number): { place: Place; index: number } | null => {
    if (availableActivities.length === 0) return null;

    let bestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < availableActivities.length; i++) {
      const p = availableActivities[i].place;
      const dist = getDistance(currentLat, currentLng, p.latitude, p.longitude);
      // Combine distance penalty and score weight
      const weightedScore = availableActivities[i].score - dist * 0.15; // 0.15 score penalty per km
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      }
    }

    const item = availableActivities[bestIdx];
    return { place: item.place, index: bestIdx };
  };

  // 3. Build Day-by-Day itinerary slots
  for (let d = 1; d <= days; d++) {
    const slots: TimeSlot[] = [];
    let dayLat: number | null = null;
    let dayLng: number | null = null;
    let dayDistance = 0;
    let lastPlaceCoords: any = null;

    const addSlot = (label: 'morning' | 'afternoon' | 'evening', place: Place, time: string, duration: number, notes?: string) => {
      slots.push({
        time,
        label,
        place,
        duration,
        notes,
      });
      placesUsed.add(place.id);
      if (place.is_hidden_gem) hiddenGemsCount++;
      totalEstimatedBudget += place.entry_fee || 0;

      // Update distance tracking
      if (lastPlaceCoords) {
        const d = getDistance(lastPlaceCoords.lat, lastPlaceCoords.lng, place.latitude, place.longitude);
        dayDistance += d;
      }
      lastPlaceCoords = { lat: place.latitude, lng: place.longitude };
      if (dayLat === null) {
        dayLat = place.latitude;
        dayLng = place.longitude;
      }
    };

    // --- MORNING SLOT (9:00 AM) ---
    // Start morning with a high-rated major attraction or closest high-rated place
    if (availableActivities.length > 0) {
      // For Day 1, take the absolute top-scoring activity. For subsequent days, pick a high-scored one.
      const choice = availableActivities[0];
      availableActivities.splice(0, 1);
      addSlot('morning', choice.place, '09:00 AM', choice.place.avg_visit_duration || 120, 'Start your day exploring this famous landmark.');
    } else {
      // Fallback
      addSlot('morning', createFallbackPlace(cityId, 'morning'), '09:00 AM', 120, 'Explore the local streets and traditional breakfast joints.');
    }

    // --- LUNCH / AFTERNOON FOOD (1:00 PM) ---
    // Optional food slot if there is local cuisine in the dataset
    let foodItem: Place | null = null;
    if (availableFood.length > 0) {
      // Find closest food place to the morning activity
      let bestFoodIdx = 0;
      if (lastPlaceCoords) {
        let minFoodDist = Infinity;
        for (let i = 0; i < availableFood.length; i++) {
          const dist = getDistance(lastPlaceCoords.lat, lastPlaceCoords.lng, availableFood[i].latitude, availableFood[i].longitude);
          if (dist < minFoodDist) {
            minFoodDist = dist;
            bestFoodIdx = i;
          }
        }
      }
      foodItem = availableFood[bestFoodIdx];
      availableFood.splice(bestFoodIdx, 1);
      addSlot('afternoon', foodItem, '01:00 PM', 60, 'Enjoy local culinary specialties and traditional delicacies.');
    }

    // --- AFTERNOON SLOT (2:30 PM) ---
    // Find closest activity to last location (either lunch or morning place)
    if (lastPlaceCoords) {
      const next = getNextClosestPlace(lastPlaceCoords.lat, lastPlaceCoords.lng);
      if (next) {
        availableActivities.splice(next.index, 1);
        addSlot('afternoon', next.place, '02:30 PM', next.place.avg_visit_duration || 150, 'Continue your exploration with this wonderful destination.');
      } else {
        addSlot('afternoon', createFallbackPlace(cityId, 'afternoon'), '02:30 PM', 120, 'Leisurely walk in local markets or visit nearby craft workshops.');
      }
    }

    // --- EVENING SLOT (6:00 PM) ---
    // Sunset point, beach, cultural activity or market
    if (lastPlaceCoords) {
      // Filter available specifically for evening themes if possible, otherwise nearest
      let eveningIdx = -1;
      for (let i = 0; i < availableActivities.length; i++) {
        const p = availableActivities[i].place;
        if (p.tags?.some(t => ['sunset', 'nightlife', 'evening', 'beach', 'market'].includes(t.toLowerCase()))) {
          eveningIdx = i;
          break;
        }
      }

      if (eveningIdx !== -1) {
        const next = availableActivities[eveningIdx];
        availableActivities.splice(eveningIdx, 1);
        addSlot('evening', next.place, '06:00 PM', next.place.avg_visit_duration || 90, 'Wind down the day with these stunning evening views.');
      } else {
        const next = getNextClosestPlace(lastPlaceCoords.lat, lastPlaceCoords.lng);
        if (next) {
          availableActivities.splice(next.index, 1);
          addSlot('evening', next.place, '06:00 PM', next.place.avg_visit_duration || 90, 'Explore this beautiful area as day transitions to dusk.');
        } else {
          addSlot('evening', createFallbackPlace(cityId, 'evening'), '06:00 PM', 90, 'Relax at a local street market and enjoy a sunset view.');
        }
      }
    }

    itineraryDays.push({
      dayNumber: d,
      title: `Day ${d}: ${slots[0]?.place?.name || 'Local'} & surrounds`,
      slots,
      totalDistance: Math.round(dayDistance * 10) / 10,
    });
  }

  // Adjust estimated budget level
  const baseDailyCost = budget === 'budget' ? 800 : budget === 'moderate' ? 2000 : 5000;
  const estimatedBudget = totalEstimatedBudget + baseDailyCost * days;

  return {
    id: `itinerary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    config,
    days: itineraryDays,
    totalPlaces: placesUsed.size,
    hiddenGemsCount,
    estimatedBudget,
    createdAt: new Date().toISOString(),
  };
}

// Generate fallback placeholder places when custom city list is empty
function createFallbackPlace(cityId: string, slot: 'morning' | 'afternoon' | 'evening'): Place {
  const city = cities.find(c => c.id === cityId);
  const cityName = city?.name || 'Local Area';

  if (slot === 'morning') {
    return {
      id: `fallback-morning-${cityId}`,
      city_id: cityId,
      name: 'Local Heritage Walk & Breakfast',
      description: `Embark on a self-guided walking tour around the oldest streets of ${cityName}. Stop by traditional bakeries or street vendor stalls to try local breakfast delicacies.`,
      category: 'cultural',
      cover_image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800',
      latitude: city?.latitude || 20.0,
      longitude: city?.longitude || 77.0,
      avg_rating: 4.5,
      review_count: 120,
      avg_visit_duration: 120,
      tags: ['walking', 'breakfast', 'culture'],
    };
  } else if (slot === 'afternoon') {
    return {
      id: `fallback-afternoon-${cityId}`,
      city_id: cityId,
      name: 'Artisan & Craft Bazaar',
      description: `Visit the central shopping area of ${cityName} to view local handicrafts, handloom textiles, and witness local master craftsmen at work. Great opportunity for souvenirs.`,
      category: 'shopping',
      cover_image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800',
      latitude: (city?.latitude || 20.0) + 0.01,
      longitude: (city?.longitude || 77.0) + 0.01,
      avg_rating: 4.3,
      review_count: 85,
      avg_visit_duration: 120,
      tags: ['shopping', 'handicrafts', 'local'],
    };
  } else {
    return {
      id: `fallback-evening-${cityId}`,
      city_id: cityId,
      name: 'Sunset Viewpoint & Street Food Trail',
      description: `Find a local hilltop, bridge or park to catch the beautiful sunset over ${cityName}. Cap off the day by exploring the popular night food stalls.`,
      category: 'food',
      cover_image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800',
      latitude: (city?.latitude || 20.0) - 0.01,
      longitude: (city?.longitude || 77.0) - 0.01,
      avg_rating: 4.6,
      review_count: 150,
      avg_visit_duration: 90,
      tags: ['sunset', 'street food', 'nightlife'],
    };
  }
}
