import {X, MapPin} from "lucide-react";
import {useState} from "react";

const PlanPoolCard = ({name, city, province, onRemoveLocationIconClick, onClick}) => {
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = async (e) => {
        e.stopPropagation();
        setIsRemoving(true);
        setTimeout(() => {
            onRemoveLocationIconClick();
        }, 250);
    };

    const handleCardClick = () => {
        if (onClick && !isRemoving) {
            onClick();
        }
    };

    return (
      <div
        className={`group relative overflow-hidden transition-all duration-300 cursor-pointer ${
          isRemoving
            ? 'opacity-0 scale-95 translate-x-full'
            : 'opacity-100 scale-100 translate-x-0'
        }`}
        onClick={handleCardClick}
      >
          <div
            className="relative bg-white hover:bg-gray-50/80 rounded-lg sm:rounded-xl border border-gray-200/60 hover:border-brave-orange/30 shadow-sm hover:shadow-lg p-3 sm:p-4">

              {/* Content layout */}
              <div className="flex gap-2 sm:gap-3">
                  {/* Location icon */}
                  <div
                    className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-heart-of-ice to-malibu-sun rounded-lg flex items-center justify-center mt-0.5">
                      <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-ocean-depths"/>
                  </div>

                  {/* Text and button container */}
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                          <h3
                            className="font-display font-bold text-sm sm:text-lg text-midnight-dreams leading-tight break-words">
                              {name}
                          </h3>
                          <p
                            className="text-xs sm:text-sm text-welded-iron group-hover:text-ocean-depths font-medium transition-colors duration-300 truncate">
                              {city}, {province}
                          </p>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="flex-shrink-0 w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-gray-100/80 hover:bg-dusty-orange/10 border border-gray-200/50 hover:border-dusty-orange/30 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <X className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-welded-iron hover:text-dusty-orange transition-colors duration-200 ${
                            isRemoving ? 'animate-spin' : ''
                          }`}/>
                      </button>
                  </div>
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brave-orange/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
      </div>
    );
};

export default PlanPoolCard;