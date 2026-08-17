import axios from "axios";
import { supabase } from "./supabase";

// Create a reusable axios instance pre-configured with the RapidAPI base URL
// and auth headers, so every call below doesn't have to repeat this setup.
const apiInstance = axios.create({
  baseURL: 'https://imdb236.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY, // API key pulled from Vite env vars
    'x-rapidapi-host': 'imdb236.p.rapidapi.com',
    'Content-Type': 'application/json',
  }
});

// ============================================================
// HELPER 1: TRANSFORM SUPABASE (snake_case) TO REACT (camelCase)
// ============================================================
// Supabase/Postgres columns are snake_case (primary_title),
// but React components expect camelCase (primaryTitle).
// This function is a pure "adapter" — no side effects, just reshapes data.
const transformDbMovieToCamelCase = (dbMovie) => {

  // GUARD CLAUSE: if no movie object was passed in (null/undefined),
  // immediately return null instead of crashing on dbMovie.whatever below.
  if (!dbMovie) return null;

  // Return a brand new object, manually renaming each snake_case key
  // to its camelCase equivalent.
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

    // TERNARY (if/else in one line):
    // Postgres numeric columns often come back as STRINGS from Supabase.
    // If average_rating is truthy, convert it to a real JS Number.
    // Otherwise (0, null, undefined, ""), fall back to null.
    averageRating: dbMovie.average_rating ? Number(dbMovie.average_rating) : null,

    // Same pattern, but defaults to 0 instead of null —
    // a vote count of "unknown" is more sensibly shown as 0 than null.
    numVotes: dbMovie.num_votes ? Number(dbMovie.num_votes) : 0,

    metascore: dbMovie.metascore,
    budget: dbMovie.budget,
    grossWorldwide: dbMovie.gross_worldwide,
    isAdult: dbMovie.is_adult,

    // OR-FALLBACK PATTERN (`|| []`):
    // If the DB value is null/undefined/falsy, use an empty array instead,
    // so components can safely call .map()/.length on these fields
    // without extra null-checking.
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

// ============================================================
// HELPER 2: SAVE TO MASTER 'movies' TABLE + LINK TO 'movie_categories'
// ============================================================
// Takes movies fetched from RapidAPI (camelCase) and persists them into
// Supabase (snake_case), then links them to a category via a join table.
const saveCategoryMovies = async (moviesArray, categorySlug) => {

  // GUARD CLAUSE: bail out early if there's nothing usable to save.
  // - !Array.isArray(...) catches the case where moviesArray isn't even an array
  // - .length === 0 catches an empty array
  if (!Array.isArray(moviesArray) || moviesArray.length === 0) return;

  // TRY/CATCH: wraps the whole save process. Anything that throws
  // unexpectedly (network error, malformed data, etc.) is caught here
  // instead of crashing the caller.
  try {

    // STEP 1: Build the array of rows to upsert into the master table.
    const formattedMasterRows = moviesArray
      // .filter(): keep only items that exist AND have an `id`.
      // Boolean(item && item.id) is falsy if item is null/undefined
      // OR if item.id is missing — those rows are dropped since `id`
      // is required as the primary key.
      .filter(item => Boolean(item && item.id))
      // .map(): transform each surviving item from camelCase (API shape)
      // into snake_case (DB column shape).
      .map(item => ({
        id: item.id,
        url: item.url || null, // fallback to null if url is missing/falsy

        // OR-CHAIN: try primaryTitle first, then title, then null.
        // Handles APIs that sometimes use a different key name for the title.
        primary_title: item.primaryTitle || item.title || null,

        original_title: item.originalTitle || null,
        type: item.type || null,
        description: item.description || null,

        // TERNARY: primaryImage might be a plain string URL,
        // OR an object like { url: "..." }.
        // typeof check decides which shape we're dealing with:
        // - if it's already a string, use it directly
        // - otherwise, try to read .url off it (optional chaining `?.`
        //   prevents a crash if primaryImage is null/undefined),
        //   falling back to null if that's also missing.
        primary_image: typeof item.primaryImage === 'string'
          ? item.primaryImage
          : item.primaryImage?.url || null,

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

        // NULLISH COALESCING (`??`): unlike `||`, this only falls back
        // to `false` if isAdult is null or undefined — NOT if it's
        // already `false`. (With `||`, `false || false` would still
        // give `false`, so behavior looks similar here, but `??` is the
        // semantically correct choice for a boolean field, since `||`
        // would incorrectly override a valid `false` value with the
        // fallback if the value were something like 0 or "".)
        is_adult: item.isAdult ?? false,

        thumbnails: item.thumbnails || [],
        interests: item.interests || [],
        countries_of_origin: item.countriesOfOrigin || [],
        external_links: item.externalLinks || [],
        spoken_languages: item.spokenLanguages || [],
        filming_locations: item.filmingLocations || [],

        // Fallback chain checking both the correct key name AND a
        // misspelled variant ("prdouctionCompanies") — likely defends
        // against an inconsistent/buggy upstream API response.
        production_companies: item.productionCompanies || item.prdouctionCompanies || [],

        genres: item.genres || []
      }));

    // IF: only attempt to save if at least one valid row survived filtering.
    if (formattedMasterRows.length > 0) {

      // Upsert (insert OR update) rows into the master 'movies' table.
      // onConflict: 'id' tells Postgres: if a row with this id already
      // exists, update it instead of throwing a duplicate-key error.
      // Supabase calls don't throw on failure — they return { error }.
      const { error: masterErr } = await supabase
        .from('movies')
        .upsert(formattedMasterRows, { onConflict: 'id' });

      // IF: log the error if the upsert failed (but don't throw —
      // execution continues so we can still try the category link).
      if (masterErr) console.error("Master Table Upsert Error:", masterErr);

      // IF: only attempt category-linking if a categorySlug was actually
      // provided (some callers, like search, pass `null` since search
      // results don't belong to a specific category).
      if (categorySlug) {

        // .map() with (item, index) signature: build junction-table rows,
        // using the array index to preserve original ordering via
        // display_order (1-based, hence index + 1).
        const categoryEntries = formattedMasterRows.map((m, index) => ({
          category_slug: categorySlug,
          movie_id: m.id,
          display_order: index + 1
        }));

        // Upsert the linking rows. onConflict uses a COMPOSITE key
        // (category_slug + movie_id together) — meaning the same movie
        // can appear in many categories, but only once per category.
        // Re-saving the same category won't create duplicates, just
        // updates display_order.
        const { error: catErr } = await supabase
          .from('movie_categories')
          .upsert(categoryEntries, { onConflict: 'category_slug, movie_id' });

        // IF/ELSE: log failure, or log a success message with a count.
        if (catErr) console.error(`Category Link Error for [${categorySlug}]:`, catErr);
        else console.log(`💾 Saved ${categoryEntries.length} movies to category [${categorySlug}]`);
      }
    }
  } catch (err) {
    // CATCH: catches anything unexpected that wasn't handled above
    // (e.g. a thrown exception before Supabase even returns a response).
    console.error(`Supabase Save Error for [${categorySlug}]:`, err);
  }
};

// ============================================================
// HELPER 3: CACHE-FIRST FETCH ENGINE (SINGLE QUERY JOIN)
// ============================================================
// Strategy: check Supabase (the "cache") first. Only call the paid/
// rate-limited RapidAPI if the DB has nothing yet for this category.
// `apiCall` is passed in by the caller (dependency injection) so this
// function stays generic and reusable for any category.
const fetchCategoryCachedOrApi = async ({ categorySlug, apiCall }) => {

  // TRY: attempt to read from the Supabase cache first.
  try {

    // Single JOIN query: fetch rows from movie_categories, and for each
    // row also pull in the full related movie via the `movies (*)`
    // syntax — this works because movie_id is a foreign key to movies.id,
    // so Supabase/PostgREST can nest the related row automatically
    // instead of requiring two separate queries.
    const { data: categoryRows, error: catError } = await supabase
      .from('movie_categories')
      .select(`
        movie_id,
        display_order,
        movies (*)
      `)
      .eq('category_slug', categorySlug) // WHERE category_slug = categorySlug
      .order('display_order', { ascending: true }); // preserve saved order

    // IF: only proceed with cached data if:
    // - there was no query error (!catError)
    // - categoryRows exists
    // - categoryRows actually has at least one row
    if (!catError && categoryRows && categoryRows.length > 0) {

      const dbMovies = categoryRows
        // .map(): pull the nested `movies` object out of each row and
        // convert it from snake_case to camelCase via Helper 1.
        .map(row => transformDbMovieToCamelCase(row.movies))
        // .filter(Boolean): remove any nulls (e.g. if a join somehow
        // didn't resolve to a matching movie row).
        .filter(Boolean);

      // IF: if we ended up with at least one valid movie, this counts
      // as a cache HIT — log it and return early, skipping the API call
      // entirely (this is the fast path).
      if (dbMovies.length > 0) {
        console.log(`⚡ Loaded [${categorySlug}] from Supabase DB! (${dbMovies.length} movies, 0 API calls)`);
        return dbMovies;
      }
    }
    // NOTE: if none of the above conditions were met, execution simply
    // falls through to the API-fetch code below (no explicit else needed).

  } catch (err) {
    // CATCH: if the DB query itself throws (e.g. network issue),
    // log a warning and fall through to the API fallback below
    // rather than failing the whole function.
    console.warn(`DB fetch error for [${categorySlug}], attempting API fallback...`, err);
  }

  // ---- CACHE MISS PATH ----
  // Reached only if the try block above didn't already `return`.
  console.log(`🌐 Fetching [${categorySlug}] from RapidAPI...`);

  // TRY: attempt the external API call and save the result.
  try {
    const apiData = await apiCall(); // caller-supplied function, e.g. hits RapidAPI

    // IF: only save/return if the API actually gave back a non-empty array.
    if (apiData && apiData.length > 0) {
      await saveCategoryMovies(apiData, categorySlug); // persist to cache for next time
      return apiData;
    }
  } catch (apiErr) {
    // CATCH: log the API error. Uses optional chaining + OR-fallback:
    // prefer apiErr.response.status (an HTTP status code, if axios
    // attached one) but fall back to the generic error message if not.
    console.error(`RapidAPI Error on [${categorySlug}]:`, apiErr?.response?.status || apiErr.message);
  }

  // FINAL FALLBACK: if both the DB and the API attempts failed/returned
  // nothing, return an empty array instead of undefined, so callers
  // never need to null-check the return value.
  return [];
};

// ========================================================
// HOME SECTION FUNCTIONS
// ========================================================
// Each of these is a thin wrapper around fetchCategoryCachedOrApi:
// it supplies a fixed categorySlug (used as the cache key) and an
// apiCall function describing exactly which RapidAPI endpoint to hit
// if the cache is empty.

export const getTopSectionTrending = async () => {
  return fetchCategoryCachedOrApi({
    categorySlug: 'trending_telugu_movies',
    apiCall: async () => {
      const res = await apiInstance.get('/api/imdb/india/trending-telugu');
      // TERNARY: some RapidAPI endpoints return a raw array directly,
      // others wrap it in a `results` field. This normalizes both shapes
      // into a plain array (falling back to [] if neither shape matches).
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
// Same wrapper pattern as above, just different endpoints/slugs
// for each navbar category.

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

// getAutocompleteSuggestions: returns quick title-match suggestions
// as the user types, checking the local DB before hitting the API.
export const getAutocompleteSuggestions = async (query) => {

  // GUARD CLAUSE: reject empty/whitespace-only queries immediately,
  // returning an empty array rather than doing any DB/API work.
  if (!query || query.trim() === '') return [];

  const cleanQuery = query.trim(); // remove leading/trailing whitespace

  // TRY: wrap all DB + API logic so any thrown error is caught below.
  try {

    // STEP 1: Search the master 'movies' table directly (not through
    // a category — this searches ALL cached movies regardless of category).
    const { data: dbMatches } = await supabase
      .from('movies')
      .select('*')
      // ilike = case-insensitive LIKE. `%query%` means "contains query
      // anywhere in the title", not just starting with it.
      .ilike('primary_title', `%${cleanQuery}%`)
      .limit(10); // cap results to 10 for a snappy autocomplete dropdown

    // IF: if the DB already has matching titles, use them and skip the API.
    if (dbMatches && dbMatches.length > 0) {
      // .map(transformDbMovieToCamelCase): shorthand for
      // .map(item => transformDbMovieToCamelCase(item)) — converts every
      // matched row to camelCase before returning.
      return dbMatches.map(transformDbMovieToCamelCase);
    }

    // STEP 2 (fallback): no local matches, so query the RapidAPI
    // autocomplete endpoint instead.
    const response = await apiInstance.get(`/api/imdb/autocomplete`, {
      params: { query: cleanQuery }
    });

    const data = response.data || []; // fallback to [] if response.data is falsy

    // Normalize varying possible response shapes into a plain array:
    // try data itself (if already an array), else try common wrapper
    // keys (`d`, `data`, `results`) one by one, else default to [].
    const results = Array.isArray(data) ? data : data?.d || data?.data || data?.results || [];

    // Fire-and-forget save: persist these search results into the master
    // table for future searches/autocomplete. Note this call is NOT
    // awaited, so the function doesn't wait for the save to finish
    // before returning results to the user (keeps autocomplete snappy).
    // `null` is passed as categorySlug since these results don't belong
    // to any single category.
    saveCategoryMovies(results, null);

    return results;

  } catch (error) {
    // CATCH: catches errors from either the DB query or the API call,
    // logs it, and returns an empty array so the UI doesn't break.
    console.error('Error fetching autocomplete suggestions:', error);
    return [];
  }
};

// searchMovies: full search function (used on a dedicated search page,
// as opposed to the lighter-weight autocomplete dropdown above).
export const searchMovies = async ({ query = '', type = 'movie', genre = '', rows = 25 }) => {
  // NOTE: `type`, `genre`, and `rows` are accepted as parameters (with
  // defaults) but are not currently used inside the function body —
  // likely placeholders for future filtering functionality.

  // GUARD CLAUSE: same as above, reject empty queries early.
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();

  try {
    // STEP 1: search the master DB table first (same pattern as autocomplete,
    // but without the .limit(10) cap — returns ALL matches).
    const { data: dbMovies } = await supabase
      .from('movies')
      .select('*')
      .ilike('primary_title', `%${cleanQuery}%`);

    // IF: cache hit — log it and return transformed results immediately.
    if (dbMovies && dbMovies.length > 0) {
      console.log('⚡ Loaded search from Supabase DB! (0 API calls used)');
      return dbMovies.map(transformDbMovieToCamelCase);
    }

    // STEP 2 (fallback): cache miss — hit the RapidAPI autocomplete
    // endpoint as the underlying search source.
    console.log('🌐 Fetching search from RapidAPI Autocomplete...');
    const response = await apiInstance.get(`/api/imdb/autocomplete`, {
      params: { query: cleanQuery }
    });

    const res = response.data;
    // Same shape-normalizing fallback chain as in getAutocompleteSuggestions.
    const apiResults = Array.isArray(res) ? res : res?.d || res?.data || res?.results || [];

    // IF: only bother saving to the DB if the API actually returned results.
    // Unlike autocomplete's fire-and-forget call, this one IS awaited,
    // ensuring the save completes before the function returns.
    if (apiResults.length > 0) {
      await saveCategoryMovies(apiResults, null);
    }

    return apiResults;

  } catch (error) {
    // CATCH: catches DB or API errors, logs, and returns an empty array
    // so calling UI code always gets a safe, iterable value.
    console.error('Error searching movies:', error);
    return [];
  }
};