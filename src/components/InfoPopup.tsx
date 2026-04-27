import { Movie } from '../data/movies';
import { X, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InfoPopupProps {
  movie: Movie;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

export function InfoPopup({ movie, onClose, onPlay }: InfoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // start opening animation after brief delay
    const t = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for transition
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div 
        className={`fixed top-0 left-0 h-full w-[400px] max-w-[100vw] bg-[#0f1014] z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-800 flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative h-64 shrink-0">
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] to-transparent" />
          
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
          <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
          
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-400 mb-6 border-b border-gray-800 pb-4">
            {movie.year && <span>{movie.year}</span>}
            {movie.rating && <span className="border border-gray-600 px-1 rounded">{movie.rating}</span>}
            {movie.duration && <span>{movie.duration}</span>}
            {movie.industry && <span>{movie.industry}</span>}
            <span className="text-white/80">{movie.category}</span>
            {movie.language && <span className="text-red-400 font-bold">{movie.language}</span>}
            {movie.isLive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
                Live
              </span>
            )}
          </div>

          {(movie.season || movie.episode) && (
            <div className="text-gray-300 text-sm font-medium mb-3">
              Season {movie.season || '1'} {movie.episode ? `• Episode ${movie.episode}` : ''}
            </div>
          )}
          
          {movie.genre && movie.genre.length > 0 && (
            <div className="text-sm text-gray-400 mb-4">
              Genres: <span className="text-gray-300">{movie.genre.join(', ')}</span>
            </div>
          )}
          
          <p className="text-gray-300 leading-relaxed mb-8">
            {movie.description || 'No description available for this title.'}
          </p>
          
          <button
            onClick={() => onPlay(movie)}
            className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-md font-bold hover:bg-white/90 transition-colors w-full focus:ring-4 focus:ring-white/50 mb-4"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play Now</span>
          </button>
        </div>
      </div>
    </>
  );
}
