import React from "react";
import TravelerImage from './assets/Traveller.png';
import {CameraIcon, PlayIcon} from "lucide-react";

export const Hero = () => (
  <section className="relative pt-32 lg:pt-40 overflow-hidden">
    <div className="absolute top-0 right-0 w-2/3 md:w-1/2 h-full bg-amber-100/30 rounded-bl-full -z-10"></div>
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 grid lg:grid-cols-2 gap-12 items-center">
      <div className="text-center lg:text-left">
        <h2 className="text-lg font-bold text-red-500 uppercase mb-4 tracking-wider">Best Destinations around the world</h2>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6" style={{fontFamily: "'Volkhov', serif"}}>Travel, enjoy and live a new and full life</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto lg:mx-0">Built Wicket longer admire do barton vanity itself do in it. Preferred to sportsmen it engrossed listening. Park gate sell they west hard for the.</p>
        <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-6">
          <button className="bg-yellow-500 text-white px-8 py-4 rounded-lg shadow-lg hover:bg-yellow-600 transition-all transform hover:scale-105 w-full sm:w-auto">Find out more</button>
          <div className="flex items-center gap-4 cursor-pointer group">
            <button className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-600 transition-all transform group-hover:scale-110" aria-label="Play Demo">
            <PlayIcon />
            </button>
            <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Play Demo</span>
          </div>
        </div>
      </div>
      <div className="absolute right-10 h-[500px] w-[780px] flex items-center justify-center">
        <img src={TravelerImage} alt={'main-image'}/>
      </div>
    </div>
  </section>
);