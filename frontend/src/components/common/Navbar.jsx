import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';
import { User, LogOut, PlaneTakeoff, Menu as MenuIcon } from 'lucide-react';
import { toast } from 'react-toastify';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  // Effect to check for logged-in user on component mount and on storage change
  useEffect(() => {
    checkUser();

    // Listen for both storage events and a custom event for immediate updates
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

  // Effect to handle navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    toast.success("You have been logged out successfully!");

    // Dispatch custom event to notify other components immediately
    window.dispatchEvent(new Event("userStateChange"));
    window.dispatchEvent(new Event("storage"));

    navigate('/');
  };

  const navLinks = ["Destinations", "Hotels", "Flights", "Bookings"];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isOpen ? 'bg-white/95 shadow-lg backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-3" aria-label="Jadoo homepage">
            <span className="text-3xl font-bold text-gray-800">Jadoo</span>
            <PlaneTakeoff className="text-red-500" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link key={link} to={`/${link.toLowerCase()}`} className="text-gray-600 hover:text-red-500 transition-colors">
                {link}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                  <User size={20} className="text-gray-600" />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-red-500 transition-colors font-medium">
                  Login
                </Link>
                <Link to="/register">
                  <Button className="bg-gray-800 hover:bg-gray-900 text-white shadow-sm hover:shadow-md transition-shadow">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="text-gray-800">
              <MenuIcon size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <nav className="flex flex-col items-center space-y-4 py-6 border-t border-gray-200 bg-white/95">
          {navLinks.map(link => (
            <Link
              key={link}
              to={`/${link.toLowerCase()}`}
              className="text-gray-600 hover:text-red-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link}
            </Link>
          ))}
          {user ? (
            <>
              <div className="flex items-center gap-2 py-2">
                <User size={20} className="text-gray-600" />
                <span className="font-medium text-gray-700">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-red-500 font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-600 hover:text-red-500 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link to="/register" className="w-3/4" onClick={() => setIsOpen(false)}>
                <Button fullWidth className="bg-gray-800 hover:bg-gray-900 text-white">
                    Sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};