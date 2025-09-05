import React from 'react';
import {Landmark} from "lucide-react";

const LocationContent = ({name, city, province, type, description}) => {
    return (
      <>
          <div className={`py-5 border-b border-welded-iron/20`}>
              <div className={`flex items-center justify-between`}>

                  <div className="flex flex-col gap-2">
                      <div className="font-display font-bold text-lg text-midnight-dreams leading-normal">
                          {name}
                      </div>
                      <div className="flex items-center gap-3">
                          <Landmark className="w-4 h-4"/>
                          <div className="font-display font-normal text-base text-gray-600 leading-normal">
                              {city}, {province}
                          </div>
                      </div>
                  </div>

                  <span
                    className="bg-fly-by-night text-malibu-sun font-display text-sm font-normal me-2 px-2.5 py-0.5 rounded-sm">
                  {type}
              </span>

              </div>
          </div>

          <div>
              <div className={`py-5 border-b border-welded-iron/20`}>
                  <div className="font-display font-normal text-base text-gray-600 leading-normal line-clamp-2">
                      {description}
                  </div>

              </div>
          </div>

      </>
    );
};

export default LocationContent;