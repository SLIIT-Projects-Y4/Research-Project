// src/pages/Onboarding/PreferencesWizard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { getMyPreferences, updateMyPreferences } from '../../api/preferences';
import { useNavigate } from 'react-router-dom';
import { Button, Paper } from '@mantine/core';
import { toast } from 'react-toastify';
import MultiSelectPills from '../../components/forms/MultiSelectPills';

const AGE_GROUPS = ['18-25', '26-35', '36-50', '51+'];
const GENDERS = ['Female', 'Male', 'Other'];
const TRAVEL_COMPANIONS = ['Couple', 'Family', 'Friends', 'Solo'];
const TRAVEL_STYLES = ['Backpacker', 'Luxury', 'Balanced', 'Adventurous', 'Relaxed'];
const BUDGETS = ['Low', 'Medium', 'High'];

const ACTIVITIES = [
  'Agricultural Workshops', 'Animal Watching', 'Architectural Marvel', 'Beach Hopping', 'Bird Watching',
  'Boat Tours', 'Boating', 'Cultural Activities', 'Cultural Exploration', 'Cultural Tours', 'Educational Tours',
  'Exploring Exhibits', 'Factory Tours', 'Guided Tours', 'Hiking', 'Historical Exploration', 'Jet Skiing', 'Kayaking',
  'Kit Surfing', 'Kite Surfing', 'Learning History', 'Meditation', 'Nature Photography', 'Nature Walks', 'Photography',
  'Rafting', 'Relaxation', 'Sightseeing', 'Snorkeling', 'Sunbathing', 'Surfing', 'Swimming', 'Trekking',
  'Walking Trails', 'Wildlife Safaris', 'Wildlife Spotting', 'Worship', 'Yoga'
];

const STEPS = ['Demographics', 'Companion', 'Activities', 'Style & Budget'];

export default function PreferencesWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const [form, setForm] = useState({
    age_group: '',
    gender: '',
    country: '',
    travel_companion: '',
    preferred_activities: [],
    travel_style: '',
    budget: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPreferences();
        if (res?.data) {
          setForm({
            age_group: res.data.age_group || '',
            gender: res.data.gender || '',
            country: res.data.country || '',
            travel_companion: res.data.travel_companion || '',
            preferred_activities: res.data.preferred_activities || [],
            travel_style: res.data.travel_style || '',
            budget: res.data.budget || '',
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return !!form.age_group && !!form.gender && !!form.country;
    if (step === 1) return !!form.travel_companion;
    if (step === 2) return Array.isArray(form.preferred_activities) && form.preferred_activities.length >= 2;
    if (step === 3) return !!form.travel_style && !!form.budget;
    return false;
  }, [step, form]);

  const saveAndNext = async () => {
    if (!canNext) {
      toast.error('Please complete this step before continuing');
      return;
    }
    try {
      setLoading(true);
      const res = await updateMyPreferences({ ...form });
      if (res?.status === 'ok') toast.success('Preferences saved');

      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        toast.success('All set! Generating recommendations…');
        navigate('/home');
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Could not save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const dropdownStyle =
    'w-full border rounded-lg px-3 py-2 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-gray-800';

  const displayedActivities = showAllActivities ? ACTIVITIES : ACTIVITIES.slice(0, 9);

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 md:p-8 flex items-center justify-center"
      style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,adventure,landscape')" }}
    >
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 drop-shadow-sm">
            Tell us your travel preferences
          </h1>
          <div className="text-sm text-gray-800 drop-shadow-sm">
            {step + 1} / {STEPS.length}
          </div>
        </div>

        {/* Steps Progress */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 text-center px-3 py-2 rounded-full text-sm font-semibold transition-colors duration-300
                ${
                  i === step
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
                    : 'bg-white/90 text-gray-800 border border-gray-300'
                }`}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 shadow-lg">
          <Paper shadow="xl" radius="2xl" p="lg" className="bg-white/95 backdrop-blur-md space-y-6">
            {/* Step 0: Demographics */}
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1 font-semibold text-gray-800">Age Group</label>
                  <select
                    className={dropdownStyle}
                    value={form.age_group}
                    onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {AGE_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 font-semibold text-gray-800">Gender</label>
                  <select
                    className={dropdownStyle}
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 font-semibold text-gray-800">Country</label>
                  <input
                    className={dropdownStyle}
                    placeholder="e.g., Sri Lanka"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Travel Companion */}
            {step === 1 && (
              <div>
                <label className="block text-sm mb-1 font-semibold text-gray-800">Travel Companion</label>
                <select
                  className={dropdownStyle + ' max-w-md'}
                  value={form.travel_companion}
                  onChange={(e) => setForm((f) => ({ ...f, travel_companion: e.target.value }))}
                >
                  <option value="">Select</option>
                  {TRAVEL_COMPANIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 2: Activities */}
            {step === 2 && (
              <div>
                <label className="block text-sm mb-2 font-semibold text-gray-800">
                  Preferred Activities (pick at least 2)
                </label>
                <MultiSelectPills
                  options={displayedActivities}
                  value={form.preferred_activities}
                  onChange={(val) => setForm((f) => ({ ...f, preferred_activities: val }))}
                />
                {ACTIVITIES.length > 9 && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="text-blue-600 font-semibold hover:underline text-center"
                    >
                      {showAllActivities ? 'See Less ▲' : 'See More ▼'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Style & Budget */}
            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 font-semibold text-gray-800">Travel Style</label>
                  <select
                    className={dropdownStyle}
                    value={form.travel_style}
                    onChange={(e) => setForm((f) => ({ ...f, travel_style: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {TRAVEL_STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 font-semibold text-gray-800">Budget</label>
                  <select
                    className={dropdownStyle}
                    value={form.budget}
                    onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="default"
                onClick={back}
                disabled={step === 0 || loading}
                className="rounded-lg shadow-sm hover:bg-gray-100 text-gray-800 transition"
              >
                Back
              </Button>
              <Button
                onClick={saveAndNext}
                loading={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg shadow-lg transition"
              >
                {step === STEPS.length - 1 ? 'Finish' : 'Save & Continue'}
              </Button>
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
}
