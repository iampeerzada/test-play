import { Movie } from '../data/movies';
import { Play, Info } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onInfo?: (movie: Movie) => void;
}

export function MovieCard({ movie, onPlay, onInfo }: MovieCardProps) {
  return (
    <div
      className="relative shrink-0 w-36 md:w-48 lg:w-56 group rounded-md overflow-hidden cursor-pointer bg-gray-800 transition-transform duration-300 hover:scale-105 hover:z-20 tv-focus outline-none"
      tabIndex={0}
      onClick={() => onPlay(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPlay(movie);
      }}
    >
      <div className="aspect-[2/3] w-full bg-gray-900 relative">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75"
          loading="lazy"
        />
        {/* Play Icon overlay on hover/focus */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity gap-2">
          <div 
            className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform hover:bg-red-600"
            onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
          >
            <Play className="w-5 h-5 text-white fill-current ml-1" />
          </div>
          {onInfo && (
            <div 
              className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform hover:bg-gray-600"
              onClick={(e) => { e.stopPropagation(); onInfo(movie); }}
            >
              <Info className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>
      
      {/* Title overlay at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
        <h3 className="text-white text-xs md:text-sm font-semibold truncate">
          {movie.title}
        </h3>
        {movie.isLive && (
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
            Live
          </span>
        )}
      </div>
    </div>
  );
}
