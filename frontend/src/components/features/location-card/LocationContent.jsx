import React from 'react';
import {Pin} from "lucide-react";

const LocationContent = ({name, city, province, type, description}) => {
    return (
      <>
          <div className={`py-3 border-b border-welded-iron/20`}>
              <div className={`flex items-center justify-between`}>

                  <div className="flex flex-col gap-1">
                      <div className="max-w-[260px] font-display font-bold text-base text-midnight-dreams leading-normal truncate">
                          {name}
                      </div>
                      <div className="flex items-center gap-1.5">
                          <Pin className="w-3 h-3"/>
                          <div className="font-display font-normal text-[12px] text-welded-iron leading-normal">
                              {city}, {province}
                          </div>
                      </div>
                  </div>

              {/*    <span*/}
              {/*      className="bg-fly-by-night text-malibu-sun font-display text-sm font-normal me-2 px-2.5 py-0.5 rounded-sm">*/}
              {/*    {type}*/}
              {/*</span>*/}

              </div>
          </div>

          <div>
              <div className={`py-3 border-b border-welded-iron/20`}>
                  <div className="font-display font-normal text-[12px] text-gray-600 leading-normal line-clamp-2">
                      {description}
                  </div>

              </div>
          </div>

      </>
    );
};

export default LocationContent;