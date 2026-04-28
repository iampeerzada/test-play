import { useEffect, useRef, useMemo, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import { Movie } from '../data/movies';
import { cleanStreamUrl } from '../utils/stream';

interface HlsVideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onNext?: () => void;
}

export function HlsVideoPlayer({ movie, onClose, onNext }: HlsVideoPlayerProps) {
  const [useProxy, setUseProxy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  const finalUrl = useMemo(() => {
    const streamUrl = cleanStreamUrl(movie.videoUrl);
    // Don't proxy HTTPS URLs by default so user sees real URL
    // unless they fail and we trigger fallback via useProxy.
    // HTTP URLs must be proxied if we are on HTTPS to avoid Mixed Content blocker.
    const mustProxy = typeof window !== 'undefined' && window.location.protocol === 'https:' && streamUrl.startsWith('http://');
    
    if (useProxy || mustProxy) {
      return `/proxy?url=${encodeURIComponent(streamUrl)}`;
    }
    return streamUrl;
  }, [movie.videoUrl, useProxy]);

  useEffect(() => {
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
    
    const defaultOptions: Plyr.Options = {
        controls: [
            'play-large', 'restart', 'rewind', 'play', 'fast-forward',
            'progress', 'current-time', 'duration', 'mute', 'volume',
            'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['quality', 'speed', 'loop'],
        autoplay: true,
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
          enableWorker: false,
          maxLoadingDelay: 4,
          minAutoBitrate: 0,
          lowLatencyMode: true,
          liveSyncDurationCount: 3,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
      });
      hlsRef.current = hls;
      
      hls.loadSource(finalUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        const availableQualities = hls.levels.map((l) => l.height);
        availableQualities.unshift(0);

        const optionsWithQuality: Plyr.Options = {
          ...defaultOptions,
          quality: {
            default: 0,
            options: availableQualities,
            forced: true,
            onChange: (e: number) => {
              if (e === 0) {
                hls.currentLevel = -1;
              } else {
                hls.levels.forEach((level, levelIndex) => {
                  if (level.height === e) {
                    hls.currentLevel = levelIndex;
                  }
                });
              }
            }
          },
          i18n: { qualityLabel: { 0: 'Auto' } }
        };

        playerRef.current = new Plyr(video, optionsWithQuality);
        playerRef.current.volume = 1;
        
        playerRef.current.on('ended', () => {
          if (onNextRef.current) onNextRef.current();
        });
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
         if (data.fatal) {
           switch(data.type) {
             case Hls.ErrorTypes.NETWORK_ERROR:
               if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || 
                   data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
                 if (!useProxy) {
                    console.log('Network error detected. CORS or Blocked. Falling back to proxy:', movie.videoUrl);
                    setUseProxy(true);
                    return;
                 }
               }
               
               if (useProxy || 
                   data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || 
                   data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
                   data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
                   data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT) {
                    hls.destroy();
                    setError("The Live TV stream could not be loaded. It might be offline or returning a Bad Gateway (502) error from the provider.");
                    fetch('/api/report-channel-error', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ videoId: movie.id })
                    }).then(() => {
                       window.dispatchEvent(new CustomEvent('channel-error', { detail: { videoId: movie.id } }));
                    });
                    return;
                }
                hls.startLoad();
                break;
             case Hls.ErrorTypes.MEDIA_ERROR:
               hls.recoverMediaError();
               break;
             default:
               hls.destroy();
               setError("The Live TV stream could not be loaded because the channel is currently offline or blocking access.");
               fetch('/api/report-channel-error', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ videoId: movie.id })
               }).then(() => {
                  window.dispatchEvent(new CustomEvent('channel-error', { detail: { videoId: movie.id } }));
               });
               break;
           }
         }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = finalUrl;
      playerRef.current = new Plyr(video, defaultOptions);
      playerRef.current.volume = 1;
      
      playerRef.current.on('ended', () => {
        if (onNextRef.current) onNextRef.current();
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [finalUrl, movie.id]);

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
      <div className="w-full max-w-7xl aspect-video rounded-xl overflow-hidden shadow-2xl relative bg-black tv-focus">
        {error && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-900/95 text-white p-6 text-center">
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
        )}
        <div style={{ display: error ? 'none' : 'block', width: '100%', height: '100%' }}>
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain plyr-react"
            playsInline
            controls
            autoPlay
            onError={(e) => {
               console.error("Video element error:", e);
               setError("The stream could not be loaded because it is offline.");
            }}
          />
        </div>
      </div>
    </div>
  );
}
