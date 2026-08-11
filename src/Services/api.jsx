import axios from "axios";
import { supabase } from "./supabase";

const apiInstance = axios.create({
  baseURL: 'https://imdb236.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY,
    'x-rapidapi-host': 'imdb236.p.rapidapi.com',
    'Content-Type': 'application/json',
  }
});

// --- HELPER 1: TRANSFORM SUPABASE (snake_case) TO REACT (camelCase) ---
// Ensures React components expecting `item.primaryTitle` or `item.primaryImage` work perfectly
const transformDbMovieToCamelCase = (dbMovie) => {
  if (!dbMovie) return null;
  return {
    id: dbMovie.id,
    url: dbMovie.url,
    primaryTitle: dbMovie.primary_title,
    originalTitle: dbMovie.original_title,
    type: dbMovie.type,
    description: dbMovie.description,
    primaryImage: dbMovie.primary_image,
    trailer: dbMovie.trailer,
    contentRating: dbMovie.content_rating,
    startYear: dbMovie.start_year,
    endYear: dbMovie.end_year,
    releaseDate: dbMovie.release_date,
    runtimeMinutes: dbMovie.runtime_minutes,
    averageRating: dbMovie.average_rating ? Number(dbMovie.average_rating) : null,
    numVotes: dbMovie.num_votes ? Number(dbMovie.num_votes) : 0,
    metascore: dbMovie.metascore,
    budget: dbMovie.budget,
    grossWorldwide: dbMovie.gross_worldwide,
    isAdult: dbMovie.is_adult,
    thumbnails: dbMovie.thumbnails || [],
    interests: dbMovie.interests || [],
    countriesOfOrigin: dbMovie.countries_of_origin || [],
    externalLinks: dbMovie.external_links || [],
    spokenLanguages: dbMovie.spoken_languages || [],
    filmingLocations: dbMovie.filming_locations || [],
    productionCompanies: dbMovie.production_companies || [],
    genres: dbMovie.genres || []
  };
};

// --- HELPER 2: SAVE TO MASTER 'movies' + LINK TO 'movie_categories' ---
const saveCategoryMovies = async (moviesArray, categorySlug) => {
  if (!Array.isArray(moviesArray) || moviesArray.length === 0) return;

  try {
    // 1. Format raw API items into master "movies" table schema (snake_case)
    const formattedMasterRows = moviesArray
      .filter(item => Boolean(item && item.id))
      .map(item => ({
        id: item.id,
        url: item.url || null,
        primary_title: item.primaryTitle || item.title || null,
        original_title: item.originalTitle || null,
        type: item.type || null,
        description: item.description || null,
        primary_image: typeof item.primaryImage === 'string' ? item.primaryImage : item.primaryImage?.url || null,
        trailer: item.trailer || null,
        content_rating: item.contentRating || null,
        start_year: item.startYear || null,
        end_year: item.endYear || null,
        release_date: item.releaseDate || null,
        runtime_minutes: item.runtimeMinutes || null,
        average_rating: item.averageRating || null,
        num_votes: item.numVotes || null,
        metascore: item.metascore || null,
        budget: item.budget || null,
        gross_worldwide: item.grossWorldwide || null,
        is_adult: item.isAdult ?? false,
        thumbnails: item.thumbnails || [],
        interests: item.interests || [],
        countries_of_origin: item.countriesOfOrigin || [],
        external_links: item.externalLinks || [],
        spoken_languages: item.spokenLanguages || [],
        filming_locations: item.filmingLocations || [],
        production_companies: item.productionCompanies || item.prdouctionCompanies || [],
        genres: item.genres || []
      }));

    if (formattedMasterRows.length > 0) {
      // Upsert into master 'movies' table (Updates if already exists)
      const { error: masterErr } = await supabase
        .from('movies')
        .upsert(formattedMasterRows, { onConflict: 'id' });

      if (masterErr) console.error("Master Table Upsert Error:", masterErr);

      // 2. Link movies to 'movie_categories' junction table
      if (categorySlug) {
        const categoryEntries = formattedMasterRows.map((m, index) => ({
          category_slug: categorySlug,
          movie_id: m.id,
          display_order: index + 1
        }));

        const { error: catErr } = await supabase
          .from('movie_categories')
          .upsert(categoryEntries, { onConflict: 'category_slug, movie_id' });

        if (catErr) console.error(`Category Link Error for [${categorySlug}]:`, catErr);
        else console.log(`💾 Saved ${categoryEntries.length} movies to category [${categorySlug}]`);
      }
    }
  } catch (err) {
    console.error(`Supabase Save Error for [${categorySlug}]:`, err);
  }
};

