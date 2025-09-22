import React, {useEffect, useMemo, useState} from 'react';
import {fromProfile} from '../api/recommendations';
import {toast} from 'react-toastify';
import {useAuth} from '../store/auth.jsx';
import {useNavigate} from 'react-router-dom';
import {addToPlanPool} from '../api/planpool';
import LocationCard from '../components/features/location-card/LocationCard.jsx';
import PlanPoolCard from "../components/features/plan-pool/PlanPoolCard.jsx";
import Hero from "@/components/common/Hero.jsx";

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
            const {results: recs, weights: w} = await fromProfile(10); // ← returns normalized shape
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

    // ---- mapping helpers (use normalized fields from Node) ----
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
        // you can add type if your plan pool wants it
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

    // inside HomePage.jsx
    const toCardProps = (loc) => ({
        name: loc.Location_Name,                 // <-- make sure this is set
        city: loc.located_city || '',
        province: loc.province || '',
        description: loc.description || '',
        type: loc.Location_Type || '',
        rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : undefined,
        noOfRatings: typeof loc.rating_count === 'number' ? loc.rating_count : undefined,
        imageUrl: '/assets/beach.jpg',
        onAddToPlanPoolButtonClick: () => handleAddToPlan(loc),
        onDetailsButtonClick: () => {
            if (loc.location_id) navigate(`/locations/${encodeURIComponent(loc.location_id)}`);

        }

    });


    return (
      <>
          <Hero/>
          <div className="px-44">
              <div className={`mt-10 font-display font-semibold text-fly-by-night text-2xl underline`}>
                    Recommended for You
              </div>
              <div className="mx-auto mt-10">
                  {loading ? (
                    <div className="text-gray-600">Loading recommendations…</div>
                  ) : results.length === 0 ? (
                    <div className="text-gray-600">
                        No recommendations yet. Click “Refresh Recommendations”.
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {results.map((loc, idx) => (
                          <LocationCard
                            key={loc.location_id || `${loc.name}-${loc.city}-${idx}`}
                            {...toCardProps(loc)}
                          />
                        ))}
                    </div>
                  )}
              </div>
          </div>
      </>
    );
}
