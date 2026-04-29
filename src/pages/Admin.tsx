import { useEffect, useState, FormEvent } from 'react';
import { Movie } from '../data/movies';
import { Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { buildApiUrl } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

export function Admin() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [mongoDbName, setMongoDbName] = useState('');
  const [mongoCollection, setMongoCollection] = useState('');
  const [mongoStatus, setMongoStatus] = useState('');
  const [m3uPlaylistUrls, setM3uPlaylistUrls] = useState('');
  const [m3uSortAZ, setM3uSortAZ] = useState(false);
  const [hiddenIndustries, setHiddenIndustries] = useState<string[]>([]);
  const [nativeBackendUrl, setNativeBackendUrl] = useState(() => localStorage.getItem('native_backend_url') || 'https://ais-pre-czsxixhjbz5ued4kd2yx4i-219951265601.asia-southeast1.run.app');
  
  const [movies, setMovies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'customers' | 'plans' | 'revenue'>('customers');
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Movie>>({});
  
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  
  // New category state
  const [newCategory, setNewCategory] = useState('');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'hidden'>('all');

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
      const suffix = user?.role === 'reseller' ? `?resellerId=${user.id}` : '';
      
      const [moviesRes, settingsRes, usersRes, plansRes, txnsRes] = await Promise.all([
        fetch(buildApiUrl(`/api/movies?admin=true&page=${page}&limit=50&search=${encodeURIComponent(searchTerm)}&tab=Home&filterStatus=${filterStatus}`)),
        fetch(buildApiUrl('/api/settings')),
        fetch(buildApiUrl(`/api/admin/users${suffix}`)),
        fetch(buildApiUrl(`/api/plans${suffix}`)),
        fetch(buildApiUrl(`/api/admin/transactions${suffix}`))
      ]);
      const moviesData = await moviesRes.json();
      const settingsData = await settingsRes.json();
      const usersData = await usersRes.json();
      const plansData = await plansRes.json();
      const txnsData = await txnsRes.json();
      
      setMovies(moviesData.data || []);
      setTotal(moviesData.total || 0);
      if (usersData.success) setCustomers(usersData.users || []);
      if (plansData.success) setPlans(plansData.plans || []);
      if (txnsData.success) setTransactions(txnsData.transactions || []);
      
      setCategories(settingsData.categories || []);
      setBaseUrl(settingsData.baseUrl || '');
      setMongoUri(settingsData.mongoUri || '');
      setMongoDbName(settingsData.mongoDbName || '');
      setMongoCollection(settingsData.mongoCollection || '');
      setMongoStatus(settingsData.mongoStatus || '');
      setM3uPlaylistUrls(settingsData.m3uPlaylistUrls || '');
      setM3uSortAZ(!!settingsData.m3uSortAZ);
      setHiddenIndustries(settingsData.hiddenIndustries || []);
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
  }, [page, searchTerm, filterStatus]);

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch(buildApiUrl('/api/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, baseUrl, mongoUri, mongoDbName, mongoCollection, m3uPlaylistUrls, m3uSortAZ, hiddenIndustries })
      });
      alert('Settings updated successfully!');
      fetchData(); // reload movies because mongo config might have changed
    } catch (e) {
      alert('Failed to update settings');
    }
  };

  const handleToggleIndustryHidden = (industry: string) => {
     let updated = [...hiddenIndustries];
     if (updated.includes(industry)) {
        updated = updated.filter(i => i !== industry);
     } else {
        updated.push(industry);
     }
     setHiddenIndustries(updated);
     // Immediately save settings to backend
     fetch(buildApiUrl('/api/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, baseUrl, mongoUri, mongoDbName, mongoCollection, m3uPlaylistUrls, m3uSortAZ, hiddenIndustries: updated })
      }).then(() => fetchData());
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
      const response = await fetch(buildApiUrl('/api/movies'), {
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
        await fetch(buildApiUrl(`/api/movies/${id}`), { method: 'DELETE' });
        fetchData();
      } catch (e) {
        alert('Failed to delete movie');
      }
    }
  };

  const handleToggleChannelStatus = async (id: string, hidden: boolean) => {
    try {
      await fetch(buildApiUrl(`/api/admin/channels/${id}`), {
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
      await fetch(buildApiUrl(`/api/movies/${id}`), { 
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
    <div className="min-h-screen bg-[#0f1014] text-white p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-bold">Admin Panel</h1>
           <Link to="/" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
             View Site
           </Link>
        </div>

        <div className="flex gap-4 border-b border-gray-700 pb-2 overflow-x-auto no-scrollbar">
           {user?.role === 'admin' && (
             <button onClick={() => setActiveTab('content')} className={`font-bold px-4 py-2 whitespace-nowrap ${activeTab === 'content' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}>Content & Settings</button>
           )}
           <button onClick={() => setActiveTab('customers')} className={`font-bold px-4 py-2 whitespace-nowrap ${activeTab === 'customers' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}>Customers</button>
           <button onClick={() => setActiveTab('plans')} className={`font-bold px-4 py-2 whitespace-nowrap ${activeTab === 'plans' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}>Plans</button>
           <button onClick={() => setActiveTab('revenue')} className={`font-bold px-4 py-2 whitespace-nowrap ${activeTab === 'revenue' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}>Revenue Overview</button>
        </div>

        {activeTab === 'customers' ? (
           <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Registered Customers</h2>
                <div>
                   <button onClick={() => setEditingCustomer({ role: 'customer' })} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-bold text-sm">Add Customer</button>
                   {user?.role === 'admin' && (
                      <button onClick={() => setEditingCustomer({ role: 'reseller' })} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-bold text-sm ml-2">Add Reseller</button>
                   )}
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-gray-700 text-sm text-gray-400">
                         <th className="p-3">Name</th>
                         <th className="p-3">Phone</th>
                         <th className="p-3">Role / Reseller</th>
                         <th className="p-3">Subscription End</th>
                         <th className="p-3">Joined Date</th>
                         <th className="p-3">Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      {customers.map(c => (
                         <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="p-3 font-medium">
                               {c.name}
                               {c.networkName && <div className="text-xs text-blue-400">{c.networkName} ({c.city})</div>}
                            </td>
                            <td className="p-3">{c.phone}</td>
                            <td className="p-3 text-sm capitalize">{c.role} {c.resellerId ? `(${c.resellerId})` : ''}</td>
                            <td className="p-3">
                               {c.subscriptionEnd ? new Date(c.subscriptionEnd).toLocaleDateString() : 'Inactive'}
                            </td>
                            <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                               <button onClick={() => setEditingCustomer(c)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">Edit</button>
                            </td>
                         </tr>
                      ))}
                      {customers.length === 0 && (
                         <tr><td colSpan={6} className="p-4 text-center text-gray-400">No customers found.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
           </section>
        ) : activeTab === 'plans' ? (
           <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Subscription Plans</h2>
                <button onClick={() => setEditingPlan({})} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-bold text-sm">Add Plan</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {plans.map(p => (
                  <div key={p.id} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                     <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                     <div className="text-3xl font-bold text-red-500 mb-2">₹{p.price}</div>
                     <p className="text-gray-400 mb-2">{p.durationDays} Days</p>
                     {p.description && <p className="text-sm text-gray-400 mb-4 whitespace-pre-wrap">{p.description}</p>}
                     {p.deviceBind && <div className="text-xs bg-red-900/50 text-red-400 w-fit px-2 py-1 mb-4 rounded font-medium">Device Locked Support</div>}
                     <button onClick={() => setEditingPlan(p)} className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded w-full mt-2">Edit Plan</button>
                  </div>
               ))}
               {plans.length === 0 && <div className="text-gray-400 col-span-3">No plans created yet.</div>}
             </div>
           </section>
        ) : activeTab === 'revenue' ? (
           <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <h2 className="text-xl font-bold mb-6">Revenue Overview</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                 <h3 className="text-gray-400 font-medium mb-2">{user?.role === 'admin' ? 'Total Platform Revenue' : 'Total Revenue'}</h3>
                 <div className="text-3xl font-bold text-green-500">₹{transactions.filter(t => t.status === 'success').reduce((acc, t) => acc + t.amount, 0)}</div>
               </div>
               {user?.role === 'admin' && (
                 <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                   <h3 className="text-gray-400 font-medium mb-2">Direct Revenue (No Reseller)</h3>
                   <div className="text-3xl font-bold text-blue-500">₹{transactions.filter(t => t.status === 'success' && !t.resellerId).reduce((acc, t) => acc + t.amount, 0)}</div>
                 </div>
               )}
               <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                 <h3 className="text-gray-400 font-medium mb-2">Total Transactions</h3>
                 <div className="text-3xl font-bold">{transactions.filter(t => t.status === 'success').length}</div>
               </div>
             </div>
             
             <h3 className="text-lg font-bold mb-4">Transaction History</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-gray-700 text-sm text-gray-400">
                         <th className="p-3">Order ID</th>
                         <th className="p-3">Date</th>
                         {user?.role === 'admin' && <th className="p-3">Reseller</th>}
                         <th className="p-3">Amount</th>
                         <th className="p-3">Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {transactions.slice().reverse().map(t => (
                         <tr key={t.id} className="border-b border-gray-700/50">
                            <td className="p-3 font-mono text-xs">{t.razorpay_order_id || t.id}</td>
                            <td className="p-3">{new Date(t.date).toLocaleString()}</td>
                            {user?.role === 'admin' && (
                               <td className="p-3">{t.resellerId ? <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-1 rounded">{t.resellerId}</span> : <span className="text-gray-500 italic">Direct</span>}</td>
                            )}
                            <td className="p-3 font-medium text-green-400">₹{t.amount}</td>
                            <td className="p-3">
                               <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'success' ? 'bg-green-900/50 text-green-500' : 'bg-red-900/50 text-red-500'}`}>{t.status.toUpperCase()}</span>
                            </td>
                         </tr>
                      ))}
                      {transactions.length === 0 && (
                         <tr><td colSpan={user?.role === 'admin' ? 5 : 4} className="p-4 text-center text-gray-400">No transactions recorded.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
           </section>
        ) : (
        <>
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-6">Global Settings</h2>
          
          {Capacitor.isNativePlatform() && (
             <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">Mobile App Backend Server</h3>
                <p className="text-sm text-gray-300 mb-4">
                  When running as a native Android app, you must specify the exact URL where your AI Studio or local server is hosted. 
                  <strong> To use the app globally, you MUST use a public URL (like the default AI Studio URL or a VPS Public IP), NOT a 192.168.x.x local IP address!</strong>
                </p>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={nativeBackendUrl}
                     onChange={e => setNativeBackendUrl(e.target.value)}
                     className={`flex-1 bg-gray-900 border ${nativeBackendUrl.includes('192.168.') ? 'border-amber-500' : 'border-gray-700'} rounded-md py-2 px-4 text-white focus:outline-none focus:border-blue-500`}
                     placeholder="https://ais-pre-...run.app"
                   />
                   <button 
                     type="button" 
                     onClick={() => {
                        if (nativeBackendUrl.includes('192.168.') || nativeBackendUrl.includes('localhost') || nativeBackendUrl.includes('127.0.0.1')) {
                           if (!confirm("WARNING: You entered a LOCAL IP address. Your app will NOT work globally over mobile data or on other Wi-Fi networks. It will only work inside your home. Are you sure you want to save this? If you want it to work globally, use the AI Studio URL or your VPS Public IP.")) {
                              return;
                           }
                        }
                        localStorage.setItem('native_backend_url', nativeBackendUrl);
                        alert('Backend URL saved! The app should reload to connect.');
                        window.location.reload();
                     }}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                   >
                     Save & Restart
                   </button>
                </div>
                {nativeBackendUrl.includes('192.168.') && (
                   <p className="text-amber-400 text-xs mt-2 font-bold">⚠️ Warning: 192.168.x.x is a local network IP. It will not work over mobile data!</p>
                )}
             </div>
          )}
          
          <form onSubmit={handleUpdateSettings} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 border-b border-gray-700 pb-6 mb-4">
                 <div className="bg-red-900/40 border border-red-500/50 rounded p-4 mb-4">
                   <p className="text-red-300 text-sm font-medium">Notice: Core streaming configuration (MongoDB URI, Database, Collection, and Base Application URL) has been hardcoded securely on the server side to protect secrets in public deployments. These cannot be modified here.</p>
                 </div>
                 
                 <div className="flex items-center justify-between mb-2 mt-4">
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

            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">Industry Visibility</label>
              <p className="text-xs text-gray-500 mb-3">Click on an industry or category to toggle its visibility in the app.</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(movies.map(m => m.industry || m.category).filter(Boolean) as string[])).sort().map(ind => (
                   <button 
                      key={ind} 
                      type="button"
                      onClick={() => handleToggleIndustryHidden(ind)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${hiddenIndustries.includes(ind) ? 'bg-red-900/50 text-red-500 border border-red-900' : 'bg-green-900/50 text-green-400 border border-green-900'}`}
                   >
                     {ind} ({hiddenIndustries.includes(ind) ? 'Hidden' : 'Visible'})
                   </button>
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
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={e => {
                  setFilterStatus(e.target.value as 'all' | 'hidden');
                  setPage(1);
                }}
                className="bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:border-red-500 w-full md:w-auto"
              >
                <option value="all">All Content</option>
                <option value="hidden">Broadcast Errors (Hidden)</option>
              </select>
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
                              <button 
                                onClick={() => handleToggleChannelStatus(movie.id, !movie.hidden)} 
                                className={`${movie.hidden ? 'text-green-500 hover:text-green-400' : 'text-yellow-500 hover:text-yellow-400'} font-medium whitespace-nowrap bg-gray-800 px-3 py-1 rounded w-fit mb-1`}
                              >
                                {movie.hidden ? 'Unhide' : 'Hide'}
                              </button>
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
        </>
        )}
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
             <h2 className="text-xl font-bold mb-4">{editingCustomer.id ? 'Edit User' : 'Add User'}</h2>
             <form onSubmit={(e) => {
               e.preventDefault();
               const form = e.currentTarget;
               const data = {
                 id: editingCustomer.id,
                 name: (form.elements.namedItem('name') as HTMLInputElement).value,
                 phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
                 password: (form.elements.namedItem('password') as HTMLInputElement).value,
                 role: (form.elements.namedItem('role') as HTMLSelectElement).value,
                 networkName: (form.elements.namedItem('networkName') as HTMLInputElement).value,
                 city: (form.elements.namedItem('city') as HTMLInputElement).value,
                 subscriptionEnd: (form.elements.namedItem('subscriptionEnd') as HTMLInputElement).value ? new Date((form.elements.namedItem('subscriptionEnd') as HTMLInputElement).value).getTime() : undefined,
                 resellerId: user?.role === 'reseller' ? user.id : undefined
               };
               fetch(buildApiUrl('/api/admin/users'), {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(data)
               }).then(() => {
                 setEditingCustomer(null);
                 fetchData();
               });
             }} className="space-y-4 text-sm">
               <div>
                  <label className="block text-gray-400 mb-1">Name</label>
                  <input name="name" defaultValue={editingCustomer.name} required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
               </div>
               <div>
                  <label className="block text-gray-400 mb-1">Phone</label>
                  <input name="phone" defaultValue={editingCustomer.phone} required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
               </div>
               <div>
                  <label className="block text-gray-400 mb-1">Password {editingCustomer.id && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}</label>
                  <input name="password" type="password" required={!editingCustomer.id} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
               </div>
               {user?.role === 'admin' && (
                 <div>
                    <label className="block text-gray-400 mb-1">Role</label>
                    <select name="role" defaultValue={editingCustomer.role || 'customer'} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                      <option value="customer">Customer</option>
                      <option value="reseller">Reseller</option>
                      <option value="admin">Admin</option>
                    </select>
                 </div>
               )}
               <div className="pt-2 border-t border-gray-700 hidden" id="resellerInfo">
                 <div>
                    <label className="block text-gray-400 mb-1">Network Name (ISP)</label>
                    <input name="networkName" defaultValue={editingCustomer.networkName} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                 </div>
                 <div className="mt-4">
                    <label className="block text-gray-400 mb-1">City</label>
                    <input name="city" defaultValue={editingCustomer.city} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                 </div>
               </div>

               {/* Make reseller fields visible if role is reseller */}
               <script dangerouslySetInnerHTML={{__html: `
                 setTimeout(() => {
                    const roleSelect = document.querySelector('select[name="role"]');
                    const info = document.getElementById('resellerInfo');
                    if (roleSelect && info && '${editingCustomer.role}' === 'reseller') {
                       info.classList.remove('hidden');
                    }
                    if (roleSelect && info) {
                       roleSelect.addEventListener('change', (e) => {
                          if (e.target.value === 'reseller') info.classList.remove('hidden');
                          else info.classList.add('hidden');
                       });
                    }
                 }, 0);
               `}} />

               <div>
                 <label className="block text-gray-400 mb-1">Subscription End Date</label>
                 <input name="subscriptionEnd" type="date" defaultValue={editingCustomer.subscriptionEnd ? new Date(editingCustomer.subscriptionEnd).toISOString().split('T')[0] : ''} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                 <div className="text-xs text-gray-500 mt-1">Leave empty to remove access. To assign a plan/free trial, update the date here manually.</div>
               </div>

               <div className="flex gap-2 justify-end pt-4">
                 <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
             <h2 className="text-xl font-bold mb-4">{editingPlan.id ? 'Edit Plan' : 'Add Plan'}</h2>
             <form onSubmit={(e) => {
               e.preventDefault();
               const form = e.currentTarget;
               const data = {
                 id: editingPlan.id,
                 name: (form.elements.namedItem('name') as HTMLInputElement).value,
                 description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
                 price: parseInt((form.elements.namedItem('price') as HTMLInputElement).value),
                 durationDays: parseInt((form.elements.namedItem('durationDays') as HTMLInputElement).value),
                 deviceBind: (form.elements.namedItem('deviceBind') as HTMLInputElement).checked,
                 resellerId: user?.role === 'reseller' ? user.id : undefined
               };
               fetch(buildApiUrl('/api/admin/plans'), {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(data)
               }).then(() => {
                 setEditingPlan(null);
                 fetchData();
               });
             }} className="space-y-4 text-sm">
               <div>
                  <label className="block text-gray-400 mb-1">Plan Name</label>
                  <input name="name" defaultValue={editingPlan.name} required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
               </div>
               <div>
                  <label className="block text-gray-400 mb-1">Description (Optional)</label>
                  <textarea name="description" defaultValue={editingPlan.description} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" rows={3}></textarea>
               </div>
               <div>
                  <label className="block text-gray-400 mb-1">Price (₹)</label>
                  <input name="price" type="number" defaultValue={editingPlan.price} required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
               </div>
               <div>
                  <label className="block text-gray-400 mb-1">Duration (Days)</label>
                  <input name="durationDays" type="number" defaultValue={editingPlan.durationDays} required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
               </div>
               <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                  <input type="checkbox" name="deviceBind" id="deviceBind" defaultChecked={editingPlan.deviceBind} className="w-4 h-4" />
                  <label htmlFor="deviceBind" className="text-gray-300">Enable Device Locking (MAC/UUID binding)</label>
               </div>

               <div className="flex gap-2 justify-end pt-4">
                 <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
