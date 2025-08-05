import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetForm from '../components/BudgetForm';
import Predictions from '../components/Predictions';
import ChatBot from '../components/ChatBot';
import { postPrediction, getConfirmedPlans } from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';

export default function Home() {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState(() => {
    const saved = localStorage.getItem("predictions");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [hasConfirmedPlans, setHasConfirmedPlans] = useState(false);
  const [chatManuallyClosed, setChatManuallyClosed] = useState(() => {
    return localStorage.getItem("hideChatBot") === "true";
  });

  useEffect(() => {
    async function fetchConfirmedPlans() {
      try {
        const response = await getConfirmedPlans();
        const plans = response?.data?.confirmed_plans || [];
        setHasConfirmedPlans(plans.length > 0);
      } catch (err) {
        console.error("Error fetching confirmed plans:", err);
      }
    }
    fetchConfirmedPlans();
  }, []);

  useEffect(() => {
    if (predictions) {
      localStorage.setItem("predictions", JSON.stringify(predictions));
    } else {
      localStorage.removeItem("predictions");
    }
  }, [predictions]);

  // Submit form
  const handleSubmit = async (formData) => {
    setLoading(true);
    setPredictions(null);
    setChatVisible(false);

    try {
      const response = await postPrediction(formData);
      if (response.data?.error) {
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

  const handleCloseChatBot = () => {
    setChatVisible(false);
    setChatManuallyClosed(true);
    localStorage.setItem("hideChatBot", "true");
  };

  const handlePlanConfirmed = async () => {
    try {
      const response = await getConfirmedPlans();
      const plans = response?.data?.confirmed_plans || [];
      setHasConfirmedPlans(plans.length > 0);
    } catch (err) {
      console.error("Error fetching confirmed plans after confirmation:", err);
      setHasConfirmedPlans(true);
    }
  };

  const PredictionsWrapper = ({ data }) => {
    const [showPredictions, setShowPredictions] = useState(true);

    const handleClosePredictions = () => {
      setShowPredictions(false);
      setPredictions(null);
      if (!chatManuallyClosed) {
        setChatVisible(true);
      }
    };

    if (!showPredictions) return null;

    return (
      <div className="bg-white rounded-3xl shadow-xl p-10 sm:p-14 animate-fadeIn">
        <Predictions
          data={data}
          onCloseAll={handleClosePredictions}
          onPlanConfirmed={handlePlanConfirmed}
        />
      </div>
    );
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 text-gray-800">
      <main className="flex-grow flex flex-col items-center px-6 sm:px-10 lg:px-16 pt-20">
        <div className="w-full max-w-6xl">
          <h1 className="text-center text-5xl sm:text-6xl font-bold leading-tight text-gray-800 tracking-tight mb-14">
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Smart Trip Budget Prediction
            </span>
          </h1>

          <div className="bg-white rounded-3xl shadow-2xl p-10 sm:p-14 mb-14 border border-gray-100">
            <BudgetForm onSubmit={handleSubmit} />
          </div>

          {loading && (
            <p className="text-center text-indigo-600 text-lg font-medium animate-pulse mb-8">
              Generating travel cost predictions...
            </p>
          )}

          {predictions && predictions.length > 0 && (
            <PredictionsWrapper data={predictions} />
          )}

          {hasConfirmedPlans && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate("/confirmed-plans")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
              >
                View Confirmed Plans
              </button>
            </div>
          )}
        </div>

        <ToastContainer position="bottom-right" autoClose={1000} hideProgressBar />

      </main>

      {chatVisible && (
        <ChatBot
          showChatBot={chatVisible}
          onClose={handleCloseChatBot}
        />
      )}
    </div>
  );
}








