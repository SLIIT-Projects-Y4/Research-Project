import React, {useState} from 'react';
import {motion} from "framer-motion";
import LocationRating from "./LocationRating.jsx";
import LocationContent from "./LocationContent.jsx";
import {useViewportSize} from "@mantine/hooks";

const LocationCard = ({
                          noOfRatings,
                          rating,
                          name,
                          city,
                          province,
                          description,
                          type,
                          imageUrl,
                          onDetailsButtonClick,
                          onAddToPlanPoolButtonClick
                      }) => {

    const [isHovered, setIsHovered] = useState(false);
    const {width} = useViewportSize();

    return (
     <div
       style={{
           width: `${width < 640 ? '300px' : '350px'}`
       }}
       className="border border-welded-iron/30 rounded-2xl overflow-hidden scale-90"

        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
          <div className="relative overflow-hidden">
              <motion.img
                src={`/images/${imageUrl}`}
                className="object-center object-cover h-48 w-[350px]"
                alt={`${name} cover`}
                animate={{
                    scale: isHovered ? 1.1 : 1
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut"
                }}
              />
          </div>

          <div className="pb-3 px-[25px]">
              {/* rating row */}
              <div className="pt-3 px-3">
                  <LocationRating noOfRatings={noOfRatings} rating={rating}/>
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