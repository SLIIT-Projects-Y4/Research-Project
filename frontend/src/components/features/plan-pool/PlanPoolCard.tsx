import {SquareX, Pin} from "lucide-react";

const PlanPoolCard = ({name, city, province, onRemoveLocationIconClick}) => {
    return (
        <div className={'py-2 px-4 border border-welded-iron/30 rounded-xl'}>
            <div className={`flex items-center justify-between`}>
                <div className={'flex flex-col items-start gap-1.5'}>
                    <div className={`font-display font-bold text-base text-midnight-dreams leading-normal`}>
                        {name}
                    </div>
                    <div className={`flex items-center gap-1`}>
                        <Pin className="w-3 h-3"/>
                        <div className="font-display font-normal text-sm text-welded-iron leading-normal">
                            {city}, {province}
                        </div>
                    </div>

                </div>
                <button
                    className={`hover:cursor-pointer`}
                    onClick={onRemoveLocationIconClick}>
                        <SquareX className={`w-7 h-7 text-dusty-orange`}/>
                    </button>
            </div>
        </div>
    );
};

export default PlanPoolCard;