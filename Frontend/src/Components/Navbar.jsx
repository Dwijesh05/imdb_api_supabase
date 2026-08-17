import React, { useState, useEffect } from 'react';
import { Search, Clapperboard, ChevronDown, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); 
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 1. Check for BOTH the FastAPI token and the user data
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('current_user');
    
    if (token && savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = () => {
    // 2. Clear the FastAPI token and user data on logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    setCurrentUser(null);
    setShowProfileMenu(false);
    navigate('/login');
  };

  // 3. Create fallbacks in case the user doesn't have a name/avatar saved in the new database yet
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';
  const displayAvatar = currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=facc15&color=000000&bold=true`;

  return (
    <div className='flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 text-white relative z-40'>
      <div className='relative'>
        <button 
          onClick={() => {
            setIsOpen(!isOpen);
            setShowProfileMenu(false);
          }} 
          className='flex items-center gap-2 border border-yellow-400 bg-gray-800 px-4 py-2 rounded-lg text-white cursor-pointer hover:bg-gray-700 transition-colors'
        >
          <span>Categories</span>
          <ChevronDown size={18} />
        </button>

        {isOpen && (
          <div className='absolute left-0 top-full mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-700 animate-fadeIn'>
            
            <Link 
              to="/results?q=Top%20Rated%20Telugu%20Movies&type=category" 
              onClick={() => setIsOpen(false)}
              className='p-3 text-left text-white hover:bg-gray-700 transition-colors block w-full border-b border-gray-700/60'
            >
              Top Rated Telugu Movies
            </Link>

            <Link 
              to="/results?q=Top%20Rated%20Indian%20Movies&type=category" 
              onClick={() => setIsOpen(false)}
              className='p-3 text-left text-white hover:bg-gray-700 transition-colors block w-full border-b border-gray-700/60'
            >
              Top Rated Indian Movies
            </Link>

            <Link 
              to="/results?q=Top%20Rated%20English%20Movies&type=category" 
              onClick={() => setIsOpen(false)}
              className='p-3 text-left text-white hover:bg-gray-700 transition-colors block w-full border-b border-gray-700/60'
            >
              Top Rated English Movies
            </Link>

            <Link 
              to="/results?q=Top%20Box%20Office%20(US)&type=category" 
              onClick={() => setIsOpen(false)}
              className='p-3 text-left text-white hover:bg-gray-700 transition-colors block w-full border-b border-gray-700/60'
            >
              Top Box Office (US)
            </Link>

            <Link 
              to="/results?q=Most%20Popular%20Movies&type=category" 
              onClick={() => setIsOpen(false)}
              className='p-3 text-left text-white hover:bg-gray-700 transition-colors block w-full border-b border-gray-700/60'
            >
              Most Popular Movies
            </Link>

            <Link 
              to="/results?q=Most%20Popular%20TV%20Shows&type=category" 
              onClick={() => setIsOpen(false)}
              className='p-3 text-left text-white hover:bg-gray-700 transition-colors block w-full'
            >
              Most Popular TV Shows
            </Link>

          </div>
        )}
      </div>

      <div className='flex gap-2 text-white items-center'>
        <Clapperboard size={30} className="text-yellow-400" />
        <h2 className='text-2xl font-bold'>
          <Link to='/'>
            Flick<span className='text-yellow-400'>Picker</span>
          </Link>
        </h2>
      </div>

      <div className='flex gap-4 items-center text-white'>
        <Link 
          to='/search' 
          className='p-2 rounded-full hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center'
          aria-label="Search"
        >
          <Search className='cursor-pointer' size={20} />
        </Link>

        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 bg-gray-800 border border-yellow-400/40 p-1.5 pr-3 rounded-full hover:border-yellow-400 transition-all cursor-pointer"
            >
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-yellow-400"
              />
              <span className="text-sm font-bold text-gray-200 max-w-[100px] truncate">
                {displayName}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-xs text-gray-400">Logged in as</p>
                  <p className="text-xs font-bold text-yellow-400 truncate">{currentUser.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 cursor-pointer mt-1 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/login" 
            className='bg-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-all'
          >
            Log In / Sign Up
          </Link>
        )}
      </div>

    </div>
  );
};

export default Navbar;