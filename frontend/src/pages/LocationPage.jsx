import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById } from '@/api/locations';
import { addToPlanPool } from '@/api/planpool';
import { toast } from 'react-toastify';

export default function LocationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState(null);
  const [raw, setRaw] = useState(null);
  const [err, setErr] = useState(null);

  const header = useMemo(() => {
    if (!loc) return '';
    return [loc.name, [loc.city, loc.province].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
  }, [loc]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await getById(id);
        if (!mounted) return;
        setLoc(data.location);
        setRaw(data.raw || {});
      } catch (e) {
        setErr('Location not found');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleAddToPlan = async () => {
    if (!loc) return;
    try {
      await addToPlanPool({
        location_id: loc.location_id || null,
        name: loc.name,
        city: loc.city || '',
        province: loc.province || '',
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
        avg_rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : null,
        rating_count: typeof loc.rating_count === 'number' ? loc.rating_count : null,
        description: raw?.Location_Description || '',
        activities: [],
        type: loc.type || null
      });
      toast.success('Added to plan');
    } catch (e) {
      const status = e?.response?.status;
      if (status === 409) toast.info('Already in plan');
      else toast.error('Failed to add to plan');
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return (
    <div className="p-6">
      <div className="text-red-600">{err}</div>
      <button className="mt-3 underline" onClick={() => navigate(-1)}>Go back</button>
    </div>
  );

  return (
    <div className="p-6 mt-20 max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm underline">← Back</button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{loc.name}</h1>
          <div className="text-gray-600">{[loc.city, loc.province].filter(Boolean).join(' · ')}</div>
          {loc.type ? (
            <span className="inline-block mt-2 text-[10px] uppercase tracking-wide bg-gray-100 border border-gray-200 text-gray-700 rounded-full px-2 py-1">
              {loc.type}
            </span>
          ) : null}
        </div>
        <button
          onClick={handleAddToPlan}
          className="px-4 py-2 bg-dusty-orange rounded-lg text-white font-semibold"
        >
          Add to Plan
        </button>
      </div>

      <img
        src="/assets/beach.jpg"
        alt={`${loc.name} cover`}
        className="w-full h-64 object-cover rounded-xl"
      />

      <section className="space-y-2">
        <h2 className="font-semibold">About</h2>
        {raw?.Location_Description ? (
          <p className="text-gray-800 leading-relaxed">{raw.Location_Description}</p>
        ) : (
          <p className="text-gray-500">No description available.</p>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="p-4 border rounded-xl">
          <div><span className="text-gray-500">Type:</span> {loc.type || '—'}</div>
          <div><span className="text-gray-500">Rating:</span> {loc.avg_rating ?? '—'}</div>
          <div><span className="text-gray-500">Ratings Count:</span> {loc.rating_count ?? (raw?.Review_Count ?? '—')}</div>
        </div>
        <div className="p-4 border rounded-xl">
          <div><span className="text-gray-500">Latitude:</span> {loc.lat}</div>
          <div><span className="text-gray-500">Longitude:</span> {loc.lng}</div>
          <div><span className="text-gray-500">Location ID:</span> {loc.location_id}</div>
        </div>
      </section>
    </div>
  );
}
