import React, { useState, useEffect } from 'react';
import BudgetForm from '../components/BudgetForm';
import Predictions from '../components/Predictions';
import { postPrediction } from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';

export default function Home() {
  // Restore predictions from localStorage
  const [predictions, setPredictions] = useState(() => {
    const saved = localStorage.getItem("predictions");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);

  // Save or remove predictions from localStorage
  useEffect(() => {
    if (predictions) {
      localStorage.setItem("predictions", JSON.stringify(predictions));
    } else {
      localStorage.removeItem("predictions");
    }
  }, [predictions]);

  // Submit form and get predictions from backend
  const handleSubmit = async (formData) => {
    setLoading(true);
    setPredictions(null);
    try {
      const response = await postPrediction(formData);
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        setPredictions(response.data.combinations);
        toast.success("Prediction successful!");
      }
    } catch (error) {
      toast.error("Prediction failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Show predictions in a card, allow hiding
  function PredictionsWrapper({ data }) {
    const [showPredictions, setShowPredictions] = useState(true);

    const handleHide = () => {
      setShowPredictions(false);
      setPredictions(null);
    };

    if (!showPredictions) return null;

    return (
      <div className="bg-white rounded-3xl shadow-xl p-10 sm:p-14 animate-fadeIn">
        <Predictions data={data} onCloseAll={handleHide} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 text-gray-800">
      <main className="flex-grow flex flex-col items-center px-6 sm:px-10 lg:px-16 pt-20">
        <div className="w-full max-w-6xl">
          <h1 className="text-center text-5xl sm:text-6xl font-bold leading-tight text-gray-800 tracking-tight mb-14">
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Smart Trip Budget Prediction
            </span>
          </h1>

          {/* Budget Form Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 sm:p-14 mb-14 border border-gray-100">
            <BudgetForm onSubmit={handleSubmit} />
          </div>

          {/* Loading Text */}
          {loading && (
            <p className="text-center text-indigo-600 text-lg font-medium animate-pulse mb-8">
              Generating travel cost predictions...
            </p>
          )}

          {/* Show Predictions if available */}
          {predictions && predictions.length > 0 && (
            <PredictionsWrapper data={predictions} />
          )}
        </div>

        <ToastContainer position="bottom-right" autoClose={1000} hideProgressBar />
      </main>

      {/* Premium Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 text-sm sm:text-base">
        <div className="max-w-6xl mx-auto px-6 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center text-gray-600">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">TravelMate</h3>
            <p className="text-gray-500 leading-relaxed">
              Empowering smarter journeys by predicting and optimizing your travel budgets with ease.
              Travel wisely, explore freely.
            </p>
          </div>

          <div className="flex flex-col sm:items-end space-y-2">
            <p>Crafted with precision for global travelers</p>
            <p>&copy; {new Date().getFullYear()} TravelMate. All rights reserved.</p>
            <div className="flex gap-4 mt-2">
              <a href="#" className="hover:text-indigo-600 transition-colors duration-200">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors duration-200">Terms</a>
              <a href="#" className="hover:text-indigo-600 transition-colors duration-200">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


