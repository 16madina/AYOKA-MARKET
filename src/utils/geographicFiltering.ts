import { westAfricanCountries } from '@/data/westAfricaData';

const normalizeText = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    // Normalize fancy apostrophes to straight
    .replace(/[’‘]/g, "'")
    // Treat apostrophes and common separators as whitespace so
    // "Côte d'Ivoire" ~= "Cote d Ivoire" ~= "Côte d’Ivoire"
    .replace(/'/g, ' ')
    .replace(/[\-–—/,().]/g, ' ')
    // Remove diacritics (é -> e, ô -> o, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Aliases to make country matching robust (GPS / different locales)
const countryAliases: Record<string, string> = {
  // Côte d'Ivoire
  [normalizeText("Ivory Coast")]: "Côte d'Ivoire",
  [normalizeText("Cote d Ivoire")]: "Côte d'Ivoire",
  [normalizeText("Cote d'Ivoire")]: "Côte d'Ivoire",
  [normalizeText("Republic of Côte d'Ivoire")]: "Côte d'Ivoire",
  // Cap-Vert
  [normalizeText('Cape Verde')]: 'Cap-Vert',
  [normalizeText('Cabo Verde')]: 'Cap-Vert',
  // Gambie
  [normalizeText('The Gambia')]: 'Gambie',
  // Mauritanie
  [normalizeText('Mauritania')]: 'Mauritanie',
  // Sénégal
  [normalizeText('Senegal')]: 'Sénégal',
  // Bénin
  [normalizeText('Benin')]: 'Bénin',
  // Guinée
  [normalizeText('Guinea')]: 'Guinée',
  // Guinée-Bissau
  [normalizeText('Guinea Bissau')]: 'Guinée-Bissau',
  [normalizeText('Guinea-Bissau')]: 'Guinée-Bissau',
};

const canonicalizeCountry = (countryName: string): string => {
  const normalized = normalizeText(countryName);

  const aliased = countryAliases[normalized];
  if (aliased) return aliased;

  const match = westAfricanCountries.find(
    (c) => normalizeText(c.name) === normalized
  );

  return match?.name || countryName;
};

export interface LocationPriority {
  city: string;
  country: string;
  priority: 'same-city' | 'same-country' | 'neighboring-country' | 'west-africa' | 'other';
  distance?: string;
}

// Fonction pour déduire le pays depuis le nom de la ville
const getCountryFromCity = (cityName: string): string | null => {
  const normalizedCity = normalizeText(cityName);
  
  for (const country of westAfricanCountries) {
    const hasCity = country.cities.some(city => 
      normalizeText(city) === normalizedCity
    );
    if (hasCity) {
      return country.name;
    }
  }
  
  return null;
};

// Pays voisins pour chaque pays d'Afrique de l'Ouest
const neighboringCountries: Record<string, string[]> = {
  "Bénin": ["Burkina Faso", "Niger", "Nigeria", "Togo"],
  "Burkina Faso": ["Bénin", "Côte d'Ivoire", "Ghana", "Mali", "Niger", "Togo"],
  "Cap-Vert": [], // Île
  "Côte d'Ivoire": ["Burkina Faso", "Ghana", "Guinée", "Liberia", "Mali"],
  "Gambie": ["Sénégal"],
  "Ghana": ["Burkina Faso", "Côte d'Ivoire", "Togo"],
  "Guinée": ["Côte d'Ivoire", "Guinée-Bissau", "Liberia", "Mali", "Sénégal", "Sierra Leone"],
  "Guinée-Bissau": ["Guinée", "Sénégal"],
  "Liberia": ["Côte d'Ivoire", "Guinée", "Sierra Leone"],
  "Mali": ["Burkina Faso", "Côte d'Ivoire", "Guinée", "Mauritanie", "Niger", "Sénégal"],
  "Mauritanie": ["Mali", "Sénégal"],
  "Niger": ["Bénin", "Burkina Faso", "Mali", "Nigeria"],
  "Nigeria": ["Bénin", "Niger"],
  "Sénégal": ["Gambie", "Guinée", "Guinée-Bissau", "Mali", "Mauritanie"],
  "Sierra Leone": ["Guinée", "Liberia"],
  "Togo": ["Bénin", "Burkina Faso", "Ghana"],
};

export const getLocationPriority = (
  listingLocation: string,
  userCity: string | null,
  userCountry: string | null
): LocationPriority => {
  // Parse location (format attendu: "Ville, Pays" ou "Ville, Quartier")
  const parts = listingLocation.split(',').map(s => s.trim());
  let city = parts[0] || '';
  let country = '';
  
  // Si on a plusieurs parties, vérifier si la deuxième partie est un pays connu
  if (parts.length > 1) {
    const secondPart = parts[1];
    const canonicalSecondPart = canonicalizeCountry(secondPart);
    // Vérifier si c'est un pays d'Afrique de l'Ouest
    const isKnownCountry = westAfricanCountries.some(c => 
      normalizeText(c.name) === normalizeText(canonicalSecondPart)
    );
    
    if (isKnownCountry) {
      country = canonicalSecondPart;
    }
  }
  
  // Si le pays n'est toujours pas identifié, essayer de le déduire depuis la ville principale
  if (!country && city) {
    const deducedCountry = getCountryFromCity(city);
    if (deducedCountry) {
      country = deducedCountry;
    }
  }

  // Canonicalize country names (handles "Ivory Coast" etc.)
  const canonicalListingCountry = country ? canonicalizeCountry(country) : '';
  const canonicalUserCountryText = userCountry ? canonicalizeCountry(userCountry) : '';
  
  // Normaliser les comparaisons (accents + apostrophes)
  const normalizedCity = normalizeText(city);
  const normalizedCountry = normalizeText(canonicalListingCountry);
  const normalizedUserCity = userCity ? normalizeText(userCity) : '';
  const normalizedUserCountry = canonicalUserCountryText ? normalizeText(canonicalUserCountryText) : '';
  
  // Même ville (comparaison flexible - accepte si la ville de l'utilisateur contient ou est contenue dans la ville de l'annonce)
  if (userCity && city && 
      (normalizedCity === normalizedUserCity || 
       normalizedCity.includes(normalizedUserCity) || 
       normalizedUserCity.includes(normalizedCity))) {
    return {
      city,
      country: canonicalListingCountry || '',
      priority: 'same-city',
      distance: 'À proximité'
    };
  }
  
  // Même pays
  if (userCountry && country && normalizedCountry === normalizedUserCountry) {
    return {
      city,
      country: canonicalListingCountry || '',
      priority: 'same-country',
      distance: `${canonicalListingCountry}`
    };
  }
  
  // Pays voisin
  if (userCountry && country) {
    const canonicalUserCountryKey = Object.keys(neighboringCountries).find(
      (k) => normalizeText(k) === normalizedUserCountry
    );
    const neighbors = canonicalUserCountryKey ? neighboringCountries[canonicalUserCountryKey] : undefined;
    const isNeighbor = !!neighbors?.some((n) => normalizeText(n) === normalizedCountry);

    if (isNeighbor) {
      return {
        city,
        country: canonicalListingCountry || '',
        priority: 'neighboring-country',
        distance: `${canonicalListingCountry} (pays voisin)`
      };
    }
  }
  
  // Pays d'Afrique de l'Ouest (mais pas voisin)
  const isWestAfrican = westAfricanCountries.some(c => 
    normalizeText(c.name) === normalizedCountry
  );
  
  if (isWestAfrican) {
    return {
      city,
      country: canonicalListingCountry || '',
      priority: 'west-africa',
      distance: `${canonicalListingCountry}`
    };
  }
  
  // Autre (hors Afrique de l'Ouest)
  return {
    city,
    country: canonicalListingCountry || '',
    priority: 'other',
    distance: canonicalListingCountry || listingLocation
  };
};

export const sortListingsByLocation = <T extends { location: string }>(
  listings: T[],
  userCity: string | null,
  userCountry: string | null
): T[] => {
  const priorityOrder = {
    'same-city': 0,
    'same-country': 1,
    'neighboring-country': 2,
    'west-africa': 3,
    'other': 4
  };
  
  return [...listings].sort((a, b) => {
    const priorityA = getLocationPriority(a.location, userCity, userCountry);
    const priorityB = getLocationPriority(b.location, userCity, userCountry);
    
    return priorityOrder[priorityA.priority] - priorityOrder[priorityB.priority];
  });
};

export const getLocationBadgeColor = (priority: LocationPriority['priority']) => {
  switch (priority) {
    case 'same-city':
      return 'bg-green-500/90 text-white';
    case 'same-country':
      return 'bg-blue-500/90 text-white';
    case 'neighboring-country':
      return 'bg-orange-500/90 text-white';
    case 'west-africa':
      return 'bg-amber-600/90 text-white';
    default:
      return 'bg-gray-500/90 text-white';
  }
};
