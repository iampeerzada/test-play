export interface Movie {
  id: string;
  title: string;
  category: string;
  posterUrl: string;
  videoUrl: string;
  isLive?: boolean;
  description?: string;
  language?: string;
  year?: string | number;
  rating?: string;
  duration?: string;
  // Extended Telegram metadata
  type?: string;
  season?: string | number;
  episode?: string | number;
  part?: string | number;
  industry?: string;
  genre?: string[];
}

export const moviesData: Movie[] = [
  {
    id: 'm1',
    title: 'Inception',
    category: 'Action',
    posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=774&ixlib=rb-4.0.3', // placeholder
    videoUrl: 'https://iptv.ifastx.in:8080/watch/69ee20ab1668c44785d4a91e',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
    year: '2010',
    rating: 'PG-13',
    duration: '2h 28m'
  },
  {
    id: 'm2',
    title: 'The Dark Knight',
    category: 'Action',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://iptv.ifastx.in:8080/watch/12345', // Uncleaned URL format for testing
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    year: '2008',
    rating: 'PG-13',
    duration: '2h 32m'
  },
  {
    id: 'm3',
    title: 'Interstellar',
    category: 'Sci-Fi',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    year: '2014',
    rating: 'PG-13',
    duration: '2h 49m'
  },
  {
    id: 'm4',
    title: 'Blade Runner 2049',
    category: 'Sci-Fi',
    posterUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who\'s been missing for thirty years.',
    year: '2017',
    rating: 'R',
    duration: '2h 44m'
  },
  {
    id: 's1',
    title: 'Breaking Bad',
    category: 'Web Series',
    posterUrl: 'https://images.unsplash.com/photo-1594472914101-789a74a4f8f4?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s future.',
    year: '2008-2013',
    rating: 'TV-MA',
    duration: '5 Seasons'
  },
  {
    id: 's2',
    title: 'Stranger Things',
    category: 'Web Series',
    posterUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.',
    year: '2016-',
    rating: 'TV-14',
    duration: '4 Seasons'
  },
  {
    id: 'l1',
    title: 'Sports HD',
    category: 'Live TV',
    posterUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isLive: true,
    description: '24/7 Live Sports Coverage from around the world.'
  },
  {
    id: 'l2',
    title: 'News 24 HD',
    category: 'Live TV',
    posterUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=1000', // placeholder
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isLive: true,
    description: 'Breaking news and global coverage, 24/7.'
  },
  {
    id: 'm5',
    title: 'Mad Max: Fury Road',
    category: 'Action',
    posterUrl: 'https://images.unsplash.com/photo-1456315138460-ec5e509d73eb?auto=format&fit=crop&q=80&w=1000',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.',
    year: '2015',
    rating: 'R',
    duration: '2h 00m'
  },
  {
    id: 'm6',
    title: 'John Wick',
    category: 'Action',
    posterUrl: 'https://images.unsplash.com/photo-1543333333-e18ece176ba0?auto=format&fit=crop&q=80&w=1000', // using placeholder
    videoUrl: 'https://iptv.ifastx.in:8080/watch/99999', // Uncleaned URL format for testing
    description: 'An ex-hit-man comes out of retirement to track down the gangsters that killed his dog and took everything from him.',
    year: '2014',
    rating: 'R',
    duration: '1h 41m'
  }
];
