// src/pages/PlanPoolPage.jsx
import React, {useEffect, useState} from 'react';
import {getPlanPool, removeFromPlanPool} from '../api/planpool';
import {toast} from 'react-toastify';
import {Link} from 'react-router-dom';


// Adjust this path to where YOUR PlanPoolCard lives
import PlanPoolCard from '../components/features/plan-pool/PlanPoolCard.jsx';

export default function PlanPoolPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const load = async () => {
        try {
            setLoading(true);
            const res = await getPlanPool();
            setItems(Array.isArray(res?.data) ? res.data : []);
        } catch {
            toast.error('Failed to load plan pool');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onRemove = async (location_id) => {
        try {
            await removeFromPlanPool(location_id);
            setItems((prev) => prev.filter((x) => x.location_id !== location_id));
            toast.success('Removed from plan');
        } catch {
            toast.error('Failed to remove');
        }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="mx-auto max-w-3xl space-y-4">
              <div className="flex items-end justify-between">
                  <h1 className="text-2xl font-semibold">Plan Pool</h1>
                  <Link
                    to="/plan/build"
                    className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
                  >
                      Build Plan
                  </Link>
              </div>
              {loading ? (
                <div className="text-gray-600">Loading…</div>
              ) : items.length === 0 ? (
                <div className="text-gray-600">No locations added yet.</div>
              ) : (
                <div className="space-y-3">
                    {items.map((loc) => (
                      <PlanPoolCard
                        key={loc.location_id}
                        name={loc.name}
                        city={loc.city}
                        province={loc.province}
                        onRemoveLocationIconClick={() => onRemove(loc.location_id)}
                      />
                    ))}
                </div>
              )}
          </div>
      </div>
    );
}
