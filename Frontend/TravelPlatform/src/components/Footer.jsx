import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 text-center text-sm py-4 mt-auto">
      © {new Date().getFullYear()} Travel Platform. All rights reserved.
    </footer>
  );
};

export default Footer;
