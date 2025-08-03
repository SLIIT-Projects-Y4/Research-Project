import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout = ({ children }) => {
  return (
    <div className="font-sans bg-gray-50">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};