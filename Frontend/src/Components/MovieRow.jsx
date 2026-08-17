import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';

const MovieRow = ({ title, movies = [], onMovieClick }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
  }, [movies]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const visibleWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: -visibleWidth * 0.75, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const visibleWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: visibleWidth * 0.75, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col my-4 relative group">

      <h2 className="text-xl font-bold ml-4 text-white mb-2">{title}</h2>

      <div className="relative">

        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 p-2 rounded-full hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-xl"
            aria-label="Scroll Left"
          >
            <ChevronLeft size={40} strokeWidth={2.5} color="white" />
          </button>
        )}

 
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="ml-4 mr-4 gap-4 flex flex-row overflow-x-auto py-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {movies.map((movie, index) => {
            const rawPoster = 
              typeof movie.primaryImage === 'string' ? movie.primaryImage :
              movie.primaryImage?.url || 
              movie.thumbnails?.[1]?.url || 
              movie.thumbnails?.[0]?.url;

            const posterUrl = rawPoster 
              ? rawPoster.replace(/\._V1_.*?\.(jpg|jpeg|png)$/i, '.$1') 
              : 'https://via.placeholder.com/300x450?text=No+Poster';

            const displayTitle = movie.primaryTitle || movie.title || 'Untitled';
            const rating = movie.averageRating || movie.rating;

            return (
              <div
                key={movie.id || index}
                onClick={() => onMovieClick && onMovieClick(movie)} 
                className="bg-gray-800 border border-gray-700 aspect-[2/3] rounded-lg overflow-hidden relative group/card hover:border-yellow-400 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg w-[42%] sm:w-[28%] md:w-[21%] lg:w-[16%] xl:w-[12.8%] shrink-0"
              >
                <img 
                  src={posterUrl} 
                  alt={displayTitle} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                  <span className="text-white font-bold text-sm line-clamp-2 drop-shadow">
                    {displayTitle}
                  </span>
                  
                  {rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400 text-xs font-black">{rating}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 p-2 rounded-full hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-xl"
            aria-label="Scroll Right"
          >
            <ChevronRight size={40} strokeWidth={2.5} color="white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieRow;