import React, {useState, useEffect} from "react";
import {toast} from "react-toastify";
import {ImSpinner2} from "react-icons/im";
import "react-toastify/dist/ReactToastify.css";

const initialFormState = {
  locations: "",            // manual fallback input (optional)
  package: "",
  total_days: "",
  min_rating: "1.5",
  max_rating: "4.0",
  travel_companion: "",
};

const sampleFormState = {
  locations: "Galle, Kandy", // now names are okay as a fallback demo
  package: "Moderate",
  total_days: 5,
  min_rating: "3.0",
  max_rating: "5.0",
  travel_companion: "Family",
};

export default function BudgetForm({
  user,
  onSubmit,
  selectedItinerary,
  locationIds,
  availableItineraries,
  onItinerarySelect
}) {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("formData");
    return saved ? JSON.parse(saved) : initialFormState;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItineraryTitle, setSelectedItineraryTitle] = useState('');

  useEffect(() => {
    if (selectedItinerary) {
      setSelectedItineraryTitle(selectedItinerary.title);
    }
  }, [selectedItinerary]);

  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [formData]);

  // Pre-fill companion from profile once
  useEffect(() => {
    if (user?.travel_companion && !formData.travel_companion) {
      setFormData(prev => ({ ...prev, travel_companion: user.travel_companion }));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const {name, value} = e.target;

    if (name === "min_rating") {
      if (parseFloat(value) > parseFloat(formData.max_rating)) {
        toast.dismiss();
        toast.error("Minimum rating cannot exceed maximum rating.");
        return;
      }
    }

    if (name === "max_rating") {
      if (parseFloat(value) < parseFloat(formData.min_rating)) {
        toast.dismiss();
        toast.error("Maximum rating cannot be less than minimum rating.");
        return;
      }
    }

    setFormData((prev) => ({...prev, [name]: value}));
  };

  const handleItineraryChange = (e) => {
    const value = e.target.value;
    setSelectedItineraryTitle(value);
    onItinerarySelect(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    // Manual input (optional)
    const manualList = formData.locations
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    // Prefer IDs if present, else fallback to readable names from selected itinerary
    const selectedNames =
      Array.isArray(selectedItinerary?.locations)
        ? selectedItinerary.locations.map((l) => l?.name).filter(Boolean)
        : [];

    const itineraryPayload =
      (Array.isArray(locationIds) && locationIds.length > 0)
        ? locationIds
        : selectedNames;

    // Combine both sources
    const allLocations = [...manualList, ...itineraryPayload].filter(Boolean);

    if (allLocations.length === 0) {
      toast.error("Please enter at least one location or select a saved itinerary.");
      return;
    }
    if (!formData.package) {
      toast.error("Please select a package type.");
      return;
    }
    if (!formData.total_days || Number(formData.total_days) < 1) {
      toast.error("Total days must be at least 1.");
      return;
    }
    if (!formData.travel_companion) {
      toast.error("Please select your travel companion.");
      return;
    }

    const rating_range = `${formData.min_rating}-${formData.max_rating}`;
    const finalData = {
      ...formData,
      locations: allLocations,
      total_days: Number(formData.total_days),
      rating_range,
      // for debugging/analytics downstream:
      itinerary_title: selectedItinerary?.title || null,
      used_location_ids: Array.isArray(locationIds) && locationIds.length > 0
    };

    setIsLoading(true);
    try {
      await onSubmit(finalData);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setSelectedItineraryTitle('');
    onItinerarySelect('');
    localStorage.removeItem("formData");
    toast.info("Form reset to defaults.");
  };

  const handleSample = () => {
    setFormData(sampleFormState);
    toast.success("Sample data added!");
  };

  const optionLabel = (it) => {
    const count = (it.locationIds?.length ?? 0) || (it.locations?.length ?? 0) || 0;
    const distance = it.totalDistance ? Number(it.totalDistance).toFixed(1) : null;
    return distance
      ? `${it.title} (${count} locations, ${distance} km)`
      : `${it.title} (${count} locations)`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">
        Plan Your Ideal Trip
      </h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        Fill in your trip preferences to receive optimized budget predictions tailored just for you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Saved Itinerary Selection */}
        <div className="md:col-span-2">
          <label htmlFor="savedItinerary" className="block text-sm font-semibold text-gray-700 mb-2">
            Select Saved Itinerary (Optional)
          </label>
          <select
            id="savedItinerary"
            value={selectedItineraryTitle}
            onChange={handleItineraryChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          >
            <option value="">Choose from saved itineraries</option>
            {availableItineraries.map((itinerary) => (
              <option key={itinerary.title} value={itinerary.title}>
                {optionLabel(itinerary)}
              </option>
            ))}
          </select>
          {availableItineraries.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No saved itineraries found. Create and save an itinerary first to use this feature.
            </p>
          )}
        </div>

        {/* Currently selected locations (IDs or names) */}
        {(Array.isArray(locationIds) && locationIds.length > 0) ? (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selected Itinerary Location IDs
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-2">
                {locationIds.length} location(s) from "{selectedItinerary?.title}"
              </p>
              <p className="text-xs font-mono text-gray-500 break-all">
                {locationIds.join(', ')}
              </p>
            </div>
          </div>
        ) : (Array.isArray(selectedItinerary?.locations) && selectedItinerary.locations.length > 0) ? (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selected Itinerary Locations
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-2">
                {selectedItinerary.locations.length} location(s) from "{selectedItinerary?.title}"
              </p>
              <p className="text-xs text-gray-600 break-words">
                {selectedItinerary.locations.map((l) => l.name).join(' • ')}
              </p>
            </div>
          </div>
        ) : null}

        {/* Package Type */}
        <div>
          <label htmlFor="package" className="block text-sm font-semibold text-gray-700 mb-1">
            Package Type
          </label>
          <select
            id="package"
            name="package"
            value={formData.package}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          >
            <option value="">Choose type</option>
            <option value="Basic">Basic</option>
            <option value="Moderate">Moderate</option>
            <option value="Premium">Premium</option>
          </select>
        </div>

        {/* Total Days */}
        <div>
          <label htmlFor="total_days" className="block text-sm font-semibold text-gray-700 mb-1">
            Total Days
          </label>
          <input
            type="number"
            id="total_days"
            name="total_days"
            min={1}
            value={formData.total_days}
            onChange={handleChange}
            required
            placeholder="E.g., 5"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Rating Range */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating Range
          </label>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Min: {formData.min_rating}</span>
            <span>Max: {formData.max_rating}</span>
          </div>
          <div className="flex gap-4">
            <input
              type="range"
              name="min_rating"
              min="1"
              max="5"
              step="0.1"
              value={formData.min_rating}
              onChange={handleChange}
              className="w-full accent-blue-500"
            />
            <input
              type="range"
              name="max_rating"
              min="1"
              max="5"
              step="0.1"
              value={formData.max_rating}
              onChange={handleChange}
              className="w-full accent-green-500"
            />
          </div>
        </div>

        {/* Travel Companion */}
        <div className="md:col-span-2">
          <label htmlFor="travel_companion" className="block text-sm font-semibold text-gray-700 mb-1">
            Travel Companion
          </label>

          {user?.travel_companion && (
            <p className="text-xs text-gray-500 mb-2">
              From profile: <span className="font-medium">{user.travel_companion}</span>
            </p>
          )}

          <select
            id="travel_companion"
            name="travel_companion"
            value={formData.travel_companion}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          >
            <option value="">Choose one</option>
            <option value="Solo">Solo</option>
            <option value="Couple">Couple</option>
            <option value="Family">Family</option>
            <option value="Friends">Friends</option>
          </select>
        </div>

        {/* Optional manual input (kept but hidden in UI by default)
            — you can uncomment if you want the manual field visible */}
        {/* <div className="md:col-span-2">
          <label htmlFor="locations" className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Locations (Optional)
          </label>
          <input
            type="text"
            id="locations"
            name="locations"
            value={formData.locations}
            onChange={handleChange}
            placeholder="e.g., LOC_1, LOC_2, or place names"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <p className="text-xs text-gray-400 mt-1">
            These will be combined with your selected itinerary.
          </p>
        </div> */}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 mt-8">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSample}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Fill Sample
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-gray-100 text-gray-700 border rounded-lg hover:bg-gray-200 transition"
          >
            Reset
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <ImSpinner2 className="animate-spin" />}
          Predict Budget
        </button>
      </div>
    </form>
  );
}
