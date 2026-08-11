import React, { useState, useEffect } from 'react';
import MovieRow from '../Components/MovieRow';
import MovieDetails from '../Components/MovieDetails';
import { 
  getTopSectionTrending, 
  getTopSectionMostAnticipatedIndianMovies 
} from '../Services/api';

const TopSection = () => {
  const [trendingMovie, setTrendingMovie] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const fetchTopSectionData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [trendingData, anticipatedData] = await Promise.all([
          getTopSectionTrending(),
          getTopSectionMostAnticipatedIndianMovies()
        ]);

        setTrendingMovie(trendingData || []);
        setFeaturedMovies(anticipatedData || []);
      } catch (err) {
        console.error("Error fetching top section data:", err);
        setError("Failed to load trending movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopSectionData();
  }, []);

  return (
    <div className="text-white pb-6">
      <div className="flex flex-col items-center m-5 p-8 text-center">
        <h1 className="text-6xl font-extrabold">Stop Scrolling.</h1>
        <h1 className="text-6xl font-extrabold mt-1">
          Start <span className="text-yellow-400">Watching</span>
        </h1>
        <h2 className="text-xl font-light m-5 text-gray-300">
          Your perfect movie, faster. Powered by real IMDb ratings.
        </h2>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-yellow-400 font-bold text-sm animate-pulse">Loading Trending Section...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-6 text-red-400 font-semibold text-sm">
          {error}
        </div>
      )}

      {!loading && (
        <div className="flex flex-col space-y-4">
          <MovieRow 
            title="Trending Telugu Movies" 
            movies={trendingMovie} 
            onMovieClick={(movieItem) => setSelectedMovie(movieItem)}
          />
          <MovieRow 
            title="Most Anticipated Indian Movies" 
            movies={featuredMovies} 
            onMovieClick={(movieItem) => setSelectedMovie(movieItem)}
          />
        </div>
      )}

      {selectedMovie && (
        <MovieDetails 
          movieData={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
};

export default TopSection;