import React, { useEffect, useRef, useState } from "react";
import LocationCard from "../components/features/location-card/LocationCard.jsx";
import axios from "axios";
import { addToPlanPool } from "@/api/planpool.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SyncLoader } from "react-spinners";
import { useViewportSize } from "@mantine/hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  "Zoological Gardens",
];

const LocationCategorySection = ({ locationType }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

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
    city: loc.located_city || "",
    province: loc.province || "",
    lat: loc.lat ?? null,
    lng: loc.lng ?? null,
    avg_rating: typeof loc.avg_rating === "number" ? loc.avg_rating : null,
    rating_count: typeof loc.rating_count === "number" ? loc.rating_count : null,
    description: loc.description || "",
    activities: Array.isArray(loc.activities) ? loc.activities : [],
    type: loc.type || null,
  });

  const handleAddToPlan = async (loc) => {
    try {
      await addToPlanPool(toPlanPoolItem(loc));
      toast.success("Added to plan");
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      if (status === 409) toast.info("Already in plan");
      else toast.error(msg || "Failed to add to plan");
    }
  };

  const scrollByCards = (dir = 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 350;
    const gap = 16;
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6 text-brave-orange">
          {locationType}
        </h2>
        <div className={"flex items-center justify-center"}>
          <SyncLoader color="#F97316" />
        </div>
      </div>
    );
  }

  if (!locations.length) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6 text-text-brave-orange">
          {locationType}
        </h2>
        <p className="text-center text-gray-500">No {locationType} found.</p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between border-b border-midnight-dreams mb-3">
        <h2 className="text-2xl font-display font-bold mb-2 text-midnight-dreams">
          {locationType}
        </h2>
        <div className="flex gap-2">
          <button
            aria-label="Scroll left"
            onClick={() => scrollByCards(-1)}
            className="p-1 rounded-full bg-white border border-heart-of-ice hover:bg-heart-of-ice transition-all hover:shadow-sm hover:cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-midnight-dreams" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scrollByCards(1)}
            className="p-1 rounded-full bg-white border border-heart-of-ice hover:bg-heart-of-ice transition-all hover:shadow-sm hover:cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-midnight-dreams" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-6"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {locations.map((loc) => (
          <div key={loc.location_id} className="">
            <LocationCard
              name={loc.Location_Name}
              city={loc.located_city}
              province={loc.province}
              description={loc.description}
              type={locationType}
              rating={loc.avg_rating}
              noOfRatings={loc.rating_count}
              imageUrl={
                loc.location_image && loc.location_image.trim() !== ""
                  ? loc.location_image
                  : "/assets/beach.jpg"
              }
              onHeartIconClick={() =>
                console.log("Heart clicked:", loc.location_id)
              }
              onDetailsButtonClick={() => {
                if (loc.location_id)
                  navigate(`/locations/${encodeURIComponent(loc.location_id)}`);
              }}
              onAddToPlanPoolButtonClick={() => handleAddToPlan(loc)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AllLocationsPage() {
  const { width } = useViewportSize();

  return (
    <div
      style={{
        paddingLeft: `${width < 1023 ? "16px" : "90px"}`,
        paddingRight: `${width < 1023 ? "16px" : "90px"}`,
      }}
      className="mt-20 py-6"
    >
      <div className="text-left mb-8">
        <h1 className="font-display text-3xl sm:text-6xl lg:text-7xl font-bold text-brave-orange leading-tight">
          Categories
        </h1>
      </div>

      {LOCATION_TYPES.map((locationType) => (
        <LocationCategorySection key={locationType} locationType={locationType} />
      ))}
    </div>
  );
}
