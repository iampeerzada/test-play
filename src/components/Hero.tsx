import { Play, Info } from 'lucide-react';
import { Movie } from '../data/movies';

interface HeroProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onInfo: (movie: Movie) => void;
}

export function Hero({ movie, onPlay, onInfo }: HeroProps) {
  if (!movie) return null;

  return (
    <div className="relative z-20 w-full h-[60vh] md:h-[80vh] lg:h-[90vh] flex-shrink-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for blending into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/40 to-transparent" />
        {/* Horizontal gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full px-4 md:px-12 pb-16 md:pb-24 lg:pb-32 flex justify-start items-end cursor-default">
        <div className="max-w-xl md:max-w-2xl text-left">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
            {movie.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm font-semibold text-gray-300 mb-4 md:mb-6">
            {movie.year && <span>{movie.year}</span>}
            {movie.rating && <span className="border border-gray-500 px-1 rounded">{movie.rating}</span>}
            {movie.duration && <span>{movie.duration}</span>}
            <span className="text-white/80 shrink-0">{movie.category}</span>
          </div>

          {/* movie description removed */}

          <div className="relative z-30 flex flex-row items-center gap-4">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center justify-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded-md font-bold hover:bg-white/80 transition-colors tv-focus group focus:ring-4 focus:ring-white/50"
              tabIndex={0}
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-current group-hover:scale-110 transition-transform" />
              <span>Play Now</span>
            </button>
            <button
              onClick={() => onInfo(movie)}
              className="flex items-center justify-center gap-2 bg-[#0f1014]/50 hover:bg-[#0f1014]/80 text-white border border-white/30 px-6 md:px-8 py-2 md:py-3 rounded-md font-bold transition-colors tv-focus backdrop-blur focus:ring-4 focus:ring-white/50"
              tabIndex={0}
            >
              <Info className="w-5 h-5 md:w-6 md:h-6" />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
