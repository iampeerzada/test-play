import { Movie } from '../data/movies';
import { MovieCard } from './MovieCard';
import { Key } from 'react';

interface MovieRowProps {
  key?: Key;
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onInfo: (movie: Movie) => void;
}

export function MovieRow({ title, movies, onPlay, onInfo }: MovieRowProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="py-4 md:py-6 relative w-full">
      <h2 className="text-white text-lg md:text-xl font-bold px-4 md:px-12 mb-3 md:mb-4 shrink-0">
        {title}
      </h2>
      
      {/* Container for the scrollable items */}
      <div className="relative group">
        <div 
          className="flex gap-2 md:gap-4 px-4 md:px-12 overflow-x-auto no-scrollbar scroll-smooth w-full py-4 pb-8 snap-x snap-mandatory"
        >
          {movies.map((movie) => (
            <div key={movie.id} className="snap-start snap-always align-start">
              <MovieCard movie={movie} onPlay={onPlay} onInfo={onInfo} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
