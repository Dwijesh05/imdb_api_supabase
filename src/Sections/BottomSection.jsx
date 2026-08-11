import React, { useState, useEffect } from 'react';
import MovieRow from '../Components/MovieRow';
import MovieDetails from '../Components/MovieDetails';
import { 
  getBottomSectionTopRatedIndianMovies, 
  getBottomSectionTop250Movies, 
  getBottomSectionTop250TVShows 
} from '../Services/api';

const BottomSection = () => {
  const [topRatedIndian, setTopRatedIndian] = useState([]);
  const [top250Movies, setTop250Movies] = useState([]);
  const [top250TVShows, setTop250TVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const fetchBottomSectionData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [indianData, moviesData, showsData] = await Promise.all([
          getBottomSectionTopRatedIndianMovies(),
          getBottomSectionTop250Movies(),
          getBottomSectionTop250TVShows()
        ]);

        setTopRatedIndian(indianData || []);
        setTop250Movies(moviesData || []);
        setTop250TVShows(showsData || []);
      } catch (err) {
        console.error("Error fetching bottom section data:", err);
        setError("Failed to load featured rows. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBottomSectionData();
  }, []);

  return (
    <div className="flex flex-col space-y-4 pb-12">

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-yellow-400 font-bold text-sm animate-pulse">Loading Top Collections...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-6 text-red-400 font-semibold text-sm">
          {error}
        </div>
      )}

      {!loading && (
        <>
          <MovieRow 
            title="Top Rated Indian Movies" 
            movies={topRatedIndian} 
            onMovieClick={(movieItem) => setSelectedMovie(movieItem)}
          />
          <MovieRow 
            title="Top 250 Movies" 
            movies={top250Movies} 
            onMovieClick={(movieItem) => setSelectedMovie(movieItem)}
          />
          <MovieRow 
            title="Top 250 TV Shows" 
            movies={top250TVShows} 
            onMovieClick={(movieItem) => setSelectedMovie(movieItem)}
          />
        </>
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

export default BottomSection;