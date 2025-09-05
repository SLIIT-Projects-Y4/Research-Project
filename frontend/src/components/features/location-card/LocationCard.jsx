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
      <div className={`border border-welded-iron/30 rounded-2xl`}>

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
                className="rounded-t-2xl object-center object-cover"
                alt={`${name} cover`}
              />
          </div>

          <div className="py-[30px] px-[25px]">
              <div className="flex flex-col">
                  <div className={`px-3`}>
                      <LocationRating noOfRatings={noOfRatings} rating={rating}/>
                  </div>
                  <LocationContent name={name} city={city} province={province} description={description} type={type}/>
                  <div className="pt-5 flex items-center justify-between gap-10">
                      <button
                        onClick={onDetailsButtonClick}
                        className="py-2 w-full bg-lemon-dream rounded-lg text-white text-sm font-semibold">
                          Details
                      </button>
                      <button
                        onClick={onAddToPlanPoolButtonClick}
                        className="py-2 w-full bg-dusty-orange rounded-lg text-white text-sm font-semibold">
                          Add to Plan
                      </button>
                  </div>
              </div>
          </div>

      </div>
    );
};

export default LocationCard;