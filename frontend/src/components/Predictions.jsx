import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Predictions({ data, onCloseAll }) {
  const [currentIndex, setCurrentIndex] = useState(-1); // intro screen
  const [show, setShow] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);

  if (!data || data.length === 0 || !show) return null;

  const isIntro = currentIndex === -1;
  const isLastPlan = currentIndex === data.length - 1;

  const prevIndex = currentIndex - 1;
  const nextIndex = currentIndex + 1;

  const goto = (index) => {
    if (index >= -1 && index < data.length) {
      setCurrentIndex(index);
      setShowThankYou(false);
    }
  };

  const handleCloseOnLastPlan = () => {
    setShowThankYou(true);
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
    setTimeout(() => {
      onCloseAll();
    }, 0);
  };

  const handleRestart = () => {
    setCurrentIndex(-1);
    setShowThankYou(false);
  };

  return (
    <div className="relative flex justify-center items-center w-full max-w-6xl mx-auto py-6">
      {/* Thank You Card */}
      {showThankYou && (
        <ThankYouCard onClose={handleCloseThankYou} onRestart={handleRestart} />
      )}

      {!showThankYou && (
        <>
          {!isIntro && (
            <button
              onClick={handleCloseOnLastPlan}
              className="absolute top-2 right-2 z-30 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md"
              aria-label="Close predictions"
            >
              <IoClose size={20} />
            </button>
          )}

          {/* Intro Card */}
          {isIntro && <IntroCard onStart={() => goto(0)} />}

          {/* Trip Plan Cards */}
          {!isIntro && (
            <>
              {/* Previous Peek */}
              {prevIndex >= 0 && (
                <div className="absolute left-8 transform -translate-x-full scale-90 opacity-50 w-1/3 transition-all duration-300">
                  <PlanCard option={data[prevIndex]} planNumber={prevIndex + 1} isPeek />
                </div>
              )}

              {/* Active Card */}
              <div className="z-20 w-2/3 transition-all duration-300">
                <PlanCard option={data[currentIndex]} planNumber={currentIndex + 1} />
              </div>

              {/* Next Peek */}
              {nextIndex < data.length && (
                <div className="absolute right-8 transform translate-x-full scale-90 opacity-50 w-1/3 transition-all duration-300">
                  <PlanCard option={data[nextIndex]} planNumber={nextIndex + 1} isPeek />
                </div>
              )}

              {/* Arrows */}
              <button
                onClick={() => goto(prevIndex)}
                disabled={prevIndex < 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full shadow-md ${prevIndex < 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                aria-label="Previous plan"
              >
                <FaChevronLeft size={20} />
              </button>

              {/* Disabled arrow on last plan */}
              <button
                onClick={() => goto(nextIndex)}
                disabled={isLastPlan}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full shadow-md ${isLastPlan
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                aria-label="Next plan"
              >
                <FaChevronRight size={20} />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Intro Card
function IntroCard({ onStart }) {
  return (
    <div className="w-full max-w-2xl text-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-2xl px-10 py-12">
      <h2 className="text-3xl font-bold mb-4">✨ Explore Your Personalized Trip Plans!</h2>
      <p className="text-lg mb-6">
        Swipe through handpicked travel plans based on your preferences.
        Each card shows detailed packages, ratings, and predicted budgets.
      </p>
      <p className="text-md mb-8">Use the arrows to switch between options ➡️</p>
      <button
        onClick={onStart}
        className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
      >
        Show My First Plan
      </button>
    </div>
  );
}

// Thank You Card
function ThankYouCard({ onClose, onRestart }) {
  return (
    <div className="w-full max-w-2xl text-center bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-2xl shadow-2xl px-10 py-12 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md"
        aria-label="Close thank you message"
      >
        <IoClose size={20} />
      </button>
      <h2 className="text-3xl font-bold mb-4">🎉 Thank You for Exploring!</h2>
      <p className="text-lg mb-6">
        We hope you found the perfect trip plan that fits your needs and budget.
        Feel free to explore again or modify your preferences.
      </p>
      <button
        onClick={onRestart}
        className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
      >
        Start Over
      </button>
    </div>
  );
}

// Plan Card
function PlanCard({ option, planNumber, isPeek = false }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden ${isPeek ? "scale-95" : "scale-100"
        }`}
    >
      <div className="bg-blue-600 text-white text-center py-2 text-xl font-semibold">
        ✨ Trip Plan {planNumber} ✨
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-100 font-semibold">
            <tr>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Package ID</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Accommodation</th>
              <th className="px-3 py-2">Food & Transport</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Activities</th>
              <th className="px-3 py-2">Budget</th>
            </tr>
          </thead>
          <tbody>
            {option.plan.map((pkg, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{pkg.Location}</td>
                <td className="px-3 py-2">{pkg.Package_ID}</td>
                <td className="px-3 py-2">{pkg.Package_Type}</td>
                <td className="px-3 py-2">{pkg.Days}</td>
                <td className="px-3 py-2">{pkg.Accommodation}</td>
                <td className="px-3 py-2">{pkg["Food & Transport"]}</td>
                <td className="px-3 py-2">{pkg.Avg_Rating}</td>
                <td className="px-3 py-2">
                  <ul className="list-disc ml-4">
                    {pkg.Activities.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-2 font-semibold">{pkg.Predicted_Budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-4 text-sm border-t text-gray-800 font-medium space-y-1">
        <p>
          👨‍👩‍👧‍👦 Travel Companion:{" "}
          <span className="text-blue-600 font-semibold">{option.travel_companion}</span>
        </p>
        <p>
          🕒 Total Days:{" "}
          <span className="text-blue-600 font-semibold">{option.total_days} days</span>
        </p>
        <p>
          💰 Total Budget:{" "}
          <span className="text-green-700 font-semibold">
            {option.total_budget.toFixed(2)} LKR
          </span>
        </p>
      </div>
    </div>
  );
}