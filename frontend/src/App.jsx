import React from 'react';
import {Navbar} from "./components/common/Navbar.jsx";
import {Hero} from "./components/features/user-land/Hero.jsx";
import {Services} from "./components/features/user-land/Services.jsx";
import {Destinations} from "./components/features/user-land/Destinations.jsx";
import {Booking} from "./components/features/user-land/Booking.jsx";
import {Testimonials} from "./components/features/user-land/Testimonials.jsx";
import {Partners} from "./components/features/user-land/Partners.jsx";
import {Footer} from "./components/common/Footer.jsx";
import {ScrollToTop} from "./components/features/user-land/ScrollToTop.jsx";

const App = () => {
  return (
    <div className="font-sans bg-gray-50 relative">
      <Navbar/>
      <main>
        <Hero/>
        <Services/>
        <Destinations/>
        <Booking/>
        <Testimonials/>
        <Partners/>
      </main>
      <Footer/>
      <ScrollToTop/>
    </div>
  );
};

export default App;