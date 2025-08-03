import React from "react";

export const BookingStep = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100 text-yellow-500">{icon}</div>
        <div>
            <h4 className="font-bold text-gray-600">{title}</h4>
            <p className="text-gray-500">{description}</p>
        </div>
    </div>
);