import React from "react";
import {Icon} from "./Icon.jsx";

export const DestinationCard = ({ image, title, price, tripDuration }) => (
    <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden group transform hover:-translate-y-2 transition-all duration-300">
        <div className="relative h-80"><img src={image} alt={title} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x500/dbeafe/333333?text=Destination'; }} /></div>
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
                <p className="text-lg font-semibold text-gray-700">{price}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
                <Icon path={<path d="M10.894 2.553a1 1 0 00-1.788 0l-1 1.732a1 1 0 00.431 1.263l1.358.784a1 1 0 010 1.732l-1.358.784a1 1 0 00-.431 1.263l1 1.732a1 1 0 001.788 0l1-1.732a1 1 0 00-.431-1.263l-1.358-.784a1 1 0 010-1.732l1.358-.784a1 1 0 00.431-1.263l-1-1.732z" />} className="h-5 w-5 text-red-500" />
                <span>{tripDuration}</span>
            </div>
        </div>
    </div>
);