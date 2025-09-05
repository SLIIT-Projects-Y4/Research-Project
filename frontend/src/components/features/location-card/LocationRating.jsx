import React from 'react';

const LocationRating = ({ rating, noOfRatings }) => {
  return (
    <div className="py-1 px-3 flex items-center justify-between border border-welded-iron/30 rounded-lg">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100; // 0..100

          return (
            <svg
              key={i}
              className="w-3 h-3 ms-[2px]" // reduced size + smaller gap
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 22 20"
            >
              <path
                d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                className="text-yellow-200/70"
                fill="currentColor"
              />
              <defs>
                <linearGradient id={`star-fill-${i}`}>
                  <stop offset={`${fillPercent}%`} stopColor="rgb(253 224 71)" />
                  <stop offset={`${fillPercent}%`} stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                fill={`url(#star-fill-${i})`}
                stroke="currentColor"
                className="text-lemon-dream"
              />
            </svg>
          );
        })}
      </div>

      <div className="flex -space-x-3 rtl:space-x-reverse"> {/* tightened spacing */}
        <img
          className="w-8 h-8 border-2 border-white rounded-full"
          src="/assets/avatar1.jpg"
          alt=""
        />
        <img
          className="w-8 h-8 border-2 border-white rounded-full"
          src="/assets/avatar2.jpg"
          alt=""
        />
        <img
          className="w-8 h-8 border-2 border-white rounded-full"
          src="/assets/avatar3.jpg"
          alt=""
        />
        <a
          className="flex items-center justify-center w-8 h-8 text-[8px] font-semibold text-white bg-gray-700 border-2 border-white rounded-full"
          href="#"
        >
          +{noOfRatings - 3}
        </a>
      </div>
    </div>
  );
};

export default LocationRating;
