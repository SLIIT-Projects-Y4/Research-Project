// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { fromProfile } from '../api/recommendations';
import { toast } from 'react-toastify';
import { useAuth } from '../store/auth.jsx';
import { useNavigate } from 'react-router-dom';
import { addToPlanPool } from '../api/planpool';

// ⚠️ Keep the path you already use for your card component.
// If your file lives elsewhere, just adjust this import.
import LocationCard from '../components/features/location-card/LocationCard.jsx';
import PlanPoolCard from "../components/features/plan-pool/PlanPoolCard.js";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [weights, setWeights] = useState(null);

  // Cache key per user
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
        JSON.stringify({ ...payload, ts: Date.now() })
      );
    } catch {
      /* ignore quota issues */
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fromProfile(10);
      const payload = {
        results: Array.isArray(res?.results) ? res.results : [],
        weights: res?.weights || null,
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

  // On first load: show cache if present; otherwise call API once.
  useEffect(() => {
    const hadCache = hydrateFromCache();
    if (!hadCache) fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  // Map ML result → plan pool payload
  const toPlanPoolItem = (loc) => ({
    location_id: loc.location_id,
    name: loc.Location_Name,
    city: loc.located_city || '',
    province: loc.province || '',
    lat: loc.lat ?? null,
    lng: loc.lng ?? null,
    avg_rating: loc.avg_rating ?? null,
    rating_count: loc.rating_count ?? null,
    description: loc.description || '',
    activities: Array.isArray(loc.activities) ? loc.activities : [],
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

  // Robust adapter → pass *all likely* prop names so your LocationCard picks what it uses
  const toCardProps = (loc) => ({
    // names
    name: loc.Location_Name,
    locationName: loc.Location_Name,

    // geography
    province: loc.province || '',
    locationProvince: loc.province || '',
    city: loc.located_city || '',
    locationCity: loc.located_city || '',

    // rating
    rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : undefined,
    averageRating: typeof loc.avg_rating === 'number' ? loc.avg_rating : undefined,
    noOfRatings: typeof loc.rating_count === 'number' ? loc.rating_count : undefined,
    ratingCount: typeof loc.rating_count === 'number' ? loc.rating_count : undefined,

    // misc
    description: loc.description || '',
    activities: Array.isArray(loc.activities) ? loc.activities : [],
    score: typeof loc.Final_Score === 'number' ? loc.Final_Score : undefined,

    // image (common for now)
    imageUrl: '/assets/beach.jpg',

    // add-to-plan hook up (uses your card's onAddToPlanPoolButtonClick)
    onAddToPlanPoolButtonClick: () => handleAddToPlan(loc),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto">
        <PlanPoolCard name={'Colombo Temple'} city={'Colombo'} province={'Western Province'} onRemoveLocationIconClick={() => {}} />
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Recommended Locations</h1>
            {weights && (
              <p className="text-sm text-gray-600">
                Weights — CBF: {weights.cbf}, CF: {weights.cf}, ML: {weights.ml}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {/* NEW: Go to Plan Pool */}
            <button
              onClick={() => navigate('/plan-pool')}
              className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
            >
              Plan Pool
            </button>

            <button
              onClick={fetchRecommendations}
              className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
            >
              Refresh Recommendations
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(cacheKey);
                toast.success('Cleared saved recommendations');
                setResults([]);
                setWeights(null);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
            >
              Clear Saved
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading recommendations…</div>
        ) : results.length === 0 ? (
          <div className="text-gray-600">
            No recommendations yet. Click “Refresh Recommendations”.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((loc) => (
              <LocationCard
                key={loc.location_id || loc.Location_Name}
                {...toCardProps(loc)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
