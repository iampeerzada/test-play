import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Plyr from 'plyr';
import { Movie } from '../data/movies';
import { cleanStreamUrl } from '../utils/stream';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onNext?: () => void;
}

export function VideoPlayer({ movie, onClose, onNext }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  const finalUrl = cleanStreamUrl(movie.videoUrl);

  useEffect(() => {
    // Add escape key listener to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Initialize Plyr setup options
    const defaultOptions: Plyr.Options = {
        controls: [
            'play-large',
            'restart',
            'rewind',
            'play',
            'fast-forward',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'airplay',
            'fullscreen'
        ],
        settings: ['quality', 'speed', 'loop'],
        autoplay: true,
    };

    playerRef.current = new Plyr(video, defaultOptions);
    playerRef.current.volume = 1; // Force max volume
    
    playerRef.current.on('ended', () => {
      if (onNextRef.current) onNextRef.current();
    });

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [finalUrl]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
         <button 
           onClick={onClose}
           className="p-2 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors duration-200 tv-focus group focus:scale-110"
           tabIndex={0}
           autoFocus
         >
           <X className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
         </button>
      </div>

      {/* Video Container */}
      <div className="w-full max-w-7xl aspect-video rounded-xl overflow-hidden shadow-2xl relative bg-black tv-focus">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Stream Error</h3>
            <p className="text-zinc-400 mb-6 max-w-md">
              {error}
            </p>
            <div className="flex gap-4">
               <button onClick={() => window.open(finalUrl, '_blank')} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">
                 Open Direct Link
               </button>
               {onNext && (
                 <button onClick={onNext} className="px-6 py-2 bg-white hover:bg-red-600 hover:text-white rounded-lg text-black font-medium transition-colors">
                   Next Stream
                 </button>
               )}
            </div>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain plyr-react"
            playsInline
            controls
            autoPlay
            onError={(e) => {
               console.error("Video element error:", e);
               setError("The stream could not be loaded. It might be offline or returning a Bad Gateway (502) error from the provider.");
               if (movie.id) {
                 fetch('/api/report-channel-error', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ videoId: movie.id })
                 }).catch(console.error);
               }
            }}
          >
            <source src={finalUrl} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}