// --- HELPER 3: CACHE-FIRST FETCH ENGINE (SINGLE QUERY JOIN) ---
const fetchCategoryCachedOrApi = async ({ categorySlug, apiCall }) => {
  try {
    // 1. Single join query: Fetch category rows + joined master movie details
    const { data: categoryRows, error: catError } = await supabase
      .from('movie_categories')
      .select(`
        movie_id,
        display_order,
        movies (*)
      `)
      .eq('category_slug', categorySlug)
      .order('display_order', { ascending: true });

    if (!catError && categoryRows && categoryRows.length > 0) {
      const dbMovies = categoryRows
        .map(row => transformDbMovieToCamelCase(row.movies))
        .filter(Boolean);

      if (dbMovies.length > 0) {
        console.log(`⚡ Loaded [${categorySlug}] from Supabase DB! (${dbMovies.length} movies, 0 API calls)`);
        return dbMovies;
      }
    }
  } catch (err) {
    console.warn(`DB fetch error for [${categorySlug}], attempting API fallback...`, err);
  }

  // 2. DB is empty: Fetch from RapidAPI & save to Supabase
  console.log(`🌐 Fetching [${categorySlug}] from RapidAPI...`);
  try {
    const apiData = await apiCall();
    if (apiData && apiData.length > 0) {
      await saveCategoryMovies(apiData, categorySlug);
      return apiData;
    }
  } catch (apiErr) {
    console.error(`RapidAPI Error on [${categorySlug}]:`, apiErr?.response?.status || apiErr.message);
  }

  return [];
};

// ========================================================
// HOME SECTION FUNCTIONS
// ========================================================

export const getTopSectionTrending = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'trending_telugu_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/india/trending-telugu');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getTopSectionMostAnticipatedIndianMovies = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'most_anticipated_indian_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/india/upcoming');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getBottomSectionTopRatedIndianMovies = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_rated_indian_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/india/top-rated-indian-movies');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getBottomSectionTop250Movies = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_250_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/top250-movies');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getBottomSectionTop250TVShows = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_250_tv_shows',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/top250-tv'); 
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

// ========================================================
// NAVBAR DROPDOWN CATEGORY FUNCTIONS
// ========================================================

export const getTopRatedTelugu = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_rated_telugu_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/india/top-rated-telugu-movies');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getTopRatedIndian = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_rated_indian_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/india/top-rated-indian-movies');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getTopRatedEnglish = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_rated_english_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/top-rated-english-movies');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getTopBoxOfficeUS = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'top_box_office_us',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/top-box-office');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getMostPopularMovies = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'most_popular_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/most-popular-movies');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

export const getMostPopularTVShows = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'most_popular_tv_shows',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/most-popular-tv');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });
};

// ========================================================
// SEARCH & AUTOCOMPLETE FUNCTIONS
// ========================================================

export const getAutocompleteSuggestions = async (query) => {
  if (!query || query.trim() === '') return [];
  const cleanQuery = query.trim();

  try {
    // 1. Search Master Movies Table First
    const { data: dbMatches } = await supabase
      .from('movies')
      .select('*')
      .ilike('primary_title', `%${cleanQuery}%`)
      .limit(10);

    if (dbMatches && dbMatches.length > 0) {
      return dbMatches.map(transformDbMovieToCamelCase);
    }

    // 2. Fallback to API
    const response = await apiInstance.get(`/api/imdb/autocomplete`, {
      params: { query: cleanQuery }
    });
    const data = response.data || [];
    const results = Array.isArray(data) ? data : data?.d || data?.data || data?.results || [];
    
    // Save search results to master DB without linking to a specific category
    saveCategoryMovies(results, null);
    return results;
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    return [];
  }
};

export const searchMovies = async ({ query = '', type = 'movie', genre = '', rows = 25 }) => {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();

  try {
    // 1. Search Master Movies Table First
    const { data: dbMovies } = await supabase
      .from('movies')
      .select('*')
      .ilike('primary_title', `%${cleanQuery}%`);

    if (dbMovies && dbMovies.length > 0) {
      console.log('⚡ Loaded search from Supabase DB! (0 API calls used)');
      return dbMovies.map(transformDbMovieToCamelCase);
    }

    // 2. Fallback to RapidAPI
    console.log('🌐 Fetching search from RapidAPI Autocomplete...');
    const response = await apiInstance.get(`/api/imdb/autocomplete`, {
      params: { query: cleanQuery }
    });

    const res = response.data;
    const apiResults = Array.isArray(res) ? res : res?.d || res?.data || res?.results || [];

    if (apiResults.length > 0) {
      await saveCategoryMovies(apiResults, null);
    }

    return apiResults;
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
};