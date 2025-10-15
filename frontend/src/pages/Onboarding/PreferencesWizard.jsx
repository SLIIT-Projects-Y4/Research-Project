// src/pages/Onboarding/PreferencesWizard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getMyPreferences, updateMyPreferences } from "@/api/preferences.js";
import { getMe, refreshAuth } from "@/api/auth"; // <-- added refreshAuth + using getMe
import { useAuth } from "@/store/auth.jsx";      // <-- to update user/token in context
import { useNavigate } from "react-router-dom";
import { Button, Paper } from "@mantine/core";
import { toast } from "react-toastify";
import MultiSelectPills from "@/components/forms/MultiSelectPills";

const AGE_GROUPS = ["18-25", "26-35", "36-50", "51+"];
const GENDERS = ["Female", "Male", "Other"];
const TRAVEL_COMPANIONS = ["Couple", "Family", "Friends", "Solo"];
const ACTIVITIES = [
  "Agricultural Workshops",
  "Animal Watching",
  "Architectural Marvel",
  "Beach Hopping",
  "Bird Watching",
  "Boat Tours",
  "Boating",
  "Cultural Activities",
  "Cultural Exploration",
  "Cultural Tours",
  "Educational Tours",
  "Exploring Exhibits",
  "Factory Tours",
  "Guided Tours",
  "Hiking",
  "Historical Exploration",
  "Jet Skiing",
  "Kayaking",
  "Kit Surfing",
  "Kite Surfing",
  "Learning History",
  "Meditation",
  "Nature Photography",
  "Nature Walks",
  "Photography",
  "Rafting",
  "Relaxation",
  "Sightseeing",
  "Snorkeling",
  "Sunbathing",
  "Surfing",
  "Swimming",
  "Trekking",
  "Walking Trails",
  "Wildlife Safaris",
  "Wildlife Spotting",
  "Worship",
  "Yoga",
];

const STEPS = ["Demographics", "Companion", "Activities", "Style & Budget"];
// Keep the original name "BUGET" to avoid breaking other imports/usages
const BUGET = ["Low", "Medium", "High"];
const TRAVEL_STYLE = ["Backpacker", "Luxury", "Balanced", "Adventurous", "Relaxed"];

export default function PreferencesWizard() {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth(); // login: replace token+user, updateUser: replace user only

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    age_group: "",
    gender: "",
    country: "",
    travel_companion: "",
    preferred_activities: [],
    travel_style: "",
    budget: "",
  });

  // Load any existing preferences when page opens
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPreferences();
        // Accept flexible shapes: {status, data} or raw object
        const data = res?.data ?? res;
        if (data) setForm((prev) => ({ ...prev, ...data }));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return !!form.age_group && !!form.gender && !!form.country;
    if (step === 1) return !!form.travel_companion;
    if (step === 2)
      return Array.isArray(form.preferred_activities) && form.preferred_activities.length >= 2;
    if (step === 3) return !!form.travel_style && !!form.budget;
    return false;
  }, [step, form]);

  // Refresh in-app auth state immediately after saving a step:
  // 1) Try to mint a fresh token+user via /api/auth/refresh (if backend supports it)
  // 2) Otherwise, just re-fetch /api/users/me and update the user object locally
  const shadowRefreshUser = async () => {
    // Try refresh endpoint first
    try {
      const refreshed = await refreshAuth();
      if (refreshed?.token && refreshed?.user) {
        login(refreshed.token, refreshed.user);
        return;
      }
    } catch {
      // fall through to getMe
    }

    // Fallback to /me
    try {
      const me = await getMe();
      const updatedUser = me?.user ?? me?.data ?? me;
      if (updatedUser) updateUser(updatedUser);
    } catch {
      // ignore
    }
  };

  const saveAndNext = async () => {
    if (!canNext) {
      toast.error("Please complete this step before continuing");
      return;
    }
    try {
      setLoading(true);
      const res = await updateMyPreferences({ ...form });

      // Accept both {status:'ok'} and plain success
      const statusOk = res?.status === "ok" || res?.success === true || !!res;
      if (statusOk) {
        toast.success("Preferences saved");
        // Immediately refresh auth state (new token if your backend returns one)
        await shadowRefreshUser();
      }

      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        toast.success("All set! Generating recommendations…");
        navigate("/home");
      }
    } catch {
      toast.error("Could not save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Tell us your travel preferences</h1>
          <div className="text-sm text-gray-600">Step {step + 1} / {STEPS.length}</div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`px-3 py-2 rounded-full text-sm border ${
                i === step
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        <Paper shadow="sm" p="lg" className="space-y-6">
          {/* Step 1: Demographics */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Age Group</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.age_group}
                  onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))}
                >
                  <option value="">Select</option>
                  {AGE_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Gender</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Country</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Sri Lanka"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 2: Companion */}
          {step === 1 && (
            <div>
              <label className="block text-sm mb-1">Travel Companion</label>
              <select
                className="w-full border rounded px-3 py-2 max-w-md"
                value={form.travel_companion}
                onChange={(e) => setForm((f) => ({ ...f, travel_companion: e.target.value }))}
              >
                <option value="">Select</option>
                {TRAVEL_COMPANIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Activities */}
          {step === 2 && (
            <div>
              <label className="block text-sm mb-2">Preferred Activities (pick at least 2)</label>
              <MultiSelectPills
                options={ACTIVITIES}
                value={form.preferred_activities}
                onChange={(val) => setForm((f) => ({ ...f, preferred_activities: val }))}
              />
            </div>
          )}

          {/* Step 4: Style & Budget */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Travel Style</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.travel_style}
                  onChange={(e) => setForm((f) => ({ ...f, travel_style: e.target.value }))}
                >
                  <option value="">Select</option>
                  {TRAVEL_STYLE.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Budget</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                >
                  <option value="">Select</option>
                  {BUGET.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="default" onClick={back} disabled={step === 0 || loading}>
              Back
            </Button>
            <Button onClick={saveAndNext} loading={loading}>
              {step === STEPS.length - 1 ? "Finish" : "Save & Continue"}
            </Button>
          </div>
        </Paper>
      </div>
    </div>
  );
}
