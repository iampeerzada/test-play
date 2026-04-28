import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs/promises";
import { Readable } from "stream";

interface ServerMovie {
  id: string;
  title: string;
  language?: string;
  category: string;
  posterUrl: string;
  videoUrl: string;
  isLive?: boolean;
  description?: string;
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

interface ServerSettings {
  categories: string[];
  baseUrl: string;
  mongoUri: string;
  mongoDbName: string;
  mongoCollection: string;
  m3uPlaylistUrls?: string;
  m3uSortAZ?: boolean;
}

// In-memory state - Starting empty to remove mock data
let moviesData: ServerMovie[] = [];
let movieOverrides: Record<string, Partial<ServerMovie>> = {};

let settings: ServerSettings = {
  categories: ['Action', 'Sci-Fi', 'Web Series', 'Live TV'],
  baseUrl: 'https://iptv.ifastx.in',
  mongoUri: 'mongodb+srv://peerzadaarmaan_db_user:iptv12345678@cluster0.fkklstq.mongodb.net/?appName=Cluster0',
  mongoDbName: 'FileStream',
  mongoCollection: 'file',
  m3uPlaylistUrls: '',
  m3uSortAZ: false
};

// Map of channel id to { disabled: boolean, lastChecked: number }
let channelStatusOverrides: Record<string, { hidden?: boolean }> = {};

let cachedM3uMovies: ServerMovie[] = [];
let lastM3uFetchTime = 0;

function parseM3u(m3uContent: string): any[] {
  const channels: any[] = [];
  const lines = m3uContent.split('\n');
  let currentChannel: any = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      if (logoMatch) {
         currentChannel.logo = logoMatch[1];
      }
      const lastCommaIdx = line.lastIndexOf(',');
      if (lastCommaIdx !== -1) {
         currentChannel.name = line.substring(lastCommaIdx + 1).trim();
      } else {
         currentChannel.name = 'Unknown Channel';
      }
    } else if (line && !line.startsWith('#')) {
      currentChannel.url = line;
      if (currentChannel.url && currentChannel.name) {
         channels.push({
           name: currentChannel.name,
           logo: currentChannel.logo || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80',
           url: currentChannel.url
         });
      }
      currentChannel = {};
    }
  }
  return channels;
}

