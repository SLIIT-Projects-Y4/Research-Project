import React from "react";
import {Icon} from "./Icon.jsx";
import {BookingStep} from "./BookingStep.jsx";

export const Booking = () => {
    const steps = [
        { icon: <Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} />, title: 'Choose Destination', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna, tortor tempus.' },
        { icon: <Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />} />, title: 'Make Payment', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna, tortor tempus.' },
        { icon: <Icon path={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />} />, title: 'Reach Airport on Selected Date', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna, tortor tempus.' }
    ];
    return (
        <section className="py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-20 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <header className="text-left">
                        <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-widest">Easy and Fast</h3>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2" style={{fontFamily: "'Volkhov', serif"}}>Book Your Next Trip In 3 Easy Steps</h2>
                    </header>
                    <div className="space-y-6">{steps.map((step, index) => <BookingStep key={index} {...step} />)}</div>
                </div>
                <div className="relative flex justify-center">
                    <div className="absolute top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full -z-10 blur-2xl"></div>
                    <div className="absolute bottom-10 -left-10 w-32 h-32 bg-red-200 rounded-full -z-10 blur-2xl"></div>
                    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full relative group">
                        <img src="https://images.unsplash.com/photo-1580579227359-21875a13c353?q=80&w=1934&auto=format&fit=crop" alt="Trip to Greece" className="w-full h-48 object-cover rounded-3xl mb-4" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/350x200/e0f2fe/333333?text=Greece'; }} />
                        <h4 className="font-bold text-lg text-gray-700 mb-2">Trip To Greece</h4>
                        <p className="text-gray-500 mb-4">14-29 June | by Robbin joseph</p>
                        <div className="flex gap-4 mb-6">
                            {[...Array(3)].map((_, i) => <span key={i} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full text-gray-500"><Icon path={<path fillRule="evenodd" d="M15.146 3.354a.5.5 0 01.708 0l.646.646a.5.5 0 010 .708l-1.5 1.5a.5.5 0 01-.708 0L13.5 5.414a.5.5 0 010-.708l.646-.646a.5.5 0 01.708 0zM5.5 9.5a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5z" clipRule="evenodd" />} /></span>)}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">24 people going</span>
                            <Icon path={<path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />} className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="absolute bottom-16 -right-20 bg-white p-4 rounded-2xl shadow-lg flex items-center gap-4 w-64 transform group-hover:scale-105 transition-transform duration-300">
                            <img src="https://images.unsplash.com/photo-1541417904959-523a735c1ae7?q=80&w=1964&auto=format&fit=crop" alt="Rome" className="w-12 h-12 object-cover rounded-full" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/50x50/fef2f2/333333?text=Rome'; }} />
                            <div>
                                <p className="text-sm text-gray-500">Ongoing</p>
                                <h5 className="font-bold text-gray-800">Trip to rome</h5>
                                <p className="text-sm"><span className="text-purple-600 font-bold">40%</span> completed</p>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-purple-600 h-1.5 rounded-full" style={{width: '40%'}}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};