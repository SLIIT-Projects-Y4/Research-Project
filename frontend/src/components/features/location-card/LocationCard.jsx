import React, {useState} from 'react';
import LocationRating from "./LocationRating.jsx";
import LocationContent from "./LocationContent.jsx";
import {Heart} from "lucide-react";

const LocationCard = ({
                          noOfRatings,
                          rating,
                          name,
                          city,
                          province,
                          description,
                          type,
                          onHeartIconClick,
                          onDetailsButtonClick,
                          onAddToPlanPoolButtonClick
                      }) => {

    const [isHeartClicked, setIsHeartClicked] = useState(false)

    const handleOnHeartIconClick = () => {
        onHeartIconClick();
        setIsHeartClicked(!isHeartClicked)
    }

    return (
      <div className={`border border-welded-iron/30 rounded-2xl w-[350px]`}>

          <div className="relative">
              <button
                onClick={handleOnHeartIconClick}
                className="absolute top-3 right-5 hover:cursor-pointer"
              >
                  <Heart
                    size={24}
                    color="white"
                    fill={isHeartClicked ? "white" : "transparent"}
                  />
              </button>
              <img
                src="/assets/beach.jpg"
                className="rounded-t-2xl object-center object-cover h-48 w-[350px]"
                alt={`${name} cover`}
              />
          </div>

          <div className="pb-3 px-[25px]">
              <div className="flex flex-col">
                  <div className={`pt-3 px-3`}>
                      <LocationRating noOfRatings={noOfRatings} rating={rating}/>
                  </div>
                  <LocationContent name={name} city={city} province={province} description={description} type={type}/>
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

      </div>
    );
};

export default LocationCard;