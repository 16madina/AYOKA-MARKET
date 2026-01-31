export interface Currency {
  code: string;
  symbol: string;
  name: string;
  countries: string[];
}

export const currencies: Record<string, Currency> = {
  FCFA: {
    code: "FCFA",
    symbol: "FCFA",
    name: "Franc CFA",
    countries: [
      "Bénin",
      "Burkina Faso",
      "Côte d'Ivoire",
      "Guinée-Bissau",
      "Mali",
      "Niger",
      "Sénégal",
      "Togo"
    ]
  },
  GHS: {
    code: "GHS",
    symbol: "₵",
    name: "Cedi ghanéen",
    countries: ["Ghana"]
  },
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Naira nigérian",
    countries: ["Nigeria"]
  },
  GMD: {
    code: "GMD",
    symbol: "D",
    name: "Dalasi gambien",
    countries: ["Gambie"]
  },
  LRD: {
    code: "LRD",
    symbol: "L$",
    name: "Dollar libérien",
    countries: ["Liberia"]
  },
  SLL: {
    code: "SLL",
    symbol: "Le",
    name: "Leone sierra-léonais",
    countries: ["Sierra Leone"]
  },
  CVE: {
    code: "CVE",
    symbol: "Esc",
    name: "Escudo cap-verdien",
    countries: ["Cap-Vert"]
  },
  MRU: {
    code: "MRU",
    symbol: "UM",
    name: "Ouguiya mauritanien",
    countries: ["Mauritanie"]
  },
  GNF: {
    code: "GNF",
    symbol: "FG",
    name: "Franc guinéen",
    countries: ["Guinée"]
  }
};

// Taux de conversion approximatifs vers FCFA (base commune)
export const conversionRates: Record<string, number> = {
  FCFA: 1,
  GHS: 95, // 1 GHS ≈ 95 FCFA
  NGN: 1.5, // 1 NGN ≈ 1.5 FCFA
  GMD: 11, // 1 GMD ≈ 11 FCFA
  LRD: 3.2, // 1 LRD ≈ 3.2 FCFA
  SLL: 0.04, // 1 SLL ≈ 0.04 FCFA
  CVE: 5.5, // 1 CVE ≈ 5.5 FCFA
  MRU: 16, // 1 MRU ≈ 16 FCFA
  GNF: 0.07 // 1 GNF ≈ 0.07 FCFA
};

export const getCurrencyByCountry = (country: string | null): Currency => {
  if (!country) return currencies.FCFA;
  
  for (const currency of Object.values(currencies)) {
    if (currency.countries.includes(country)) {
      return currency;
    }
  }
  
  return currencies.FCFA; // Par défaut
};

export const convertPrice = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convertir vers FCFA puis vers la devise cible
  const amountInFCFA = amount * (conversionRates[fromCurrency] || 1);
  const convertedAmount = amountInFCFA / (conversionRates[toCurrency] || 1);
  
  return Math.round(convertedAmount);
};

export const formatPrice = (
  amount: number,
  currencyCode: string = "FCFA",
  showSymbol: boolean = true
): string => {
  const currency = currencies[currencyCode] || currencies.FCFA;
  const formattedAmount = amount.toLocaleString('fr-FR');
  
  if (!showSymbol) return formattedAmount;
  
  // Pour FCFA, on met le symbole après
  if (currencyCode === "FCFA") {
    return `${formattedAmount} ${currency.symbol}`;
  }
  
  // Pour les autres devises, symbole avant
  return `${currency.symbol}${formattedAmount}`;
};

export const formatPriceWithConversion = (
  amount: number,
  listingCurrency: string = "FCFA",
  userCurrency: string = "FCFA"
): string => {
  // Gérer les prix gratuits
  if (amount === 0) {
    return "Gratuit";
  }
  
  // Retourne toujours le prix dans la devise ORIGINALE de l'annonce
  return formatPrice(amount, listingCurrency);
};

// Fonction pour obtenir le prix converti (pour l'affichage secondaire)
export const getConvertedPrice = (
  amount: number,
  listingCurrency: string = "FCFA",
  userCurrency: string = "FCFA"
): string | null => {
  // Pas de conversion nécessaire si même devise ou prix gratuit
  if (amount === 0 || listingCurrency === userCurrency) {
    return null;
  }
  
  const convertedAmount = convertPrice(amount, listingCurrency, userCurrency);
  return `≈ ${formatPrice(convertedAmount, userCurrency)}`;
};

// Alias pour la compatibilité
export const formatCurrency = formatPrice;
