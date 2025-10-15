import React, {useEffect, useState} from "react";
import LocationCard from '../components/features/location-card/LocationCard.jsx';
import axios from "axios";
import {addToPlanPool} from "@/api/planpool.js";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {SyncLoader} from "react-spinners";

const LOCATION_TYPES = [
    "Beaches",
    "Farms",
    "Bodies of Water",
    "Gardens",
    "Historic Sites",
    "Museums",
    "National Parks",
    "Waterfalls",
    "Religious Sites",
    "Zoological Gardens"
];

// Individual category component
const LocationCategorySection = ({locationType}) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                  `http://localhost:8000/locations/category?location_type=${locationType}`
                );
                if (res.data?.results) {
                    setLocations(res.data.results);
                }
            } catch (err) {
                console.error(`Error fetching ${locationType}:`, err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, [locationType]);

    const toPlanPoolItem = (loc) => ({
        location_id: loc.location_id || null,
        name: loc.Location_Name,
        city: loc.located_city || '',
        province: loc.province || '',
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
        avg_rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : null,
        rating_count: typeof loc.rating_count === 'number' ? loc.rating_count : null,
        description: loc.description || '',
        activities: Array.isArray(loc.activities) ? loc.activities : [],
        type: loc.type || null,
    });

    const handleAddToPlan = async (loc) => {
        try {
            await addToPlanPool(toPlanPoolItem(loc));
            toast.success('Added to plan');
        } catch (err) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.error;
            if (status === 409) toast.info('Already in plan');
            else toast.error(msg || 'Failed to add to plan');
        }
    };

    if (loading) {
        return (
          <div className="mb-12">
              <h2 className="text-2xl font-display font-bold mb-6 text-midnight-dreams">
                  {locationType}
              </h2>
              <div className={'flex items-center justify-center'}>
              <SyncLoader color="#F97316"/>
                  </div>
          </div>
        );
    }

    if (!locations.length) {
        return (
          <div className="mb-12">
              <h2 className="text-2xl font-display font-bold mb-6 text-midnight-dreams">
                  {locationType}
              </h2>
              <p className="text-center text-gray-500">No {locationType} found.</p>
          </div>
        );
    }

    return (
      <div className="mb-5 ">
          <div className={`border-b border-fly-by-night mb-3`}>
              <h2 className="text-2xl font-display font-bold mb-2 text-midnight-dreams">
                  {locationType}
              </h2>
          </div>

          <div
            className="flex gap-4 overflow-x-auto pb-6"
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
            }}
          >
              {locations.map((loc) => (
                <div
                  key={loc.location_id}
                  className=""
                >
                    <LocationCard
                      name={loc.Location_Name}
                      city={loc.located_city}
                      province={loc.province}
                      description={loc.description}
                      type={locationType}
                      rating={loc.avg_rating}
                      noOfRatings={loc.rating_count}
                      imageUrl={loc.location_image && loc.location_image.trim() !== ""
                        ? loc.location_image
                        : "/assets/beach.jpg"}
                      onHeartIconClick={() => console.log("Heart clicked:", loc.location_id)}
                      onDetailsButtonClick={() => {
                          if (loc.location_id) navigate(`/locations/${encodeURIComponent(loc.location_id)}`);
                      }}
                      onAddToPlanPoolButtonClick={() => handleAddToPlan(loc)}
                    />
                </div>
              ))}
          </div>
      </div>
    );
};

// Main component that renders all location categories
export default function AllLocationsPage() {
    return (
      <div className="mt-20 px-18 py-6">
          {/*<h3 className="pb-6 font-display text-4xl font-bold text-brave-orange leading-tight">*/}
          {/*    Location Categories*/}
          {/*</h3>*/}

          {LOCATION_TYPES.map((locationType) => (
            <LocationCategorySection
              key={locationType}
              locationType={locationType}
            />
          ))}
      </div>
    );
}