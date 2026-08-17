import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react'; 
import Navbar from '../Components/Navbar';
import MovieDetails from '../Components/MovieDetails';
import { 
  getTopRatedTelugu, 
  getTopRatedIndian, 
  getTopRatedEnglish, 
  getTopBoxOfficeUS, 
  getMostPopularMovies, 
  getMostPopularTVShows,
  searchMovies 
} from '../Services/api';

const Results = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || 'All Movies';
  const type = searchParams.get('type'); 

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [page, setPage] = useState(0);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      setPage(0); 

      let data = [];
      try {
        if (type === 'search') {
          data = await searchMovies({ query });
        } else {
          switch (query) {
            case 'Top Rated Telugu Movies':
              data = await getTopRatedTelugu();
              break;
            case 'Top Rated Indian Movies':
              data = await getTopRatedIndian();
              break;
            case 'Top Rated English Movies':
              data = await getTopRatedEnglish();
              break;
            case 'Top Box Office (US)':
              data = await getTopBoxOfficeUS();
              break;
            case 'Most Popular Movies':
              data = await getMostPopularMovies();
              break;
            case 'Most Popular TV Shows':
              data = await getMostPopularTVShows();
              break;
            default:
              data = await getMostPopularMovies();
          }
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        data = [];
      }

      setMovies(Array.isArray(data) ? data : []);
      setLoading(false);
    };

    fetchCategoryData();
  }, [query, type]);

  const totalItems = movies.length;
  const maxPage = Math.max(0, Math.ceil(totalItems / itemsPerPage) - 1);
  const currentMovies = movies.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handlePrev = () => {
    setPage((prevPage) => (prevPage > 0 ? prevPage - 1 : prevPage));
  };

  const handleNext = () => {
    setPage((prevPage) => (prevPage < maxPage ? prevPage + 1 : prevPage));
  };

  return (
    <div className='h-screen bg-gray-900 flex flex-col text-white overflow-hidden w-full'>
        <div className='shrink-0 z-40'>
            <Navbar />
        </div>
        
        <div className='flex-grow flex flex-col justify-between px-5 py-2 min-h-0 overflow-hidden w-full relative'>

            <h1 className='text-xl md:text-2xl font-bold shrink-0 my-2'>
                {type === 'category' ? (
                    <span className='text-yellow-400'>{query}</span>
                ) : (
                    <span>Results for: <span className='text-yellow-400'>{query}</span></span>
                )}
            </h1>

            <div className='flex-grow flex items-center justify-center min-h-0 w-full my-1 relative overflow-hidden'>
                
                {page > 0 && !loading && (
                    <button 
                        onClick={handlePrev}
                        aria-label="Previous Page"
                        className='absolute left-2 top-1/2 -translate-y-1/2 z-50 p-3 text-yellow-400 hover:text-white bg-black/80 hover:bg-black transition-all duration-300 hover:scale-110 cursor-pointer rounded-full border border-yellow-400/50 shadow-2xl backdrop-blur-sm'
                    >
                        <ChevronUp size={30} strokeWidth={2.5} className="-rotate-90" />
                    </button>
                )}

                {loading ? (
                    <div className='text-yellow-400 font-semibold text-lg animate-pulse'>
                        Loading movies...
                    </div>
                ) : currentMovies.length > 0 ? (
                    /* Tailwind scrollbar hiding classes + overflow padding */
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full max-h-full overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
                        {currentMovies.map((movie, index) => {
                            const rawPoster = 
                              typeof movie.primaryImage === 'string' ? movie.primaryImage :
                              movie.primaryImage?.url || 
                              movie.thumbnails?.[0]?.url;

                            const posterUrl = rawPoster 
                              ? rawPoster.replace(/\._V1_.*?\.(jpg|jpeg|png)$/i, '.$1') 
                              : 'https://via.placeholder.com/300x450?text=No+Poster';

                            const title = movie.primaryTitle || movie.title || `Movie ${page * itemsPerPage + index + 1}`;

                            return (
                              <div 
                                  key={movie.id || index} 
                                  onClick={() => setSelectedMovie(movie)}
                                  /* Option 1: 2/3 aspect ratio card container */
                                  className='bg-gray-800 border border-gray-700 aspect-[2/3] w-full rounded-lg flex flex-col items-center justify-center hover:scale-105 hover:border-yellow-400 transition-all duration-300 cursor-pointer shadow-lg overflow-hidden relative group z-10'
                              >
                                  {/* Option 1: object-cover image fitting */}
                                  <img 
                                      src={posterUrl} 
                                      alt={title} 
                                      className='w-full h-full object-cover'
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                                      }}
                                  />

                                  <div className='absolute bottom-0 inset-x-0 bg-black/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center text-xs font-bold text-yellow-400 truncate'>
                                      {title}
                                  </div>
                              </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className='text-gray-400 text-lg'>No movies found.</div>
                )}

                {page < maxPage && !loading && (
                    <button 
                        onClick={handleNext}
                        aria-label="Next Page"
                        className='absolute right-2 top-1/2 -translate-y-1/2 z-50 p-3 text-yellow-400 hover:text-white bg-black/80 hover:bg-black transition-all duration-300 hover:scale-110 cursor-pointer rounded-full border border-yellow-400/50 shadow-2xl backdrop-blur-sm'
                    >
                        <ChevronDown size={30} strokeWidth={2.5} className="-rotate-90" />
                    </button>
                )}

            </div> 

        </div>

        {selectedMovie && (
          <MovieDetails
            movieData={selectedMovie}
            movieId={selectedMovie.id} 
            onClose={() => setSelectedMovie(null)} 
          />
        )}
    </div>
  );
};

export default Results;