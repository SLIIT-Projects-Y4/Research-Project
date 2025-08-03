import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`
          group relative w-14 h-14 bg-gradient-to-r from-purple-600 to-orange-600 
          text-white rounded-full shadow-lg hover:shadow-xl
          transform transition-all duration-300 ease-in-out
          hover:scale-110 hover:-translate-y-1
          focus:outline-none focus:ring-4 focus:ring-purple-500/30
          ${isVisible 
            ? 'translate-y-0 opacity-100 pointer-events-auto' 
            : 'translate-y-16 opacity-0 pointer-events-none'
          }
        `}
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        {/* Button content */}
        <div className="relative flex items-center justify-center w-full h-full">
          <ArrowUp
            className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-200"
          />
        </div>

        {/* Ripple effect on hover */}
        <div className="absolute inset-0 rounded-full bg-white/20 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
      </button>
    </div>
  );
};