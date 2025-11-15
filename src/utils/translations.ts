export const translateCondition = (condition: string | null, language: "fr" | "en" = "fr"): string => {
  if (!condition) return language === "fr" ? "Comme neuf" : "Like New";
  
  const translations: { [key: string]: { fr: string; en: string } } = {
    "new": { fr: "Neuf", en: "New" },
    "like_new": { fr: "Comme neuf", en: "Like New" },
    "likenew": { fr: "Comme neuf", en: "Like New" },
    "good": { fr: "Bon état", en: "Good" },
    "fair": { fr: "État moyen", en: "Fair" },
    "poor": { fr: "Mauvais état", en: "Poor" }
  };
  
  const conditionKey = condition.toLowerCase();
  return translations[conditionKey]?.[language] || condition;
};
