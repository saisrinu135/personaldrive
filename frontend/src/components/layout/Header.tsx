'use client';

import React, { useState } from 'react';
import { Search, Bell, Settings, User, LogOut, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { ProviderIcon } from '@/components/ui/ProviderIcon';

interface Provider {
  id: string;
  name: string;
  provider_type: string;
}

interface HeaderProps {
  onSearch?: (query: string) => void;
  onAddProvider?: () => void;
  onProviderSelect?: (providerId: string) => void;
  currentUser?: {
    name: string;
    email: string;
  };
  selectedProvider?: Provider;
  providers?: Provider[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onAddProvider,
  onProviderSelect,
  currentUser,
  selectedProvider,
  providers = [],
  searchQuery = '',
  onSearchChange
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const { logout } = useAuth();

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowProviderMenu(false);
    };
    
    if (showUserMenu || showProviderMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu, showProviderMenu]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(localSearchQuery);
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Left side - Provider info and search */}
      <div className="flex items-center space-x-4 flex-1">
        {selectedProvider && (
          <div className="relative">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowProviderMenu(!showProviderMenu);
              }}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ProviderIcon type={selectedProvider.provider_type} size="sm" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedProvider.name}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
            
            {showProviderMenu && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50"
              >
                <div className="py-1 max-h-64 overflow-y-auto">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        onProviderSelect?.(provider.id);
                        setShowProviderMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                        selectedProvider.id === provider.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <ProviderIcon type={provider.provider_type} size="sm" />
                      <div className="flex-1">
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {provider.provider_type}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  
                  <button
                    onClick={() => {
                      onAddProvider?.();
                      setShowProviderMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Storage Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right side - Actions and user menu */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddProvider}
          className="hidden sm:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Storage Account
        </Button>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
              {currentUser?.name || 'User'}
            </span>
          </Button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser?.email}
                  </p>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;