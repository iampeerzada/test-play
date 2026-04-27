import { useState, useRef, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { Movie } from '../data/movies';

interface CustomStreamModalProps {
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

export function CustomStreamModal({ onClose, onPlay }: CustomStreamModalProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePlay = (e: any) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Check if it's m3u/m3u8, assuming it's a live stream if so.
    const isM3u8 = url.includes('.m3u') || url.includes('.m3u8');
    
    onPlay({
      id: 'custom_' + Date.now(),
      title: 'Custom Stream',
      videoUrl: url.trim(),
      category: isM3u8 ? 'Live TV' : 'Custom',
      posterUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=800',
      isLive: isM3u8
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#141519] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold font-sans tracking-tight text-white">Play Custom Stream</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handlePlay} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="streamUrl" className="text-sm font-medium text-gray-300">
              Stream URL (M3U, M3U8, MP4, etc.)
            </label>
            <input 
              ref={inputRef}
              id="streamUrl"
              type="url" 
              placeholder="https://example.com/playlist.m3u8"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono text-sm"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-600 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Play Stream
          </button>
        </form>
      </div>
    </div>
  );
}
