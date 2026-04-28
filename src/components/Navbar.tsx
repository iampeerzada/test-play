import { Tv, Search, Bell, Menu, Settings, PlaySquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearch: (q: string) => void;
  onCustomStream?: () => void;
}

export function Navbar({ activeTab, onTabChange, onSearch, onCustomStream }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = ['Home', 'Movies', 'OTT', 'Live TV'];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-[#0f1014] shadow-lg' : 'bg-transparent bg-gradient-to-b from-[#0f1014]/80 to-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-4">
        {/* Left section: Logo and Links */}
        <div className="flex items-center gap-8">
          <Link to="/" onClick={() => onTabChange('Home')} className="flex items-center gap-2 cursor-pointer tv-focus" tabIndex={0}>
            <Tv className="w-8 h-8 text-white transition-colors" />
            <span className="text-xl md:text-2xl font-bold text-white tracking-wide">
              iFastX <span className="text-red-500">IPTV</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            {tabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => onTabChange(tab)}
                className={`hover:text-white transition-colors tv-focus rounded px-2 py-1 whitespace-nowrap ${
                  activeTab === tab ? 'text-white font-bold' : ''
                }`} 
                tabIndex={0}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Right section: Icons */}
        <div className="flex items-center gap-4 text-gray-300">
          {showSearch ? (
            <div className="flex items-center bg-gray-900 rounded border border-gray-700 px-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onBlur={(e) => {
                  if (!e.target.value && !searchQuery) {
                    setShowSearch(false);
                  }
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
                className="bg-transparent border-none text-sm text-white px-2 py-1 focus:outline-none w-32 md:w-48"
              />
            </div>
          ) : (
            <Search 
              className="w-5 h-5 cursor-pointer hover:text-white transition-colors tv-focus rounded" 
              tabIndex={0} 
              onClick={() => setShowSearch(true)}
              title="Search"
            />
          )}
          {onCustomStream && (
            <PlaySquare 
               className="w-5 h-5 cursor-pointer hover:text-white transition-colors tv-focus rounded" 
               tabIndex={0}
               onClick={onCustomStream}
               title="Play Custom Stream URL"
            />
          )}
          <Bell className="w-5 h-5 cursor-pointer hover:text-white transition-colors tv-focus rounded hidden sm:block" tabIndex={0} />
          <Link to="/admin" className="w-8 h-8 rounded-md bg-gradient-to-br from-red-500 to-red-600 tv-focus cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity" tabIndex={0} title="Admin Panel">
             <Settings className="w-4 h-4 text-white" />
          </Link>
          <Menu className="w-6 h-6 md:hidden cursor-pointer hover:text-white transition-colors tv-focus rounded" tabIndex={0} />
        </div>
      </div>
    </nav>
  );
}
