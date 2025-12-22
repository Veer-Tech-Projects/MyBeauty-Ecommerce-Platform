const KEY = 'recent_searches';

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term) {
  if (!term) return;
  const list = getRecentSearches();
  const newList = [term, ...list.filter(t => t !== term)].slice(0, 8); // dedupe + max 8
  localStorage.setItem(KEY, JSON.stringify(newList));
}

export function clearRecentSearches() {
  localStorage.removeItem(KEY);
}
