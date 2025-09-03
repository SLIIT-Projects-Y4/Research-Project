import React from "react";
import {DestinationCard} from "./DestinationCard.jsx";

export const Destinations = () => {
    const destinations = [
        { image: 'https://images.unsplash.com/photo-1531400224783-7c262f10950e?q=80&w=1964&auto=format&fit=crop', title: 'Rome, Italy', price: '$5,42k', tripDuration: '10 Days Trip' },
        { image: 'https://images.unsplash.com/photo-1505761671935-60b3a742750f?q=80&w=2070&auto=format&fit=crop', title: 'London, UK', price: '$4.2k', tripDuration: '12 Days Trip' },
        { image: 'https://images.unsplash.com/photo-1519922639102-1a223a72a2d7?q=80&w=1974&auto=format&fit=crop', title: 'Full Europe', price: '$15k', tripDuration: '28 Days Trip' },
    ];
    return (
        <section className="py-16 lg:py-24 bg-gray-50/50 relative">
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 -z-10"><img src="https://jadoo-react.vercel.app/images/shape.png" alt="" className="h-[400px] opacity-70" /></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-20">
                <header className="text-center mb-12">
                    <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-widest">Top Selling</h3>
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900" style={{fontFamily: "'Volkhov', serif"}}>Top Destinations</h2>
                </header>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {destinations.map((dest, index) => <DestinationCard key={index} {...dest} />)}
                </div>
            </div>
        </section>
    );
};