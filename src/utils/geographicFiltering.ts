export interface LocationPriority {
  city: string;
  country: string;
  priority: 'same-city' | 'same-country' | 'neighboring-country' | 'other';
  distance?: string;
}

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
  // Parse location (format attendu: "Ville, Pays" ou "Ville")
  const [city, country] = listingLocation.split(',').map(s => s.trim());
  
  // Même ville
  if (userCity && city && city.toLowerCase() === userCity.toLowerCase()) {
    return {
      city,
      country: country || '',
      priority: 'same-city',
      distance: 'À proximité'
    };
  }
  
  // Même pays
  if (userCountry && country && country.toLowerCase() === userCountry.toLowerCase()) {
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
