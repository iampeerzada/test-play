import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { VideoPlayer } from '../components/VideoPlayer';
import { HlsVideoPlayer } from '../components/HlsVideoPlayer';
import { InfoPopup } from '../components/InfoPopup';
import { CustomStreamModal } from '../components/CustomStreamModal';
import { Movie } from '../data/movies';

export function Home() {
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoMovie, setInfoMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://iptv.ifastx.in');
  const [showCustomStream, setShowCustomStream] = useState(false);
  const [activeTab, setActiveTab] = useState<'Home' | 'Movies' | 'OTT' | 'Live TV'>('Home');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [moviesRes, settingsRes] = await Promise.all([
          fetch('/api/movies'),
          fetch('/api/settings')
        ]);
        if (!moviesRes.ok || !settingsRes.ok) {
           throw new Error('Failed to fetch data from server');
        }
        const moviesData = await moviesRes.json();
        const settingsData = await settingsRes.json();
        setMovies(moviesData);
        setBaseUrl(settingsData.baseUrl);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const categorizedMovies = useMemo<Record<string, Movie[]>>(() => {
    const groups: Record<string, Movie[]> = {};
    
    // First, filter by tab
    let tabFiltered = movies;
    if (activeTab === 'Movies') {
       tabFiltered = movies.filter(m => m.type === 'Movie' || (!m.isLive && m.type !== 'Live TV' && m.category !== 'Live TV' && m.category !== 'Web Series' && m.type !== 'Web Series'));
    } else if (activeTab === 'OTT') {
       tabFiltered = movies.filter(m => m.type === 'Web Series' || m.category === 'Web Series' || m.type === 'Tv Show');
    } else if (activeTab === 'Live TV') {
       tabFiltered = movies.filter(m => m.type === 'Live TV' || m.category === 'Live TV' || m.isLive);
    } else if (activeTab === 'Home') {
       // Home tab might just show everything, or a mix of Web Series & Movies
       // For now, let's keep all
       tabFiltered = movies;
    }

    // Then text search filter
    const searchFiltered = tabFiltered.filter(m => {
       const term = searchQuery.toLowerCase();
       if (!term) return true;
       return (
          m.title.toLowerCase().includes(term) ||
          (m.category && m.category.toLowerCase().includes(term)) ||
          (m.industry && m.industry.toLowerCase().includes(term)) ||
          (m.genre && m.genre.some(g => g.toLowerCase().includes(term)))
       );
    });

    searchFiltered.forEach(movie => {
      let groupKeys: string[] = [];

      if (activeTab === 'Movies' || activeTab === 'OTT') {
         // Priority to industry (Hollywood, Bollywood) and genres
         if (movie.industry) groupKeys.push(movie.industry);
         if (movie.genre && Array.isArray(movie.genre)) {
            groupKeys.push(...movie.genre);
         }
         if (groupKeys.length === 0) {
            groupKeys.push(movie.category || 'Uncategorized');
         }
      } else {
         groupKeys.push(movie.category || 'Uncategorized');
      }

      // Remove duplicates
      groupKeys = [...new Set(groupKeys)];

      groupKeys.forEach(groupKey => {
         if (!groups[groupKey]) {
            groups[groupKey] = [];
         }
         
         // Apply baseUrl override to videoUrl if applicable
         const cleanedUrl = movie.videoUrl.replace('https://iptv.ifastx.in', baseUrl);
         groups[groupKey].push({ ...movie, videoUrl: cleanedUrl });
      });
    });
    return groups;
  }, [movies, baseUrl, searchQuery, activeTab]);

  const categories = Object.keys(categorizedMovies);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1014] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const heroMovie = categorizedMovies[Object.keys(categorizedMovies)[0]]?.[0];

  const handlePlayNext = () => {
    if (!activeMovie) return;
    
    const categoryMovies = categorizedMovies[activeMovie.category || activeMovie.industry || ''];
    if (categoryMovies) {
      const currentIndex = categoryMovies.findIndex(m => m.id === activeMovie.id);
      if (currentIndex !== -1 && currentIndex + 1 < categoryMovies.length) {
        setActiveMovie(categoryMovies[currentIndex + 1]);
        return;
      }
    }
    
    // Default fallback to close if no next movie is found
    setActiveMovie(null);
  };

  return (
    <div className="min-h-screen bg-[#0f1014] text-white flex flex-col relative overflow-x-hidden">
      <Navbar 
         activeTab={activeTab} 
         onTabChange={(tab) => setActiveTab(tab as any)} 
         onSearch={setSearchQuery} 
         onCustomStream={() => setShowCustomStream(true)} 
      />
      
      <main className="flex-1 pb-16">
        {heroMovie ? (
          <Hero movie={heroMovie} onPlay={setActiveMovie} onInfo={setInfoMovie} />
        ) : (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-500">No Movies Available</h2>
          </div>
        )}
        
        <div className="relative z-10 flex flex-col gap-4 md:gap-8 pb-12">
          {Object.entries(categorizedMovies).map(([category, categoryMovies]: [string, Movie[]]) => (
            <div id={category} key={category} style={{ scrollMarginTop: '80px' }}>
              <MovieRow 
                title={category} 
                movies={categoryMovies} 
                onPlay={setActiveMovie} 
                onInfo={setInfoMovie}
              />
            </div>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm mt-auto border-t border-white/10">
        &copy; {new Date().getFullYear()} iFastX IPTV. All rights reserved.
      </footer>

      {infoMovie && (
        <InfoPopup 
          movie={infoMovie}
          onClose={() => setInfoMovie(null)}
          onPlay={(movie) => {
            setInfoMovie(null);
            setActiveMovie(movie);
          }}
        />
      )}

      {activeMovie && (
        (activeMovie.category === 'Live TV' || activeMovie.isLive || activeMovie.videoUrl.includes('.m3u8')) ? (
          <HlsVideoPlayer 
            movie={activeMovie} 
            onClose={() => setActiveMovie(null)} 
            onNext={handlePlayNext}
          />
        ) : (
          <VideoPlayer 
            movie={activeMovie} 
            onClose={() => setActiveMovie(null)} 
            onNext={handlePlayNext}
          />
        )
      )}
      
      {showCustomStream && (
        <CustomStreamModal 
          onClose={() => setShowCustomStream(false)}
          onPlay={(movie) => {
            setShowCustomStream(false);
            setActiveMovie(movie);
          }}
        />
      )}
    </div>
  );
}
