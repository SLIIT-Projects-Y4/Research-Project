import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ImSpinner2 } from "react-icons/im";
import "react-toastify/dist/ReactToastify.css";

const initialFormState = {
  locations: "",
  package: "",
  total_days: "",
  min_rating: "1.5",
  max_rating: "4.0",
  travel_companion: "",
};

const sampleFormState = {
  locations: "LOC_11, LOC_42, LOC_67",
  package: "Moderate",
  total_days: 5,
  min_rating: "3.0",
  max_rating: "5.0",
  travel_companion: "Family",
};

export default function BudgetForm({ onSubmit }) {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("formData");
    return saved ? JSON.parse(saved) : initialFormState;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    toast.dismiss();

    const locationsArray = formData.locations
      .split(",")
      .map((loc) => loc.trim())
      .filter(Boolean);

    if (locationsArray.length === 0) {
      toast.error("Please enter at least one location.");
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
      locations: locationsArray,
      total_days: Number(formData.total_days),
      rating_range,
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
    localStorage.removeItem("formData");
    toast.info("Form reset to defaults.");
  };

  const handleSample = () => {
    setFormData(sampleFormState);
    toast.success("Sample data added!");
  };

  return (
    <form
      onSubmit={handleSubmit}
    >
      <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">
        Plan Your Ideal Trip
      </h2>
      <p className="text-center text-sm text-gray-500">
        Fill in your trip preferences to receive optimized budget predictions tailored just for you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Location Input */}
        <div className="md:col-span-2">
          <label htmlFor="locations" className="block text-sm font-semibold text-gray-700 mb-1">
            Locations
          </label>
          <input
            type="text"
            id="locations"
            name="locations"
            value={formData.locations}
            onChange={handleChange}
            placeholder="E.g., LOC_11, LOC_42, LOC_17"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <p className="text-xs text-gray-400 mt-1">Use location IDs, separated by commas.</p>
        </div>

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
      </div>

      {/* <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Travel Companion
          </label>
          <div className="flex flex-wrap justify-between gap-4">
            {["Solo", "Couple", "Family", "Friends"].map((option) => (
              <div
                key={option}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, travel_companion: option }))
                }
                className={`flex items-center justify-center flex-grow px-6 py-3 rounded-xl cursor-pointer text-sm transition text-center border select-none
          ${formData.travel_companion === option
                    ? "bg-blue-100 border-blue-500 text-blue-700 font-medium"
                    : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
                  }`}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      </div> */}


      {/* Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
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

