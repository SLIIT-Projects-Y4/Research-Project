import React from 'react';
import heroImage from '../../../public/assets/hero.jpg';
import {Button} from "@mantine/core";

const Hero = () => {
    return (
      <div className="relative h-screen w-full overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `url(${heroImage})`,
            }}
          >
              <div className="absolute inset-0 bg-black/50 bg-center bg-no-repeat"></div>
          </div>

          {/* Content Container */}
          <div className="absolute inset-0 z-10 flex items-center justify-center w-full">
              <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-8 w-full">
                  <div className="flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
                      {/* Main Heading */}
                      <h1
                        className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-center text-white">
                          Explore Sri Lanka
                          <br/>
                          <span className="text-orange-400">Your Journey, Your Way</span>
                      </h1>
                  </div>
                  <p
                    className="mb-8 sm:mb-12 md:mb-16 max-w-[390px] mx-auto text-sm sm:text-base md:text-lg lg:text-xl font-display text-center leading-relaxed text-gray-200">
                      Explore the island's hidden gems with our expert guides and tailor-made journeys.
                  </p>

                  {/* Call to Action Button */}
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      color='white'
                      className="font-display bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300 px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-medium uppercase tracking-wider"
                      variant="outline"
                    >
                        Explore More
                    </Button>
                  </div>
              </div>
          </div>


      </div>
    );
};

export default Hero;