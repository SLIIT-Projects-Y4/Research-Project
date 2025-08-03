import React from 'react';
import {Hero} from "../components/features/user-land/Hero.jsx";
import {Services} from "../components/features/user-land/Services.jsx";
import {Destinations} from "../components/features/user-land/Destinations.jsx";
import {Booking} from "../components/features/user-land/Booking.jsx";
import {Partners} from "../components/features/user-land/Partners.jsx";
import {Testimonials} from "../components/features/user-land/Testimonials.jsx";
import {ScrollToTop} from "../components/features/user-land/ScrollToTop.jsx";


export const LandingPage = () => {

  return (
    <div className="font-sans bg-gray-50 relative">
      <main>
        <Hero/>
        <Services/>
        <Destinations/>
        <Booking/>
        <Testimonials/>
        <Partners/>
      </main>
      <ScrollToTop/>
    </div>
  );
};

