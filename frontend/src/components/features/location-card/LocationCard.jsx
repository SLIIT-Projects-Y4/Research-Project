import React, { useState } from 'react';
import LocationRating from "./LocationRating.jsx";
import LocationContent from "./LocationContent.jsx";
import { Heart } from "lucide-react";

const LocationCard = ({
  noOfRatings,
  rating,
  name,
  city,
  province,
  description,
  type,
  imageUrl = "/assets/beach.jpg",
  onHeartIconClick,
  onDetailsButtonClick,
  onAddToPlanPoolButtonClick
}) => {
  const [isHeartClicked, setIsHeartClicked] = useState(false);

  const handleOnHeartIconClick = () => {
    try { onHeartIconClick && onHeartIconClick(); } catch {}
    setIsHeartClicked((v) => !v);
  };

  return (
    <div className="border border-welded-iron/30 rounded-2xl w-[350px] overflow-hidden">
      <div className="relative">
        <button
          onClick={handleOnHeartIconClick}
          className="absolute top-3 right-5 hover:cursor-pointer"
          aria-label="Save"
        >
          <Heart size={24} color="white" fill={isHeartClicked ? "white" : "transparent"} />
        </button>
        <img
          src={imageUrl}
          className="object-center object-cover h-48 w-[350px]"
          alt={`${name} cover`}
        />
      </div>

      <div className="pb-3 px-[25px]">
        {/* rating row */}
        <div className="pt-3 px-3">
          <LocationRating noOfRatings={noOfRatings} rating={rating} />
        </div>

        {/* title + tag + meta + desc */}
        <LocationContent
          name={name}
          city={city}
          province={province}
          description={description}
          type={type}   // <- shows as a tag
        />

        {/* actions */}
        <div className="pt-3 flex items-center justify-between text-xs">
          <button
            onClick={onDetailsButtonClick}
            className="py-2 px-4 bg-lemon-dream rounded-lg text-white font-display font-semibold hover:cursor-pointer"
          >
            Details
          </button>
          <button
            onClick={onAddToPlanPoolButtonClick}
            className="py-2 px-4 bg-dusty-orange rounded-lg text-white font-display font-semibold hover:cursor-pointer"
          >
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;
