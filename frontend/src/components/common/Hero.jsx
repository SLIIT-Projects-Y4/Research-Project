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
          <div className="relative z-10 flex h-full items-center">
              <div className="container mx-auto px-4 lg:px-8">
                  <div className="flex flex-col items-center justify-center">
                      {/* Main Heading */}
                      <h1
                        className="ml-12 mb-6 text-5xl font-bold leading-tight text-center text-white md:text-6xl lg:text-7xl">
                          Explore Sri Lanka
                          <br/>
                          <span className="text-orange-400"> Your Journey, Your Way</span>
                      </h1>
                  </div>
                  <p
                    className=" ml-[370px] mb-16 max-w-lg text-lg font-display text-center leading-relaxed text-gray-200 md:text-xl">
                      Explore the island's hidden gems with our expert guides and tailor-made journeys.
                  </p>

                  {/* Call to Action Button */}
                  <Button
                    size="lg"
                    color='white'
                    className="ml-[530px] font-display bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300 px-8 py-3 text-sm font-medium uppercase tracking-wider"
                    variant="outline"
                  >
                      Explore More
                  </Button>
              </div>
          </div>


      </div>
    );
};

export default Hero;