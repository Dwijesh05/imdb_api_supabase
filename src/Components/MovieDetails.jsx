import React, { useEffect } from 'react';
import { 
  X, Star, Clock, Calendar, MapPin, DollarSign, 
  ExternalLink, Building2
} from 'lucide-react';

const MovieDetails = ({ movieData, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!movieData) return null;

  const movie = movieData;
  const title = movie?.primaryTitle || movie?.title || 'Untitled';

  const formatCurrency = (val) => {
    if (!val) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const rawPrimaryImage = typeof movie?.primaryImage === 'string' 
    ? movie.primaryImage 
    : movie?.primaryImage?.url || movie?.thumbnails?.[1]?.url || movie?.thumbnails?.[0]?.url;

  const primaryPoster = rawPrimaryImage 
    ? rawPrimaryImage.replace(/\._V1_.*?\.(jpg|jpeg|png)$/i, '.$1') 
    : 'https://via.placeholder.com/300x450?text=No+Poster';

  const titleId = movie?.id || movie?.imdbId || movie?.tconst;
  const imdbWebUrl = titleId ? `https://www.imdb.com/title/${titleId}/` : null;

  const rating = movie?.averageRating || movie?.rating;
  const year = movie?.startYear || movie?.year;
  const runtime = movie?.runtimeMinutes || movie?.runtime;
  const description = movie?.description || movie?.plot || movie?.overview;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col overflow-y-auto animate-fadeIn">
      
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-50 p-3 bg-black/80 hover:bg-yellow-400 hover:text-black text-white rounded-full transition-all cursor-pointer border border-yellow-400 shadow-2xl"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="relative w-full h-[60vh] min-h-[450px] bg-black border-b-2 border-yellow-400 flex items-end overflow-hidden">
        
        <div className="absolute inset-0 z-0">
          <img 
            src={primaryPoster} 
            alt={title} 
            className="w-full h-full object-cover filter brightness-75 scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/1200x800?text=No+Poster+Preview';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-black/30" />
        </div>

        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 pb-8 flex flex-col md:flex-row gap-6 items-center md:items-end">

          <img 
            src={primaryPoster} 
            alt={title} 
            className="w-36 md:w-48 h-52 md:h-72 object-cover rounded-xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] shrink-0 hidden sm:block"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />

          <div className="space-y-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              {movie.type && (
                <span className="text-black bg-yellow-400 px-3 py-0.5 rounded font-black text-xs uppercase tracking-wider">
                  {movie.type}
                </span>
              )}
              {movie.contentRating && (
                <span className="text-yellow-400 border border-yellow-400/60 bg-black/60 px-2.5 py-0.5 rounded font-bold text-xs">
                  {movie.contentRating}
                </span>
              )}
              {movie.metascore && (
                <span className="bg-green-600 text-white px-2 py-0.5 rounded font-black text-xs">
                  Metascore {movie.metascore}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-yellow-400 drop-shadow-md">
              {title}
            </h1>

            {movie.originalTitle && movie.originalTitle !== title && (
              <p className="text-gray-300 italic text-sm md:text-base">
                Original Title: {movie.originalTitle}
              </p>
            )}


            {movie.interests && movie.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.interests.map((interest, idx) => (
                  <span key={idx} className="text-xs bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 px-2.5 py-1 rounded-full font-medium">
                    #{interest}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-10 space-y-10 flex-grow">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-900/80 p-5 rounded-2xl border border-gray-800 shadow-lg">

          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-400">
              <Star size={24} className="fill-yellow-400" />
            </div>
            <div>
              <div className="text-xl font-black text-yellow-400">
                {rating ? `${rating} / 10` : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">
                {movie.numVotes ? `${movie.numVotes.toLocaleString()} votes` : 'IMDb Rating'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-400">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-xl font-black text-white">
                {year || 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Release Year</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-400">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xl font-black text-white">
                {runtime ? `${runtime} min` : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Runtime</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-400">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-xl font-black text-white truncate">
                {movie.productionCompanies?.[0]?.grossWorldwide || movie.grossWorldwide
                  ? `$${((movie.productionCompanies?.[0]?.grossWorldwide || movie.grossWorldwide) / 1000000).toFixed(2)}M` 
                  : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Box Office Gross</div>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-8">
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-yellow-400 border-l-4 border-yellow-400 pl-3">
                Overview & Synopsis
              </h2>
              <p className="text-gray-200 text-base md:text-lg leading-relaxed bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                {description || 'No description available for this title.'}
              </p>
            </div>

            {(movie.filmingLocations?.[0] || movie.productionCompanies?.[0]?.name) && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-yellow-400 border-l-4 border-yellow-400 pl-3">
                  Production & Location
                </h3>
                 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movie.filmingLocations?.[0] && (
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-start gap-3">
                      <MapPin size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400 uppercase font-bold">Filming Location</div>
                        <div className="text-sm font-semibold text-gray-200 mt-1">
                          {movie.filmingLocations[0]}
                        </div>
                      </div>
                    </div>
                  )}

                  {movie.productionCompanies?.[0]?.name && (
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-start gap-3">
                      <Building2 size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400 uppercase font-bold">Production Company</div>
                        <div className="text-sm font-semibold text-gray-200 mt-1">
                          {movie.productionCompanies.map(c => c.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="space-y-8">

            {movie.genres && movie.genres.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-yellow-400">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre, idx) => (
                    <span key={idx} className="bg-gray-900 text-yellow-300 border border-yellow-400/40 px-4 py-1.5 rounded-lg text-sm font-bold">
                      {typeof genre === 'string' ? genre : genre.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 space-y-4">
              <h3 className="text-base font-bold text-yellow-400 border-b border-gray-800 pb-2">
                Movie Specs
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-800/60 pb-2">
                  <span className="text-gray-400">Release Date</span>
                  <span className="text-white font-semibold">{movie.releaseDate || 'N/A'}</span>
                </div>

                <div className="flex justify-between border-b border-gray-800/60 pb-2">
                  <span className="text-gray-400">Origin Country</span>
                  <span className="text-white font-semibold">{movie.countriesOfOrigin?.join(', ') || 'N/A'}</span>
                </div>

                <div className="flex justify-between border-b border-gray-800/60 pb-2">
                  <span className="text-gray-400">Spoken Languages</span>
                  <span className="text-white font-semibold uppercase">{movie.spokenLanguages?.join(', ') || 'N/A'}</span>
                </div>

                {movie.productionCompanies?.[0]?.budget && (
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-400">Budget</span>
                    <span className="text-yellow-400 font-semibold">
                      {formatCurrency(movie.productionCompanies[0].budget)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(imdbWebUrl || (movie.externalLinks && movie.externalLinks.length > 0)) && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-yellow-400">External Links</h3>
                <div className="flex flex-col gap-2">

                  {imdbWebUrl && (
                    <a 
                      href={imdbWebUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between bg-gray-900 hover:bg-yellow-400 hover:text-black border border-yellow-400/40 px-4 py-2.5 rounded-xl text-sm font-bold text-yellow-400 transition-colors cursor-pointer"
                    >
                      <span>View on IMDb</span>
                      <ExternalLink size={16} />
                    </a>
                  )}

                  {movie.externalLinks?.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 transition-colors cursor-pointer"
                    >
                      <span className="truncate pr-2">{link}</span>
                      <ExternalLink size={16} className="shrink-0 text-yellow-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default MovieDetails;