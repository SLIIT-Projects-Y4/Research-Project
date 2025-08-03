import React, {useEffect, useState} from "react";
import {useViewportSize} from "@mantine/hooks";
import {IconChevronDown, IconMenu2} from "@tabler/icons-react";
import {PlaneTakeoff} from "lucide-react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const {width} = useViewportSize();
  const isMobile = width < 1024;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const navLinks = ["Destinations", "Hotels", "Flights", "Bookings"];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 shadow-lg backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <a href="#" className="text-3xl font-bold text-gray-800" aria-label="Jadoo homepage">
              Chaloo
            </a>
            <span><PlaneTakeoff/></span>
          </div>

          {!isMobile && (
            <div className="flex items-center space-x-8">
              {navLinks.map(link => (
                <a
                  key={link}
                  href="#"
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  {link}
                </a>
              ))}
              <a href="#" className="text-gray-600 hover:text-red-500 transition-colors">
                Login
              </a>
              <button
                className="border border-gray-800 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-all">
                Sign up
              </button>
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="text-gray-800"
            >
              <IconMenu2 size={24}/>
            </button>
          )}
        </div>
      </div>

      {isMobile && isOpen && (
        <div className="bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4 py-6">
            {navLinks.map(link => (
              <a
                key={link}
                href="#"
                className="text-gray-600 hover:text-red-500 transition-colors"
              >
                {link}
              </a>
            ))}
            <a href="#" className="text-gray-600 hover:text-red-500 transition-colors">
              Login
            </a>
            <button
              className="border border-gray-800 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-all w-3/4">
              Sign up
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};