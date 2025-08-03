import React from "react";
import {PartnerLogo} from "./PartnerLogo.jsx";

export const Partners = () => {
    const partners = [
        { src: 'https://cdn.worldvectorlogo.com/logos/axon-1.svg', alt: 'Axon' },
        { src: 'https://cdn.worldvectorlogo.com/logos/jetstar-airways.svg', alt: 'Jetstar' },
        { src: 'https://cdn.worldvectorlogo.com/logos/expedia-1.svg', alt: 'Expedia' },
        { src: 'https://cdn.worldvectorlogo.com/logos/qantas-5.svg', alt: 'Qantas' },
        { src: 'https://cdn.worldvectorlogo.com/logos/alitalia-2.svg', alt: 'Alitalia' },
    ];
    return (
        <section className="py-12 bg-transparent">
            <div className="container mx-auto px-4 sm:px-6 lg:px-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center">
                    {partners.map((partner, index) => <PartnerLogo key={index} {...partner} />)}
                </div>
            </div>
        </section>
    );
};