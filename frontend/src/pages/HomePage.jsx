import React, {useEffect, useMemo, useState} from 'react';
import {fromProfile} from '../api/recommendations';
import {toast} from 'react-toastify';
import {useAuth} from '../store/auth.jsx';
import {useNavigate} from 'react-router-dom';
import {addToPlanPool} from '../api/planpool';
import LocationCard from '../components/features/location-card/LocationCard.jsx';
import PlanPoolCard from "../components/features/plan-pool/PlanPoolCard.jsx";
import Hero from "@/components/common/Hero.jsx";
import {SyncLoader} from "react-spinners";

export default function HomePage() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [weights, setWeights] = useState(null);

    const cacheKey = useMemo(
      () => (user?.id ? `recs:${user.id}` : `recs:anon`),
      [user?.id]
    );

    const hydrateFromCache = () => {
        try {
            const raw = localStorage.getItem(cacheKey);
            if (!raw) return false;
            const cached = JSON.parse(raw);
            if (!cached || !Array.isArray(cached.results)) return false;
            setResults(cached.results);
            setWeights(cached.weights || null);
            setLoading(false);
            return true;
        } catch {
            return false;
        }
    };

    const saveToCache = (payload) => {
        try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({...payload, ts: Date.now()})
            );
        } catch (e) {
            console.log("Failed to save recommendations to cache", e);
        }
    };

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const {results: recs, weights: w} = await fromProfile(10);
            const payload = {
                results: Array.isArray(recs) ? recs : [],
                weights: w || null,
            };
            setResults(payload.results);
            setWeights(payload.weights);
            saveToCache(payload);
        } catch {
            toast.error('Could not load recommendations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const hadCache = hydrateFromCache();
        if (!hadCache) fetchRecommendations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);

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

    const toCardProps = (loc) => ({
        name: loc.Location_Name,
        city: loc.located_city || '',
        province: loc.province || '',
        description: loc.description || '',
        type: loc.Location_Type || '',
        rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : undefined,
        noOfRatings: typeof loc.rating_count === 'number' ? loc.rating_count : undefined,
        imageUrl: loc.location_image,
        onAddToPlanPoolButtonClick: () => handleAddToPlan(loc),
        onDetailsButtonClick: () => {
            if (loc.location_id) navigate(`/locations/${encodeURIComponent(loc.location_id)}`);
        }
    });

    return (
      <>
          <Hero/>
          <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="mt-8 sm:mt-10 font-display flex items-center justify-center font-semibold text-fly-by-night text-xl sm:text-2xl lg:text-3xl underline">
                  Recommended for You
              </div>
              <div className="w-full mt-8 sm:mt-10">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center text-gray-600 py-12 sm:py-16">
                        <SyncLoader color="#F97316" size={15}/>
                        <div className="mt-4 font-display text-base sm:text-lg text-center text-midnight-dreams px-4">
                            Please Wait... We'll recommend you the best Locations..
                        </div>
                    </div>

                  ) : results.length === 0 ? (
                    <div className="text-gray-600 py-8 sm:py-12 text-center text-sm sm:text-base">
                        No recommendations yet. Click "Refresh Recommendations".
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                        {results.map((loc, idx) => (
                          <LocationCard
                            key={loc.location_id || `${loc.name}-${loc.city}-${idx}`}
                            {...toCardProps(loc)}
                          />
                        ))}
                    </div>
                    </div>
                  )}
              </div>
          </div>
      </>
    );
}