import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const steps = ["Account", "Demographics", "Preferences", "Review"];

const toggleItem = (list, value) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    age_group: "",
    gender: "",
    travel_companion: "",
    location_types: [],
    preferred_activities: [],
    budget: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((v) => v !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: toggleItem(prev[field], value),
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      const { name, email, password } = formData;
      if (!name || !email || !password) {
        alert("Please fill in all fields: Name, Email, and Password.");
        return false;
      }
    } else if (step === 2) {
      const { country, age_group, gender } = formData;
      if (!country || !age_group || !gender || !formData.travel_companion) {
        alert("Please complete all demographic fields.");
        return false;
      }
    } else if (step === 3) {
      if (formData.preferred_activities.length < 3) {
        alert("Please select at least 3 preferred activities.");
        return false;
      }
      if (!formData.budget) {
        alert("Please select your Budget.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Registered successfully!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); 
        navigate("/dashboard"); // 🚀 Navigate to home on success
      } else {
        alert(data.error || "Registration failed.");
      }
    } catch {
      alert("Registration failed");
    }
  };

  const locationOptions = ["Beach", "Mountain", "City", "Countryside"];
  const activityOptions = [
    "Swimming",
    "Hiking",
    "Shopping",
    "Photography",
    "Nature",
    "Museums",
  ];
  const budgetOptions = ["Low", "Medium", "High"];

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto my-12 p-8 bg-white shadow-xl rounded-lg border space-y-6"
    >
      <h2 className="text-3xl font-semibold text-center">
        Sign Up – {steps[step - 1]}
      </h2>

      {/* Step 1: Account Info */}
      {step === 1 && (
        <>
          <input
            name="name"
            placeholder="Full Name"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <p className="text-sm text-center text-gray-600 mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login here
            </a>
          </p>
        </>
      )}

      {/* Step 2: Demographics */}
      {step === 2 && (
        <>
          <select
            name="country"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={formData.country}
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            <option>India</option>
            <option>USA</option>
            <option>Japan</option>
            <option>France</option>
          </select>

          <select
            name="gender"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <select
            name="age_group"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={formData.age_group}
            onChange={handleChange}
            required
          >
            <option value="">Age Group</option>
            <option value="18-25">18–25</option>
            <option value="26-35">26–35</option>
            <option value="36-50">36–50</option>
            <option value="50+">50+</option>
          </select>

          <div>
            <label className="block font-medium mt-4 mb-2">
              Travel Companion
            </label>
            <div className="flex flex-wrap gap-4">
              {["Solo", "Couple", "Family", "Friends"].map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="travel_companion"
                    value={type}
                    checked={formData.travel_companion === type}
                    onChange={handleChange}
                    required
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <>
          <div>
            <label className="block font-medium mb-2">
              Preferred Locations
            </label>
            <div className="flex flex-wrap gap-2">
              {locationOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToggle("location_types", type)}
                  className={`px-4 py-2 rounded border ${
                    formData.location_types.includes(type)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium mt-4 mb-2">
              Preferred Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => handleToggle("preferred_activities", act)}
                  className={`px-4 py-2 rounded border ${
                    formData.preferred_activities.includes(act)
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select at least 3 activities
            </p>
          </div>

          <div>
            <label className="block font-medium mt-4 mb-2">Budget</label>
            <div className="flex gap-4">
              {budgetOptions.map((b) => (
                <label key={b} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="budget"
                    value={b}
                    checked={formData.budget === b}
                    onChange={handleChange}
                    required
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 4: Final Review */}
      {step === 4 && (
        <div className="space-y-2 text-sm">
          <p>
            <strong>Name:</strong> {formData.name}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          <p>
            <strong>Country:</strong> {formData.country}
          </p>
          <p>
            <strong>Age Group:</strong> {formData.age_group}
          </p>
          <p>
            <strong>Gender:</strong> {formData.gender}
          </p>
          <p>
            <strong>Travel Companion:</strong> {formData.travel_companion}
          </p>
          <p>
            <strong>Locations:</strong> {formData.location_types.join(", ")}
          </p>
          <p>
            <strong>Activities:</strong>{" "}
            {formData.preferred_activities.join(", ")}
          </p>
          <p>
            <strong>Budget:</strong> {formData.budget}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            ⬅ Back
          </button>
        )}
        {step < 4 && (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Next ➜
          </button>
        )}
        {step === 4 && (
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit ✅
          </button>
        )}
      </div>
    </form>
  );
};

export default Register;
