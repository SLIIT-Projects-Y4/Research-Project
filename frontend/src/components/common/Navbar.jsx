import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import {Button} from '@mantine/core';
import {User, LogOut, PlaneTakeoff, Menu as MenuIcon, X, ChevronDown, MapPin, Calendar, Heart} from 'lucide-react';
import {toast} from 'react-toastify';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const profileRef = useRef(null);

    const isHomePage = location.pathname === '/' || location.pathname === '/home';

    const checkUser = () => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error("Failed to parse user from localStorage", error);
                localStorage.clear();
                setUser(null);
            }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        checkUser();

        const handleStorageChange = () => {
            checkUser();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userStateChange', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userStateChange', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setIsProfileOpen(false);
        toast.success("Safe travels! You've been logged out successfully!");

        window.dispatchEvent(new Event("userStateChange"));
        window.dispatchEvent(new Event("storage"));

        navigate('/');
    };

    const navLinks = [
        {name: "Home", path: "/home"},
        {name: "Plan Pool", path: "/plan-pool"},
        {name: "Generate Plan", path: "/plan/build"},
        {name: "Flights", path: "/flights"},
        {name: "My Trips", path: "/bookings"}
    ];

    return (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ease-out ${
        isScrolled
          ? 'bg-white backdrop-blur-xl shadow-2xl shadow-black/5'
          : isHomePage
            ? 'bg-transparent'
            : 'bg-desert-lilly/40'
      }`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <div className="flex justify-between items-center py-4 lg:py-5">

                  {/* Logo */}
                  <Link
                    to="/"
                    className="flex items-center space-x-3 group"
                    aria-label=" TravelMachan homepage"
                  >
                      <div className="flex flex-row">
                    <span className={`text-2xl font-display font-bold transition-all duration-300 ${
                      isHomePage && isScrolled ? 'text-fly-by-night' :
                        isHomePage ? 'text-white' : 'text-fly-by-night'
                    }`}>
                        <div className={'flex items-center'}>
                            <PlaneTakeoff/>
                            <span className={`ml-3`}>Travel</span>
                            <span className={`ml-1 font-display transition-all duration-300 font-bold ${
                              isHomePage && isScrolled ? 'text-brave-orange' :
                                isHomePage ? 'text-white' : 'text-brave-orange'
                            }`}> මචo </span>
                        </div>
                      </span>
                      </div>
                  </Link>

                  {/* Desktop Navigation */}
                  <nav className="hidden lg:flex items-center">
                      <div className="flex items-center space-x-8 mr-8">
                          {navLinks.map((link) => {
                              const isActive = location.pathname === link.path;

                              return (
                                <Link
                                  key={link.name}
                                  to={link.path}
                                  className={`font-display relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${
                                    isActive
                                      ? 'text-brave-orange'
                                      : isHomePage
                                        ? isScrolled
                                          ? 'text-gray-600 hover:text-fly-by-night'
                                          : 'text-white/90 hover:text-white'
                                        : 'text-gray-600 hover:text-fly-by-night'
                                  }`}
                                >
                                    {link.name}
                                    <span
                                      className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 transition-all duration-300 group-hover:w-3/4 rounded-full ${
                                        isActive
                                          ? 'bg-brave-orange'
                                          : isHomePage && !isScrolled
                                            ? 'bg-white'
                                            : 'bg-gradient-to-r from-brave-orange to-hot-embers'
                                      }`}></span>
                                </Link>
                              );
                          })}
                      </div>

                      {/* Auth Section */}
                      {user ? (
                        <div className="relative border border-welded-iron/40 rounded-xl hover:cursor-pointer"
                             ref={profileRef}>
                            <button
                              onClick={() => setIsProfileOpen(!isProfileOpen)}
                              className={`flex items-center space-x-3 px-4 py-1.5 rounded-lg transition-all duration-300 group ${
                                isHomePage
                                  ? isScrolled
                                    ? 'text-gray-700 hover:cursor-pointer'
                                    : 'hover:bg-white/10 text-white'
                                  : 'text-gray-700 hover:cursor-pointer'
                              } ${isProfileOpen ? (isScrolled || !isHomePage ? 'bg-gray-50' : 'bg-white/10') : ''}`}
                            >
                                <div
                                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                    <User size={16} className=""/>
                                </div>

                                <ChevronDown
                                  size={16}
                                  className={`transition-transform duration-300 ${
                                    isProfileOpen ? 'rotate-180' : ''
                                  }`}
                                />
                            </button>

                            {/* Profile Dropdown */}
                            <div
                              className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden transition-all duration-300 ${
                                isProfileOpen
                                  ? 'opacity-100 translate-y-0 scale-100'
                                  : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                              }`}>
                                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
                                    <div className="flex items-center space-x-3">
                                        <div
                                          className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg">
                                            <User size={20} className="text-white"/>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {user.name || 'Traveler'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <Link
                                      to="/profile"
                                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                      onClick={() => setIsProfileOpen(false)}
                                    >
                                        <User size={16}/>
                                        <span className="text-sm font-medium">My Profile</span>
                                    </Link>
                                    <Link
                                      to="/bookings"
                                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                      onClick={() => setIsProfileOpen(false)}
                                    >
                                        <Calendar size={16}/>
                                        <span className="text-sm font-medium">My Bookings</span>
                                    </Link>
                                    <Link
                                      to="/wishlist"
                                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                      onClick={() => setIsProfileOpen(false)}
                                    >
                                        <Heart size={16}/>
                                        <span className="text-sm font-medium">Wishlist</span>
                                    </Link>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                      onClick={handleLogout}
                                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    >
                                        <LogOut size={16}/>
                                        <span className="text-sm font-medium">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                            <Link
                              to="/login"
                              className={`px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                                isHomePage
                                  ? isScrolled
                                    ? 'text-gray-600 hover:text-gray-900'
                                    : 'text-white/90 hover:text-white'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                                Sign In
                            </Link>
                            <Link to="/register">
                                <Button
                                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
                                >
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                      )}
                  </nav>

                  {/* Mobile Menu Button */}
                  <div className="lg:hidden">
                      <button
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                        className={`p-2.5 rounded-lg transition-all duration-300 ${
                          isHomePage
                            ? isScrolled
                              ? 'text-gray-800 hover:bg-gray-100'
                              : 'text-white hover:bg-white/10'
                            : 'text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                          <div className="relative w-6 h-6">
                              <MenuIcon
                                size={24}
                                className={`absolute inset-0 transition-all duration-300 ${
                                  isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                                }`}
                              />
                              <X
                                size={24}
                                className={`absolute inset-0 transition-all duration-300 ${
                                  isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                                }`}
                              />
                          </div>
                      </button>
                  </div>
              </div>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
              <nav className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl">
                  <div className="container mx-auto px-4 py-6">
                      <div className="flex flex-col space-y-1 mb-6">
                          {navLinks.map((link, index) => {
                              const isActive = location.pathname === link.path;

                              return (
                                <Link
                                  key={link.name}
                                  to={link.path}
                                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-medium ${
                                    isActive
                                      ? 'text-brave-orange bg-orange-50'
                                      : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                                  }`}
                                  style={{animationDelay: `${index * 50}ms`}}
                                  onClick={() => setIsOpen(false)}
                                >
                                    <MapPin size={18} className="opacity-60"/>
                                    <span>{link.name}</span>
                                </Link>
                              );
                          })}
                      </div>

                      {/* Mobile Auth Section */}
                      <div className="border-t border-gray-200 pt-6">
                          {user ? (
                            <div className="space-y-3">
                                <div
                                  className="flex items-center gap-4 px-4 py-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                                    <div
                                      className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg">
                                        <User size={20} className="text-white"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {user.name || 'Traveler'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Link
                                      to="/profile"
                                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                      onClick={() => setIsOpen(false)}
                                    >
                                        <User size={18}/>
                                        <span className="font-medium">My Profile</span>
                                    </Link>
                                    <Link
                                      to="/bookings"
                                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                      onClick={() => setIsOpen(false)}
                                    >
                                        <Calendar size={18}/>
                                        <span className="font-medium">My Bookings</span>
                                    </Link>
                                </div>

                                <button
                                  onClick={() => {
                                      handleLogout();
                                      setIsOpen(false);
                                  }}
                                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-300 font-medium"
                                >
                                    <LogOut size={18}/>
                                    Sign Out
                                </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                                <Link
                                  to="/login"
                                  className="block w-full px-4 py-3.5 text-center text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                  to="/register"
                                  className="block w-full"
                                  onClick={() => setIsOpen(false)}
                                >
                                    <Button
                                      fullWidth
                                      className="py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium shadow-lg border-0"
                                    >
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                          )}
                      </div>
                  </div>
              </nav>
          </div>
      </header>
    );
};
