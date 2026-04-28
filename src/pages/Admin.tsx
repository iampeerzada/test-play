import { useEffect, useState, FormEvent } from 'react';
import { Movie } from '../data/movies';
import { Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Admin() {
  const [categories, setCategories] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [mongoDbName, setMongoDbName] = useState('');
  const [mongoCollection, setMongoCollection] = useState('');
  const [mongoStatus, setMongoStatus] = useState('');
  const [m3uPlaylistUrls, setM3uPlaylistUrls] = useState('');
  const [m3uSortAZ, setM3uSortAZ] = useState(false);
  
  const [movies, setMovies] = useState<any[]>([]);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Movie>>({});
  
  // New category state
  const [newCategory, setNewCategory] = useState('');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  // New movie state
  const [newMovie, setNewMovie] = useState<Partial<Movie>>({
    category: '',
    title: '',
    posterUrl: '',
    videoUrl: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      setIsLoadingMovies(true);
      const [moviesRes, settingsRes] = await Promise.all([
        fetch(`/api/movies?admin=true&page=${page}&limit=50&search=${encodeURIComponent(searchTerm)}&tab=Home`),
        fetch('/api/settings')
      ]);
      const moviesData = await moviesRes.json();
      const settingsData = await settingsRes.json();
      
      setMovies(moviesData.data || []);
      setTotal(moviesData.total || 0);
      
      setCategories(settingsData.categories || []);
      setBaseUrl(settingsData.baseUrl || '');
      setMongoUri(settingsData.mongoUri || '');
      setMongoDbName(settingsData.mongoDbName || '');
      setMongoCollection(settingsData.mongoCollection || '');
      setMongoStatus(settingsData.mongoStatus || '');
      setM3uPlaylistUrls(settingsData.m3uPlaylistUrls || '');
      setM3uSortAZ(!!settingsData.m3uSortAZ);
      if (settingsData.categories && settingsData.categories.length > 0) {
         setNewMovie(prev => ({ ...prev, category: settingsData.categories[0] }));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, baseUrl, mongoUri, mongoDbName, mongoCollection, m3uPlaylistUrls, m3uSortAZ })
      });
      alert('Settings updated successfully!');
      fetchData(); // reload movies because mongo config might have changed
    } catch (e) {
      alert('Failed to update settings');
    }
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const handleAddMovie = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovie)
      });
      if (response.ok) {
        setNewMovie({
            title: '',
            posterUrl: '',
            videoUrl: '',
            description: '',
            category: categories[0] || ''
        });
        fetchData();
        alert('Movie added successfully!');
      }
    } catch (e) {
      alert('Failed to add movie');
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (confirm('Are you sure you want to delete this movie?')) {
      try {
        await fetch(`/api/movies/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (e) {
        alert('Failed to delete movie');
      }
    }
  };

  const handleToggleChannelStatus = async (id: string, hidden: boolean) => {
    try {
      await fetch(`/api/admin/channels/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden })
      });
      fetchData();
    } catch (e) {
      alert('Failed to toggle channel status');
    }
  };

  const startEditing = (movie: Movie) => {
    setEditingMovieId(movie.id);
    setEditForm({ 
       title: movie.title || '', 
       posterUrl: movie.posterUrl || '', 
       videoUrl: movie.videoUrl || '', 
       language: movie.language || '', 
       category: movie.category || '',
       year: movie.year || '',
       type: movie.type || '',
       season: movie.season || '',
       episode: movie.episode || '',
       part: movie.part || '',
       industry: movie.industry || '',
       genre: movie.genre || [],
       description: movie.description || '',
       duration: movie.duration || ''
    });
  };

  const cancelEditing = () => {
    setEditingMovieId(null);
    setEditForm({});
  };

  const handleEditSubmit = async (id: string) => {
    try {
      await fetch(`/api/movies/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setEditingMovieId(null);
      fetchData();
    } catch (e) {
      alert('Failed to update movie');
    }
  };

  // Debounced search logic could be added here, but for now we just load when searchTerm changes.
  const filteredMovies = movies;

  return (
    <div className="min-h-screen bg-[#0f1014] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-bold">Admin Panel</h1>
           <Link to="/" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
             View Site
           </Link>
        </div>

        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-6">Global Settings</h2>
          <form onSubmit={handleUpdateSettings} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Streaming Base URL</label>
                <input 
                  type="text" 
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g. https://iptv.ifastx.in"
                />
                <p className="text-xs text-gray-400 mt-1">Base URL for formatting MongoDB streams or overriding links.</p>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">Live TV (M3U Playlists)</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={m3uSortAZ} onChange={e => setM3uSortAZ(e.target.checked)} className="rounded bg-gray-900 border-gray-700" />
                    Sort Channels A-Z
                  </label>
                </div>
                <p className="text-xs text-gray-400 mb-4">Paste M3U playlist URLs (one per line) or directly paste raw M3U/CSV text to load Live TV channels.</p>
                <textarea 
                  value={m3uPlaylistUrls}
                  onChange={e => setM3uPlaylistUrls(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500 h-24 font-mono text-sm"
                  placeholder="https://example.com/playlist.m3u&#10;Or paste raw CSV with header channel_name,group_title,url,tvg_id,tvg_logo,extinf_raw"
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">MongoDB Auto-Sync</h3>
                  {mongoStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mongoStatus === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      Status: {mongoStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-4">Provide a connection string to automatically pull stream metadata from a MongoDB collection.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">MongoDB URI (Connection String)</label>
                <input 
                  type="password" 
                  value={mongoUri}
                  onChange={e => setMongoUri(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500"
                  placeholder="mongodb+srv://<user>:<pwd>@cluster.mongodb.net/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Database Name</label>
                <input 
                  type="text" 
                  value={mongoDbName}
                  onChange={e => setMongoDbName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500"
                  placeholder="FileStream"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Collection Name</label>
                <input 
                  type="text" 
                  value={mongoCollection}
                  onChange={e => setMongoCollection(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500"
                  placeholder="file"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">Categories</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500"
                  placeholder="New Category Name"
                />
                <button type="button" onClick={handleAddCategory} className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5"/> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <span key={cat} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm">
                    {cat}
                    <button type="button" onClick={() => handleRemoveCategory(cat)} className="hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors w-full md:w-auto">
              Save Settings & Reconnect
            </button>
          </form>
        </section>

        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-6">Add Custom Movie/Stream</h2>
          <p className="text-sm text-gray-400 mb-4">If MongoDB is active, these custom streams will appear alongside the synced ones.</p>
          <form onSubmit={handleAddMovie} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                <input required type="text" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select required value={newMovie.category} onChange={e => setNewMovie({...newMovie, category: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500">
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Poster Image URL</label>
              <input required type="url" value={newMovie.posterUrl} onChange={e => setNewMovie({...newMovie, posterUrl: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Video/Stream URL</label>
              <input required type="url" value={newMovie.videoUrl} onChange={e => setNewMovie({...newMovie, videoUrl: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500 h-24" />
            </div>

            <button type="submit" className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-md font-medium transition-colors w-full md:w-auto mt-4">
              Create Content
            </button>
          </form>
        </section>

        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 overflow-hidden">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold">Library ({total}) {mongoUri && "- Auto Synced ✨"} {isLoadingMovies && <span className="text-red-500 animate-pulse text-sm ml-2">Loading...</span>}</h2>
            <input 
               type="text"
               placeholder="Search library..."
               value={searchTerm}
               onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(1);
               }}
               className="bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500 w-full md:w-64"
            />
          </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                 <tr>
                   <th className="px-6 py-3 rounded-tl-lg">Title</th>
                   <th className="px-6 py-3">Category</th>
                   <th className="px-6 py-3 rounded-tr-lg">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredMovies.map(movie => (
                   <tr key={movie.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                     <td className="px-6 py-4 font-medium text-white">
                        {editingMovieId === movie.id ? (
                          <div className="flex flex-col gap-3 min-w-[300px] md:min-w-[500px]">
                             <input 
                               className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                               value={editForm.title || ''}
                               onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                               placeholder="Title"
                             />
                             <input 
                               className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                               value={editForm.posterUrl || ''}
                               onChange={(e) => setEditForm({...editForm, posterUrl: e.target.value})}
                               placeholder="Poster URL"
                             />
                             <input 
                               className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                               value={editForm.videoUrl || ''}
                               onChange={(e) => setEditForm({...editForm, videoUrl: e.target.value})}
                               placeholder="Video/Stream URL"
                             />
                             <textarea 
                               className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full h-16"
                               value={editForm.description || ''}
                               onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                               placeholder="Description..."
                             />
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.year || ''}
                                 onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                                 placeholder="Year (e.g. 2024)"
                               />
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.type || ''}
                                 onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                                 placeholder="Type (Movie/Web Series)"
                               />
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.season || ''}
                                 onChange={(e) => setEditForm({...editForm, season: e.target.value})}
                                 placeholder="Season (e.g. S01)"
                               />
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.episode || ''}
                                 onChange={(e) => setEditForm({...editForm, episode: e.target.value})}
                                 placeholder="Episode (e.g. E02)"
                               />
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.language || ''}
                                 onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                                 placeholder="Language"
                               />
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.industry || ''}
                                 onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
                                 placeholder="Industry (e.g. Bollywood)"
                               />
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={Array.isArray(editForm.genre) ? editForm.genre.join(', ') : (editForm.genre || '')}
                                 onChange={(e) => setEditForm({...editForm, genre: e.target.value.split(',').map(g => g.trim())})}
                                 placeholder="Genre (comma sep)"
                               />
                               <input 
                                 className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                                 value={editForm.duration || ''}
                                 onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                                 placeholder="Duration"
                               />
                             </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {movie.title}
                            {movie.hidden && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 uppercase tracking-wider">Timeout / Hidden</span>}
                          </div>
                        )}
                     </td>
                     <td className="px-6 py-4 text-gray-300">
                       {editingMovieId === movie.id ? (
                         <select 
                           value={editForm.category || ''} 
                           onChange={e => setEditForm({...editForm, category: e.target.value})} 
                           className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                         >
                           <option value="" disabled>Select Category</option>
                           {categories.map(cat => (
                             <option key={cat} value={cat}>{cat}</option>
                           ))}
                         </select>
                       ) : (
                         movie.category
                       )}
                     </td>
                     <td className="px-6 py-4 text-sm flex flex-col gap-2">
                        {editingMovieId === movie.id ? (
                          <>
                            <button onClick={() => handleEditSubmit(movie.id)} className="text-green-500 hover:text-green-400 font-medium whitespace-nowrap bg-gray-800 px-3 py-1 rounded w-fit">Save</button>
                            <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-300 font-medium whitespace-nowrap bg-gray-800 px-3 py-1 rounded w-fit">Cancel</button>
                          </>
                        ) : (
                          <>
                            {movie.id.startsWith('m3u_') && (
                              <button 
                                onClick={() => handleToggleChannelStatus(movie.id, !movie.hidden)} 
                                className={`${movie.hidden ? 'text-green-500 hover:text-green-400' : 'text-yellow-500 hover:text-yellow-400'} font-medium whitespace-nowrap bg-gray-800 px-3 py-1 rounded w-fit mb-1`}
                              >
                                {movie.hidden ? 'Unhide' : 'Hide'}
                              </button>
                            )}
                            <button onClick={() => startEditing(movie)} className="text-blue-500 hover:text-blue-400 font-medium whitespace-nowrap bg-gray-800 px-3 py-1 rounded w-fit">Edit Content</button>
                            {!movie.id.startsWith('m3u_') && (
                              <button onClick={() => handleDeleteMovie(movie.id)} className="text-red-500 hover:text-red-400 font-medium whitespace-nowrap bg-gray-800 px-3 py-1 rounded w-fit">Delete Database Entry</button>
                            )}
                          </>
                        )}
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {filteredMovies.length === 0 && <p className="text-center py-8 text-gray-400">No movies found.</p>}
             
             {/* Pagination Controls */}
             <div className="bg-gray-900 p-4 border border-x-0 border-b-0 border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoadingMovies}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 transition font-medium"
                >
                  Previous
                </button>
                <div className="text-sm text-gray-400 font-medium">
                   Page {page} of {Math.max(1, Math.ceil(total / 50))}
                </div>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page * 50) >= total || isLoadingMovies}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 transition font-medium"
                >
                  Next
                </button>
             </div>
           </div>
        </section>
      </div>
    </div>
  );
}
