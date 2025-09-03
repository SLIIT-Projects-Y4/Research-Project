import React from "react";

export const ServiceCard = ({ icon, title, description, highlight }) => (
  <div className={`relative text-center p-8 rounded-3xl transition-all duration-300 group ${highlight ? 'bg-white shadow-2xl -translate-y-4 z-10' : 'bg-transparent hover:bg-white hover:shadow-lg'}`}>
    {highlight && <div className="absolute -bottom-4 -left-6 w-24 h-24 bg-red-500 rounded-tl-3xl rounded-br-lg -z-10 transition-transform duration-500 group-hover:rotate-12"></div>}
    <div className="flex justify-center items-center mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);