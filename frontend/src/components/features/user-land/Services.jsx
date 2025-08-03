import React from "react";
import {Icon} from "./Icon.jsx";
import {ServiceCard} from "./ServiceCard.jsx";

export const Services = () => {
    const servicesData = [
        { icon: <div className="w-16 h-16 rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-orange-100 flex items-center justify-center"><Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} className="w-8 h-8 text-orange-500" /></div>, title: 'Calculated Weather', description: 'Built Wicket longer admire do barton vanity itself do in it.' },
        { icon: <div className="w-16 h-16 rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-red-100 flex items-center justify-center"><Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />} className="w-8 h-8 text-red-500" /></div>, title: 'Best Flights', description: 'Engrossed listening. Park gate sell they west hard for the.', highlight: true },
        { icon: <div className="w-16 h-16 rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-blue-100 flex items-center justify-center"><Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />} className="w-8 h-8 text-blue-500" /></div>, title: 'Local Events', description: 'Barton vanity itself do in it. Preferd to men it engrossed listening.' },
        { icon: <div className="w-16 h-16 rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-purple-100 flex items-center justify-center"><Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4" />} className="w-8 h-8 text-purple-500" /></div>, title: 'Customization', description: 'We deliver outsourced aviation services for military customers' },
    ];
    return (
        <section className="py-16 lg:py-24 relative">
            <div className="absolute top-0 right-0 -z-20"><svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#E5E5E5" fillOpacity="0.3"/></svg></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-20">
                <header className="text-center mb-16">
                    <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-widest">Category</h3>
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900" style={{fontFamily: "'Volkhov', serif"}}>We Offer Best Services</h2>
                </header>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {servicesData.map((service, index) => <ServiceCard key={index} {...service} />)}
                </div>
            </div>
        </section>
    );
};