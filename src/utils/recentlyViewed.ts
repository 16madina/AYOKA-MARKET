export const addToRecentlyViewed = (listingId: string) => {
  try {
    const stored = localStorage.getItem("recently_viewed");
    let viewedIds: string[] = [];
    
    if (stored) {
      viewedIds = JSON.parse(stored);
    }
    
    // Remove if already exists
    viewedIds = viewedIds.filter(id => id !== listingId);
    
    // Add to beginning
    viewedIds.unshift(listingId);
    
    // Keep only last 10
    viewedIds = viewedIds.slice(0, 10);
    
    localStorage.setItem("recently_viewed", JSON.stringify(viewedIds));
  } catch (e) {
    console.error("Error saving to recently viewed:", e);
  }
};

