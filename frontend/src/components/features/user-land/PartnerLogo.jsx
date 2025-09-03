import React from "react";

export const PartnerLogo = ({ src, alt }) => (
    <div className="flex justify-center items-center p-4">
        <img src={src} alt={alt} className="h-8 lg:h-10 object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/150x40/f3f4f6/9ca3af?text=${alt}`; }} />
    </div>
);