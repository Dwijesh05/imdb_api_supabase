import axios from "axios";

// Point the axios instance to your running FastAPI backend server
const apiInstance = axios.create({
  baseURL: 'http://localhost:8000', // Update this URL if deployed in production
  headers: {
    'Content-Type': 'application/json',
  }
});

// ============================================================
// GENERIC HELPER: FETCH CATEGORY FROM BACKEND
// ============================================================
const fetchCategory = async (categorySlug) => {
  try {
    const response = await apiInstance.get(`/api/movies/category/${categorySlug}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Error fetching category [${categorySlug}]:`, error?.response?.data || error.message);
    return [];
  }
};

// ============================================================
// HOME SECTION FUNCTIONS
// ============================================================

export const getTopSectionTrending = () => {
  return fetchCategory('trending_telugu_movies');
};

export const getTopSectionMostAnticipatedIndianMovies = () => {
  return fetchCategory('most_anticipated_indian_movies');
};

export const getBottomSectionTopRatedIndianMovies = () => {
  return fetchCategory('top_rated_indian_movies');
};

export const getBottomSectionTop250Movies = () => {
  return fetchCategory('top_250_movies');
};

export const getBottomSectionTop250TVShows = () => {
  return fetchCategory('top_250_tv_shows');
};

// ============================================================
// NAVBAR DROPDOWN CATEGORY FUNCTIONS
// ============================================================

export const getTopRatedTelugu = () => {
  return fetchCategory('top_rated_telugu_movies');
};

export const getTopRatedIndian = () => {
  return fetchCategory('top_rated_indian_movies');
};

export const getTopRatedEnglish = () => {
  return fetchCategory('top_rated_english_movies');
};

export const getTopBoxOfficeUS = () => {
  return fetchCategory('top_box_office_us');
};

export const getMostPopularMovies = () => {
  return fetchCategory('most_popular_movies');
};

export const getMostPopularTVShows = () => {
  return fetchCategory('most_popular_tv_shows');
};

// ============================================================
// SEARCH & AUTOCOMPLETE FUNCTIONS
// ============================================================

// getAutocompleteSuggestions: lightweight search query as the user types
export const getAutocompleteSuggestions = async (query) => {
  if (!query || query.trim() === '') return [];

  const cleanQuery = query.trim();

  try {
    const response = await apiInstance.get('/api/movies/search', {
      params: { query: cleanQuery }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error?.response?.data || error.message);
    return [];
  }
};

// searchMovies: full search function used on dedicated search pages
export const searchMovies = async ({ query = '', type = 'movie', genre = '', rows = 25 }) => {
  // Parameters like type, genre, and rows are passed along or handled by the backend search endpoint
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();

  try {
    const response = await apiInstance.get('/api/movies/search', {
      params: { query: cleanQuery }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error searching movies:', error?.response?.data || error.message);
    return [];
  }
};