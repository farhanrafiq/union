import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ProfileModal from '../common/ProfileModal';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileModalOpen(true);
    setDropdownOpen(false);
  };

  return (
    <>
      <header className="flex justify-between items-center py-4 px-6 bg-surface border-b-2 border-gray-100">
        <div className="flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none lg:hidden">
              <MenuIcon />
          </button>
        </div>

        <div className="flex items-center">
          <div className="relative">
            <button onClick={() => setDropdownOpen(prev => !prev)} className="relative block h-8 w-8 rounded-full overflow-hidden shadow focus:outline-none">
              <div className="flex items-center justify-center h-full w-full bg-primary text-white font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-10">
                <div className="block px-4 py-2 text-sm text-gray-700">
                  <p className="font-bold">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <a href="#" onClick={handleProfileClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white">Profile</a>
                <a href="#" onClick={logout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white">Logout</a>
              </div>
            )}
          </div>
        </div>
      </header>
      {user && <ProfileModal user={user} isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} />}
    </>
  );
};

export default Header;