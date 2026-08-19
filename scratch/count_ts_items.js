const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'generatedData.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Count states
const statesMatch = content.match(/export const generatedStates: State\[\] = (\[[\s\S]*?\]);/);
const states = JSON.parse(statesMatch[1]);
console.log('generatedStates count:', states.length);

// Count cities
const citiesMatch = content.match(/export const generatedCities: City\[\] = (\[[\s\S]*?\]);/);
const cities = JSON.parse(citiesMatch[1]);
console.log('generatedCities count:', cities.length);

// Count places
const placesMatch = content.match(/export const generatedPlaces: Place\[\] = (\[[\s\S]*?\]);/);
const places = JSON.parse(placesMatch[1]);
console.log('generatedPlaces count:', places.length);
