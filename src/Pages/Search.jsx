import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import MovieDetails from '../Components/MovieDetails';
import { getAutocompleteSuggestions } from '../Services/api';
import { Search as SearchIcon, Star, Loader2 } from 'lucide-react';

const Search = () => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    
    const timer = setTimeout(async () => {
      const results = await getAutocompleteSuggestions(searchInput);
      setSuggestions(results);
      setShowDropdown(true);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer); 
  }, [searchInput]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      setShowDropdown(false);
      navigate(`/results?q=${encodeURIComponent(searchInput)}&type=search`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 mt-12 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold mb-6 text-center">
          Search <span className="text-yellow-400">Movies & TV Shows</span>
        </h1>

        <div className="relative w-full max-w-2xl" ref={dropdownRef}>
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Search for a movie or TV show..." 
              onKeyDown={handleSearch} 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              className="w-full bg-gray-900 text-white outline-none border border-gray-700 focus:border-yellow-400 py-3.5 pl-12 pr-10 rounded-2xl transition-all shadow-xl text-lg"
            />
            
            <SearchIcon className="absolute left-4 text-gray-400" size={22} />

            {loading && (
              <Loader2 className="absolute right-4 text-yellow-400 animate-spin" size={20} />
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto animate-fadeIn">
              {suggestions.map((item, index) => {
                const rawPoster = typeof item.primaryImage === 'string' 
                  ? item.primaryImage 
                  : item.primaryImage?.url || item.thumbnails?.[0]?.url;

                const posterUrl = rawPoster 
                  ? rawPoster.replace(/\._V1_.*?\.(jpg|jpeg|png)$/i, '.$1') 
                  : 'https://via.placeholder.com/100x150?text=No+Poster';

                const title = item.primaryTitle || item.title || 'Untitled';
                const year = item.startYear || item.year;
                const rating = item.averageRating || item.rating;

                return (
                  <div
                    key={item.id || index}
                    onClick={() => {
                      setSelectedMovie(item); 
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-4 p-3 hover:bg-gray-800/80 transition-colors cursor-pointer border-b border-gray-800/60 last:border-0"
                  >
                    <img 
                      src={posterUrl} 
                      alt={title} 
                      className="w-12 h-16 object-cover rounded-md border border-gray-700 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/100x150?text=No+Poster';
                      }}
                    />

                    <div className="flex flex-col justify-center">
                      <span className="text-white font-bold text-base line-clamp-1 group-hover:text-yellow-400">
                        {title}
                      </span>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        {year && <span>{year}</span>}
                        {rating && (
                          <div className="flex items-center gap-1 text-yellow-400 font-bold">
                            <Star size={12} className="fill-yellow-400" />
                            <span>{rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          
          {showDropdown && !loading && suggestions.length === 0 && searchInput.trim() !== '' && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-4 text-center text-gray-400 text-sm z-50">
              No movies found matching "{searchInput}"
            </div>
          )}
        </div>
      </div>

      {selectedMovie && (
        <MovieDetails 
          movieData={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
};

export default Search;