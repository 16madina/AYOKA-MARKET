import { westAfricanCountries } from '@/data/westAfricaData';

export interface LocationPriority {
  city: string;
  country: string;
  priority: 'same-city' | 'same-country' | 'neighboring-country' | 'other';
  distance?: string;
}

// Fonction pour déduire le pays depuis le nom de la ville
const getCountryFromCity = (cityName: string): string | null => {
  const normalizedCity = cityName.toLowerCase().trim();
  
  for (const country of westAfricanCountries) {
    const hasCity = country.cities.some(city => 
      city.toLowerCase() === normalizedCity
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
    // Vérifier si c'est un pays d'Afrique de l'Ouest
    const isKnownCountry = westAfricanCountries.some(c => 
      c.name.toLowerCase() === secondPart.toLowerCase()
    );
    
    if (isKnownCountry) {
      country = secondPart;
    }
  }
  
  // Si le pays n'est toujours pas identifié, essayer de le déduire depuis la ville principale
  if (!country && city) {
    const deducedCountry = getCountryFromCity(city);
    if (deducedCountry) {
      country = deducedCountry;
    }
  }
  
  // Normaliser les comparaisons
  const normalizedCity = city.toLowerCase();
  const normalizedCountry = country.toLowerCase();
  const normalizedUserCity = userCity?.toLowerCase() || '';
  const normalizedUserCountry = userCountry?.toLowerCase() || '';
  
  // Même ville (comparaison flexible - accepte si la ville de l'utilisateur contient ou est contenue dans la ville de l'annonce)
  if (userCity && city && 
      (normalizedCity === normalizedUserCity || 
       normalizedCity.includes(normalizedUserCity) || 
       normalizedUserCity.includes(normalizedCity))) {
    return {
      city,
      country: country || '',
      priority: 'same-city',
      distance: 'À proximité'
    };
  }
  
  // Même pays
  if (userCountry && country && normalizedCountry === normalizedUserCountry) {
    return {
      city,
      country: country || '',
      priority: 'same-country',
      distance: `${country}`
    };
  }
  
  // Pays voisin
  if (userCountry && country && neighboringCountries[userCountry]?.includes(country)) {
    return {
      city,
      country: country || '',
      priority: 'neighboring-country',
      distance: `${country} (pays voisin)`
    };
  }
  
  // Autre
  return {
    city,
    country: country || '',
    priority: 'other',
    distance: country || listingLocation
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
    'other': 3
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
    default:
      return 'bg-gray-500/90 text-white';
  }
};