async function fetchM3uPlaylists(urlsString: string): Promise<ServerMovie[]> {
  if (!urlsString) return [];
  
  let allChannels: ServerMovie[] = [];
  const lines = urlsString.split('\n');
  
  const playlistUrls: string[] = [];
  let rawContent = '';
  
  for (let i = 0; i < lines.length; i++) {
     const line = lines[i].trim();
     if (!line) continue;
     
     // Let's guess if it's a playlist URL
     // A playlist URL has no spaces, starts with http, and is relatively short (no commas, etc),
     // AND the previous line wasn't an #EXTINF
     if (line.match(/^https?:\/\/[^\s,]+$/)) {
        let prevLine = '';
        if (i > 0) prevLine = lines[i-1].trim();
        // If it comes after #EXTINF or is part of a CSV stream, we treat it as raw content
        if (prevLine.startsWith('#EXTINF') || prevLine.startsWith('#EXT-X-')) {
           rawContent += line + '\n';
        } else if (rawContent.includes('channel_name,group_title')) {
           rawContent += line + '\n';
        } else {
           playlistUrls.push(line);
        }
     } else {
        rawContent += line + '\n';
     }
  }

  // Parse raw content
  if (rawContent.trim().length > 0) {
     const channels: any[] = [];
     if (rawContent.includes('channel_name,group_title')) {
        const rawLines = rawContent.split('\n');
        for(let i=0; i<rawLines.length; i++) {
           const line = rawLines[i].trim();
           if (!line || line.includes('channel_name,group_title')) continue;
           
           const logoMatch = line.match(/tvg-logo=(?:""""|""|"|)(https?:\/\/[^" ,]+)/i);
           const logo = logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80';
           
           const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
           const channelUrl = urlMatch ? urlMatch[1] : '';
           
           let name = 'Unknown';
           const nameMatch = line.match(/^"([^"]+)"/);
           if (nameMatch) {
              name = nameMatch[1];
           } else {
              name = line.split(',')[0];
           }
           
           if (channelUrl) channels.push({ name, logo, url: channelUrl });
        }
     } else {
        channels.push(...parseM3u(rawContent));
     }
     
     const newMovies: ServerMovie[] = channels.map((c, idx) => ({
           id: `m3u_raw_${idx}`,
           title: c.name,
           category: 'Live TV',
           posterUrl: c.logo,
           videoUrl: c.url,
           isLive: true
     }));
     allChannels.push(...newMovies);
  }
  
  for (const url of playlistUrls) {
     try {
        const response = await fetch(url);
        if (response.ok) {
           const content = await response.text();
           const parsed = parseM3u(content);
           const movies: ServerMovie[] = parsed.map((c, idx) => ({
              id: `m3u_${Buffer.from(url).toString('base64').substring(0, 8)}_${idx}`,
              title: c.name,
              category: 'Live TV',
              posterUrl: c.logo,
              videoUrl: c.url,
              isLive: true
           }));
           allChannels.push(...movies);
        }
     } catch (e) {
        console.error("Failed to fetch M3U:", url, e);
     }
  }

  // Randomize ("Mix up") the channels or Sort A-Z based on setting
  if (settings.m3uSortAZ) {
      allChannels.sort((a, b) => a.title.localeCompare(b.title));
  } else {
      for (let i = allChannels.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allChannels[i], allChannels[j]] = [allChannels[j], allChannels[i]];
      }
  }

  return allChannels;
}

const STATE_FILE = path.join(process.cwd(), "server_state.json");

async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed.moviesData) moviesData = parsed.moviesData;
    if (parsed.settings) settings = { ...settings, ...parsed.settings };
    if (parsed.movieOverrides) movieOverrides = parsed.movieOverrides;
        // 6. Report channel error
        // 7. Update channel status from admin
        parsed.channelStatusOverrides && (channelStatusOverrides = parsed.channelStatusOverrides);
  } catch (e) {
    // start with defaults if no file
  }
}

async function saveState() {
  try {
    const dataString = JSON.stringify({ moviesData, settings, movieOverrides, channelStatusOverrides }, null, 2);
    await fs.writeFile(STATE_FILE, dataString);
    console.log("State saved to", STATE_FILE);
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

let mongoClient: MongoClient | null = null;
let mongoLastError: string | null = null;

async function getMongoData(page: number, limit: number, search: string, tab: string): Promise<{ data: ServerMovie[], total: number }> {
  if (!settings.mongoUri) return { data: [], total: 0 };
  
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(settings.mongoUri, { serverSelectionTimeoutMS: 5000 });
      await mongoClient.connect();
    }
    const db = mongoClient.db(settings.mongoDbName);
    const collection = db.collection(settings.mongoCollection);
    
    let match: any = {};
    if (search) {
      match['$or'] = [
        { title: { $regex: search, $options: 'i' } },
        { file_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tab === 'Movies') {
      match['$and'] = match['$and'] || [];
      match['$and'].push({
        $or: [
          { type: 'Movie' },
          { $and: [
             { type: { $ne: 'Web Series' } },
             { type: { $ne: 'Live TV' } },
             { type: { $ne: 'Tv Show' } },
             { category: { $ne: 'Web Series' } },
             { category: { $ne: 'Live TV' } },
             { isLive: { $ne: true } }
          ]}
        ]
      });
    } else if (tab === 'OTT') {
      match['$and'] = match['$and'] || [];
      match['$and'].push({
        $or: [
          { type: 'Web Series' },
          { category: 'Web Series' },
          { type: 'Tv Show' }
        ]
      });
    } else if (tab === 'Live TV') {
      match['$and'] = match['$and'] || [];
      match['$and'].push({
        $or: [
          { type: 'Live TV' },
          { category: 'Live TV' },
          { isLive: true }
        ]
      });
    }

    const skip = (page - 1) * limit;
    
    // Fetch total and paginated
    const total = await collection.countDocuments(match);
    const files = await collection.find(match).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
    
    // Map to ServerMovie
    const mapped = files.map(file => {
      const id = file._id.toString();
      const override = movieOverrides[id] || {};
      
      const defaultTitle = file.title || file.caption || (file.file_name 
        ? file.file_name.replace(/\.[^/.]+$/, "") 
        : 'Unknown Video');
      
      return {
        id,
        title: (override.title && override.title.trim() !== '') ? override.title : defaultTitle,
        language: override.language || file.language || '',
        category: (override.category && override.category.trim() !== '') ? override.category : (file.industry || file.category || file.type || settings.categories[0] || 'Uncategorized'), // Default category
        posterUrl: (override.posterUrl && override.posterUrl.trim() !== '') ? override.posterUrl : (file.posterUrl || file.poster || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80'),
        videoUrl: override.videoUrl || file.videoUrl || file.m3u8 || file.stream_url || file.streamUrl || `${settings.baseUrl}/watch/${id}`,
        year: override.year || file.year,
        type: override.type || file.type,
        season: override.season || file.season,
        episode: override.episode || file.episode,
        part: override.part || file.part,
        industry: override.industry || file.industry,
        genre: override.genre || (Array.isArray(file.genre) ? file.genre : (typeof file.genre === 'string' ? file.genre.split(',').map((g: string) => g.trim()) : undefined)),
        description: override.description || file.description || file.plot || file.summary,
        duration: override.duration || file.duration
      };
    });

    mongoLastError = null;
    return { data: mapped, total };
  } catch (error) {
    console.error("MongoDB fetch error:", error);
    mongoLastError = (error as Error).message;
    return { data: [], total: 0 };
  }
}

async function startServer() {
  await loadState();

  const app = express();
  const PORT = 3000;

  // Use body-parser for incoming webhook payloads
  app.use(bodyParser.json());

  // API Routes
  
  // Proxy for resolving CORS issues with M3U playlists and Live TV streams
  app.options("/proxy", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(200).end();
  });

  app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl || !targetUrl.startsWith('http')) {
       return res.status(400).send('Invalid URL');
    }
    
    try {
       const fetchOptions: any = {
         headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
           'Accept': '*/*',
         }
       };

       // Forward range requests for proper video scrubbing
       if (req.headers.range) {
         fetchOptions.headers['Range'] = req.headers.range;
       }

       // To avoid abort/timeout issues on big streams
       const controller = new AbortController();
       const timeout = setTimeout(() => controller.abort(), 86400000); // 24 hours
       fetchOptions.signal = controller.signal;

       const response = await fetch(targetUrl, fetchOptions);
       clearTimeout(timeout);
       
       if (!response.ok) {
         return res.status(response.status).send('Fetcher error: ' + response.statusText);
       }
       
       // Set open CORS headers
       res.setHeader('Access-Control-Allow-Origin', '*');
       res.setHeader('Access-Control-Allow-Headers', '*');
       res.setHeader('Access-Control-Expose-Headers', '*');
       res.setHeader('Accept-Ranges', 'bytes');
       res.setHeader('Content-Disposition', 'inline');
       res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
       
       const contentType = response.headers.get('content-type');
       if (contentType) res.setHeader('Content-Type', contentType);

       // Use the final URL in case there were redirects
       const finalTargetUrl = response.url;
       
       // If it's a playlist we might want to optionally rewrite, but 
       // let's just rewrite if it smells like m3u8
       if (finalTargetUrl.endsWith('.m3u8') || finalTargetUrl.includes('.m3u8?') || (contentType && contentType.includes('mpegurl')) || finalTargetUrl.includes('playlist.m3u8')) {
          let text = await response.text();
          const lines = text.split(/\r?\n/);
          
          const newLines = lines.map(line => {
             line = line.trim();
             if (!line || line.startsWith('#')) return line;
             
             let absoluteUrl = line;
             try {
                absoluteUrl = new URL(line, finalTargetUrl).href;
             } catch (e) {
                // Ignore parsing errors, keep as is
             }
             return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          });
          
          const rewrittenText = newLines.map(line => {
             if (line.startsWith('#') && line.includes('URI=')) {
                return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                   if (uri.startsWith('/proxy?')) return match; // Already proxied
                   let absoluteUri = uri;
                   try {
                      absoluteUri = new URL(uri, finalTargetUrl).href;
                   } catch (e) {}
                   return `URI="/proxy?url=${encodeURIComponent(absoluteUri)}"`;
                });
             }
             return line;
          }).join('\n');
          
          return res.send(rewrittenText);
       } else {
          // Just puree proxy it (like TS files)
          if (!response.body) {
             return res.status(200).send();
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader('Content-Length', buffer.length);
          return res.send(buffer);
       }
    } catch (err: any) {
       if (err.name === 'AbortError') {
         // Silently ignore aborted requests
         return;
       }
       console.error('Proxy error for url:', targetUrl, err.message);
       if (!res.headersSent) {
          if (err.message && err.message.includes('timeout')) {
             res.status(504).send('Proxy Gateway Timeout: ' + err.message);
          } else {
             res.status(502).send('Proxy Bad Gateway: ' + err.message);
          }
       }
    }
  });

  // 1. Fetch current movies
  app.get("/api/movies", async (req, res) => {
    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "50");
    const search = (req.query.search as string || "").toLowerCase();
    const tab = req.query.tab as string || "Home";

    let m3uMovies = cachedM3uMovies;
    if (Date.now() - lastM3uFetchTime > 1000 * 60 * 5) { // 5 min cache
       if (settings.m3uPlaylistUrls) {
          fetchM3uPlaylists(settings.m3uPlaylistUrls).then(data => {
             cachedM3uMovies = data;
             lastM3uFetchTime = Date.now();
          });
       }
       
       if (cachedM3uMovies.length === 0 && settings.m3uPlaylistUrls) {
          cachedM3uMovies = await fetchM3uPlaylists(settings.m3uPlaylistUrls);
          lastM3uFetchTime = Date.now();
          m3uMovies = cachedM3uMovies;
       }
    }

    let { data: mongoMovies, total: mongoTotal } = await getMongoData(page, limit, search, tab);
    
    // Convert and filter moviesData (custom added via /api/movies POST)
    let filteredCustom = moviesData.filter(m => {
       if (search && !m.title.toLowerCase().includes(search)) return false;
       if (tab === 'Movies') {
          return m.type === 'Movie' || (!m.isLive && m.type !== 'Live TV' && m.category !== 'Live TV' && m.category !== 'Web Series' && m.type !== 'Web Series');
       } else if (tab === 'OTT') {
          return m.type === 'Web Series' || m.category === 'Web Series' || m.type === 'Tv Show';
       } else if (tab === 'Live TV') {
          return m.type === 'Live TV' || m.category === 'Live TV' || m.isLive;
       }
       return true;
    });

    // Map overrides to M3U movies too
    const m3uWithOverrides = m3uMovies.map(m => {
       const override = movieOverrides[m.id];
       if (override) {
          return {
             ...m,
             title: (override.title && override.title.trim() !== '') ? override.title : m.title,
             posterUrl: (override.posterUrl && override.posterUrl.trim() !== '') ? override.posterUrl : m.posterUrl,
             category: (override.category && override.category.trim() !== '') ? override.category : m.category,
             language: override.language !== undefined ? override.language : m.language
          };
       }
       return m;
    });

    const isAdmin = req.query.admin === 'true';
    const filterStatus = req.query.filterStatus as string || 'all';

    // Filter out hidden channels and tab filter
    let visibleM3uMovies = m3uWithOverrides.filter(m => {
       const isHidden = channelStatusOverrides[m.id]?.hidden;
       if (!isAdmin && isHidden) return false;
       if (filterStatus === 'hidden' && !isHidden) return false;
       if (search && !m.title.toLowerCase().includes(search)) return false;
       if (!isAdmin && (tab === 'Movies' || tab === 'OTT')) return false; // M3U is Live TV only
       return true;
    });
    
    // For admin, we want to inject 'hidden' boolean property.
    if (isAdmin) {
       visibleM3uMovies = visibleM3uMovies.map(m => ({ ...m, hidden: !!channelStatusOverrides[m.id]?.hidden }));
    }
    
    if (filterStatus === 'hidden') {
       // If filtering by errors, we only show channels with errors (mostly M3U or Live TV)
       // Let's clear Mongo and Custom for now to just focus on M3U broken links
       mongoMovies = [];
       mongoTotal = 0;
       filteredCustom = [];
    }
    
    const combinedData = [...filteredCustom, ...mongoMovies, ...visibleM3uMovies];
    
    // Note: Since M3U runs to tens of thousands, we also need to slice it if it gets too large, 
    // but we'll trust mongo pagination plus small custom data for now.
    // If combined is huge, let's paginate the combined list natively.
    let paginated = combinedData;
    let paginatedTotal = mongoTotal + filteredCustom.length + visibleM3uMovies.length;
    
    // We already sliced Mongo, but M3U and Custom aren't sliced per page yet.
    if (limit > 0) {
        const offset = (page - 1) * limit;
        if (mongoMovies.length > 0) {
           // We are displaying paginated Mongo results. For M3U & Custom, to prevent overflow, we only add them on page 1, or offset them too.
           // Simplest: just strict slice the entire combined data.
           // Since mongoMovies is already sliced, this logic is tricky. 
           // Let's just slice the M3U and Custom, and combine.
           const m3uAndCustom = [...filteredCustom, ...visibleM3uMovies];
           const paginatedM3uAndCustom = m3uAndCustom.slice(offset, offset + limit);
           paginated = [...mongoMovies, ...paginatedM3uAndCustom].slice(0, limit);
        } else {
           paginated = combinedData.slice(offset, offset + limit);
        }
    }
    
    res.json({
        data: paginated,
        total: paginatedTotal,
        page,
        limit
    });
  });

  // 2. Fetch Settings
  app.get("/api/settings", async (req, res) => {
    let mongoStatus = "Not Configured";
    if (settings.mongoUri) {
      if (mongoClient) {
         try {
             await mongoClient.db(settings.mongoDbName).command({ ping: 1 });
             mongoStatus = "Connected";
         } catch(e) {
             mongoStatus = "Error: " + (e as Error).message;
         }
      } else if (mongoLastError) {
         mongoStatus = "Error: " + mongoLastError;
      } else {
         mongoStatus = "Attempting to Connect (Refresh...)";
      }
    }
    res.json({ ...settings, mongoStatus });
  });

  // 3. Update Settings
  app.post("/api/settings", async (req, res) => {
    console.log("Saving settings payload:", req.body);
    const { categories, baseUrl, mongoUri, mongoDbName, mongoCollection, m3uPlaylistUrls, m3uSortAZ } = req.body;
    if (categories) settings.categories = categories;
    if (typeof baseUrl === 'string') settings.baseUrl = baseUrl;
    if (typeof m3uSortAZ === 'boolean') settings.m3uSortAZ = m3uSortAZ;
    if (typeof m3uPlaylistUrls === 'string') {
       settings.m3uPlaylistUrls = m3uPlaylistUrls;
       cachedM3uMovies = [];
       lastM3uFetchTime = 0;
    }
    
    let reconnectNeeded = false;
    if (typeof mongoUri === 'string' && settings.mongoUri !== mongoUri) reconnectNeeded = true;
    
    if (typeof mongoUri === 'string') settings.mongoUri = mongoUri;
    if (typeof mongoDbName === 'string') settings.mongoDbName = mongoDbName;
    if (typeof mongoCollection === 'string') settings.mongoCollection = mongoCollection;

    if (reconnectNeeded && mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      mongoLastError = null;
    }

    if (!mongoClient && settings.mongoUri) {
      try {
        mongoClient = new MongoClient(settings.mongoUri, { serverSelectionTimeoutMS: 5000 });
        await mongoClient.connect();
        await mongoClient.db(settings.mongoDbName).command({ ping: 1 });
        mongoLastError = null;
      } catch (e) {
        console.error("MongoDB immediate connection error:", e);
        mongoClient = null;
        mongoLastError = (e as Error).message;
      }
    }

    await saveState();
    res.json({ success: true, settings });
  });

  // 4. Add a Movie (Admin Panel use)
  app.post("/api/movies", async (req, res) => {
    const movie = documentToMovie(req.body);
    moviesData.unshift(movie);
    await saveState();
    res.json({ success: true, movie });
  });

  // 5. Delete a Movie
  app.delete("/api/movies/:id", async (req, res) => {
    const { id } = req.params;
    
    // Check if it's in the local moviesData list first
    const initialLength = moviesData.length;
    moviesData = moviesData.filter(m => m.id !== id);
    let deleted = initialLength !== moviesData.length;
    
    if (deleted) {
      await saveState();
    } else {
      // It wasn't in custom movies, so it might be in MongoDB
      if (mongoClient && settings.mongoDbName && settings.mongoCollection) {
        try {
           const dbCollection = mongoClient.db(settings.mongoDbName).collection(settings.mongoCollection);
           const result = await dbCollection.deleteOne({ _id: new ObjectId(id) });
           if (result.deletedCount === 1) {
              deleted = true;
           }
        } catch (e) {
           console.error("Failed to delete from MongoDB:", e);
        }
      }
    }
    
    // Clear overrides if they exist
    if (deleted && movieOverrides[id]) {
       delete movieOverrides[id];
       await saveOverrides();
    }
    
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Movie not found" });
    }
  });

  // Edit a Movie (Metadata Override)
  app.put("/api/movies/:id", async (req, res) => {
    const { id } = req.params;
    
    // First try standard custom movies
    let changed = false;
    moviesData = moviesData.map(m => {
      if (m.id === id) {
        changed = true;
        return { ...m, ...req.body };
      }
      return m;
    });

    // If it wasn't a custom movie, it's a mongo movie edit
    if (!changed) {
      if (!movieOverrides[id]) movieOverrides[id] = {};
      const fieldsToUpdate = ['title', 'posterUrl', 'videoUrl', 'language', 'category', 'year', 'type', 'season', 'episode', 'part', 'industry', 'description', 'duration'];
      fieldsToUpdate.forEach(key => {
        if (req.body[key] !== undefined) (movieOverrides[id] as any)[key] = req.body[key];
      });
      if (req.body.genre !== undefined) {
         if (typeof req.body.genre === 'string') {
            movieOverrides[id].genre = req.body.genre.split(',').map((s: string) => s.trim());
         } else if (Array.isArray(req.body.genre)) {
            movieOverrides[id].genre = req.body.genre;
         }
      }
      console.log('Updated movie override:', id, movieOverrides[id]);
    }

    await saveState();
    res.json({ success: true });
  });

  // 6. Telegram Webhook (Simulation)
  app.post("/api/webhook/telegram", async (req, res) => {
    const { videoUrl, title, category, description, posterUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: "Missing videoUrl" });
    }
    
    const newMovie = {
      id: 'tg_' + Date.now(),
      title: title ? title.replace(/\.[^/.]+$/, "") : 'New Telegram Video',
      category: category || (settings.categories.length > 0 ? settings.categories[0] : 'Uncategorized'),
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=774&ixlib=rb-4.0.3',
      videoUrl: videoUrl,
      description: description || 'New video added from Telegram channel.',
    };

    moviesData.unshift(newMovie);
    await saveState();
    res.json({ success: true, movie: newMovie });
  });

  // 7. Report Channel Error
  app.post("/api/report-channel-error", async (req, res) => {
    const { videoId } = req.body;
    if (videoId && videoId.startsWith('m3u_')) {
      channelStatusOverrides[videoId] = { hidden: true };
      await saveState();
      console.log(`Channel ${videoId} reported as timeout/error. Hidden from home.`);
      res.json({ success: true, hidden: true });
    } else {
      res.json({ success: false });
    }
  });

  // 8. Admin Fetch All Channels (includes hidden)
  app.get("/api/admin/channels", async (req, res) => {
    let m3uMovies = cachedM3uMovies;
    if (cachedM3uMovies.length === 0 && settings.m3uPlaylistUrls) {
       cachedM3uMovies = await fetchM3uPlaylists(settings.m3uPlaylistUrls);
       lastM3uFetchTime = Date.now();
       m3uMovies = cachedM3uMovies;
    }

    const channels = m3uMovies.map(ch => {
      const override = movieOverrides[ch.id] || {};
      return {
        ...ch,
        title: (override.title && override.title.trim() !== '') ? override.title : ch.title,
        posterUrl: (override.posterUrl && override.posterUrl.trim() !== '') ? override.posterUrl : ch.posterUrl,
        category: (override.category && override.category.trim() !== '') ? override.category : ch.category,
        language: override.language !== undefined ? override.language : ch.language,
        hidden: !!channelStatusOverrides[ch.id]?.hidden
      };
    });
    res.json(channels);
  });

  // 9. Admin Update Channel Status
  app.post("/api/admin/channels/:id", async (req, res) => {
    const { hidden } = req.body;
    channelStatusOverrides[req.params.id] = { hidden };
    await saveState();
    res.json({ success: true });
  });

  // Periodic Auto-Checker for Hidden Channels
  setInterval(async () => {
    const hiddenIds = Object.keys(channelStatusOverrides).filter(id => channelStatusOverrides[id].hidden);
    if (hiddenIds.length === 0) return;
    
    console.log(`Auto-checking ${hiddenIds.length} hidden channels for recovery...`);
    for (const id of hiddenIds) {
      const channel = cachedM3uMovies.find(c => c.id === id);
      if (channel) {
        try {
          // Send a quick HEAD request to see if it responds without timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout
          const response = await fetch(channel.videoUrl, { method: 'HEAD', signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            console.log(`Channel ${id} recovered! Making it visible again.`);
            channelStatusOverrides[id] = { hidden: false };
          }
        } catch (e) {
          // Still failing
        }
      }
    }
    await saveState();
  }, 1000 * 60 * 15); // Check every 15 mins

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function documentToMovie(body: any): ServerMovie {
  return {
    id: body.id || 'm_' + Date.now(),
    title: body.title,
    category: body.category,
    posterUrl: body.posterUrl,
    videoUrl: body.videoUrl,
    isLive: Boolean(body.isLive),
    description: body.description,
    year: body.year,
    rating: body.rating,
    duration: body.duration
  };
}

startServer();
