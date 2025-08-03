import React, {useState} from "react";
import {Icon} from "./Icon.jsx";

export const Testimonials = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const testimonials = [
        { quote: "“On the Windows talking painted pasture yet its express parties use. Sure last upon he same as knew next. Of believed or diverted no.”", author: "Mike taylor", location: "Lahore, Pakistan", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
        { quote: "“Jadoo is a game-changer. The ease of booking and the quality of service are unparalleled. I had the most amazing trip to the Maldives, all thanks to them!”", author: "Chris Thomas", location: "CEO of Red Button", avatar: "https://randomuser.me/api/portraits/men/33.jpg" },
        { quote: "“The customer support is fantastic. They helped me plan a custom itinerary for my family's trip to Europe. Everything was seamless, from flights to accommodations.”", author: "Sarah Lee", location: "Seoul, South Korea", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    ];
    const handleNext = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
    const handlePrev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="py-16 lg:py-24 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-20 grid lg:grid-cols-2 gap-16 items-center">
                <header className="text-center lg:text-left">
                    <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-widest">Testimonials</h3>
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2 leading-tight" style={{fontFamily: "'Volkhov', serif"}}>What People Say About Us.</h2>
                </header>
                <div className="relative h-72 lg:h-80">
                    {testimonials.map((testimonial, index) => {
                        const isActive = index === activeIndex;
                        const isPrev = index === (activeIndex - 1 + testimonials.length) % testimonials.length;
                        let positionClass = 'transform scale-75 opacity-0 -z-10';
                        if (isActive) {
                            positionClass = 'transform scale-100 opacity-100 z-10';
                        } else if (isPrev) {
                            positionClass = 'transform scale-90 opacity-50 -z-0';
                        }
                        return (
                            <div key={index} className={`absolute top-0 left-0 w-full lg:w-[110%] transition-all duration-500 ${positionClass}`}>
                                <div className="relative bg-white p-6 rounded-xl shadow-lg">
                                    <img src={testimonial.avatar} alt={testimonial.author} className="absolute -top-6 -left-6 w-12 h-12 rounded-full object-cover border-2 border-white" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/50x50/cccccc/333333?text=User'; }} />
                                    <p className="text-gray-600 mb-6">{testimonial.quote}</p>
                                    <h4 className="font-bold text-lg text-gray-800">{testimonial.author}</h4>
                                    <p className="text-gray-500">{testimonial.location}</p>
                                </div>
                            </div>
                        )
                    })}
                    <div className="absolute -bottom-20 lg:-bottom-12 left-0 lg:left-auto lg:right-0 flex lg:flex-col gap-4">
                        <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 transition" aria-label="Previous testimonial"><Icon path={<path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />} /></button>
                        <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 transition" aria-label="Next testimonial"><Icon path={<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />} /></button>
                    </div>
                </div>
            </div>
        </section>
    );
};