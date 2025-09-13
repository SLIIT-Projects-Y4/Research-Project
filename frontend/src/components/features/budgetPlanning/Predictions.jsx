import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ChatBot from "./ChatBot";

export default function Predictions({ data, onCloseAll, onPlanConfirmed }) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [show, setShow] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [confirmedPlanInfo, setConfirmedPlanInfo] = useState(null);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [errorConfirm, setErrorConfirm] = useState(null);
  const [chatBotManuallyClosed, setChatBotManuallyClosed] = useState(false);

  useEffect(() => {
    const savedPlan = localStorage.getItem("confirmedPlan");
    const hideChatBotFlag = localStorage.getItem("hideChatBot") === "true";
    setChatBotManuallyClosed(hideChatBotFlag);

    if (savedPlan) {
      setConfirmedPlanInfo(JSON.parse(savedPlan));
      setShowThankYou(true);
      if (!hideChatBotFlag) setShowChatBot(true);
      setShow(false);
    }
  }, []);

  if (!data || data.length === 0) return null;

  const isIntro = currentIndex === -1;
  const isLastPlan = currentIndex === data.length - 1;
  const prevIndex = currentIndex - 1;
  const nextIndex = currentIndex + 1;

  const goto = (index) => {
    if (index >= -1 && index < data.length) {
      setCurrentIndex(index);
      setShowThankYou(false);
      setSelectedIndex(null);
      setErrorConfirm(null);
      setShowChatBot(false);
      setShow(true);
      setChatBotManuallyClosed(false);
      localStorage.removeItem("hideChatBot");
    }
  };

  const handleClosePredictions = () => {
    setShow(false);
    setShowThankYou(true);
    setConfirmedPlanInfo(null);
    if (!chatBotManuallyClosed) {
      setShowChatBot(true);
    }
  };

  const handleConfirm = async () => {
    if (selectedIndex === null) return;
    setLoadingConfirm(true);
    setErrorConfirm(null);

    const packageIDs = data[selectedIndex].plan.map((pkg) => pkg.Package_ID);

    const payload = {
      plan_number: selectedIndex,
      package_ids: packageIDs,
      confirmed_at: new Date().toISOString(),
      full_plan: data[selectedIndex],
    };

    try {
      const res = await fetch("http://localhost:8000/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to confirm plan");
      }

      const responseData = await res.json();

      const confirmedData = {
        planNumber: selectedIndex + 1,
        packageIDs,
        confirmationId: responseData.id,
      };

      setConfirmedPlanInfo(confirmedData);
      localStorage.setItem("confirmedPlan", JSON.stringify(confirmedData));
      setShowThankYou(true);
      if (!chatBotManuallyClosed) setShowChatBot(true);
      setShow(false);

      if (typeof onPlanConfirmed === "function") {
        onPlanConfirmed();
      }
    } catch (err) {
      setErrorConfirm(err.message || "Network error");
    } finally {
      setLoadingConfirm(false);
    }
  };

  // Close thank you message
  const handleCloseThankYou = () => {
    setShowThankYou(false);
    setConfirmedPlanInfo(null);
    localStorage.removeItem("confirmedPlan");

    setShowChatBot(false);
    setChatBotManuallyClosed(true);
    localStorage.setItem("hideChatBot", "true");

    setTimeout(() => {
      onCloseAll();
    }, 0);
  };

  // Close chatbot
  const handleCloseChatBot = () => {
    setShowChatBot(false);
    setChatBotManuallyClosed(true);
    localStorage.setItem("hideChatBot", "true");
  };

  // Restart flow
  const handleRestart = () => {
    setCurrentIndex(-1);
    setShowThankYou(false);
    setSelectedIndex(null);
    setConfirmedPlanInfo(null);
    setErrorConfirm(null);
    setShow(true);
    setChatBotManuallyClosed(false);
    setShowChatBot(false);
    localStorage.removeItem("confirmedPlan");
    localStorage.removeItem("hideChatBot");
  };

  return (
    <>
      {showChatBot && (
        <ChatBot showChatBot={showChatBot} onClose={handleCloseChatBot} />
      )}

      {/* Main container */}
      <div className="relative flex flex-col items-center w-full max-w-6xl mx-auto py-6">
        {/* Thank You Card */}
        {showThankYou && (
          <ThankYouCard
            onClose={handleCloseThankYou}
            onRestart={handleRestart}
            confirmedPlanInfo={confirmedPlanInfo}
          />
        )}

        {/* Prediction cards */}
        {show && !showThankYou && (
          <>
            {!isIntro && (
              <button
                onClick={handleClosePredictions}
                className="absolute top-2 right-2 z-30 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md"
                aria-label="Close predictions"
              >
                <IoClose size={20} />
              </button>
            )}

            {/* Intro Card */}
            {isIntro && <IntroCard onStart={() => goto(0)} />}

            {!isIntro && (
              <>
                {/* Previous plan preview */}
                {prevIndex >= 0 && (
                  <div className="absolute left-8 transform -translate-x-full scale-90 opacity-50 w-1/3 transition-all duration-300">
                    <PlanCard
                      option={data[prevIndex]}
                      planNumber={prevIndex + 1}
                      isPeek
                    />
                  </div>
                )}

                {/* Current plan card */}
                <div className="z-20 w-2/3 transition-all duration-300">
                  <PlanCard
                    option={data[currentIndex]}
                    planNumber={currentIndex + 1}
                    isSelected={selectedIndex === currentIndex}
                    onSelect={() => setSelectedIndex(currentIndex)}
                  />
                </div>

                {/* Next plan preview */}
                {nextIndex < data.length && (
                  <div className="absolute right-8 transform translate-x-full scale-90 opacity-50 w-1/3 transition-all duration-300">
                    <PlanCard
                      option={data[nextIndex]}
                      planNumber={nextIndex + 1}
                      isPeek
                    />
                  </div>
                )}

                {/* Navigation buttons */}
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

                {/* Confirm/Cancel buttons when plan selected */}
                {selectedIndex !== null && (
                  <div className="mt-6 flex gap-4 justify-center z-40">
                    <button
                      onClick={handleConfirm}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow"
                      disabled={loadingConfirm}
                    >
                      {loadingConfirm ? "Confirming..." : "Confirm Plan"}
                    </button>
                    <button
                      onClick={() => setSelectedIndex(null)}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow"
                      disabled={loadingConfirm}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {errorConfirm && (
                  <p className="mt-4 text-red-600 font-semibold">{errorConfirm}</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

// Intro Card Component
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

// Thank You Card Component
function ThankYouCard({ onClose, onRestart, confirmedPlanInfo }) {
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
      <p className="text-lg mb-6 text-center">
        {confirmedPlanInfo ? (
          <>
            You have successfully selected <strong>Trip Plan {confirmedPlanInfo.planNumber}</strong>.
          </>
        ) : (
          <>
            We hope you found the perfect trip plan that fits your needs and budget.
            Feel free to explore again or modify your preferences.
          </>
        )}
      </p>
      {!confirmedPlanInfo && (
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
        >
          Start Over
        </button>
      )}
    </div>
  );
}

// Plan Card Component
function PlanCard({ option, planNumber, isPeek = false, isSelected = false, onSelect }) {
  const [expandedIndex, setExpandedIndex] = React.useState(null);

  React.useEffect(() => {
    setExpandedIndex(null);
  }, [planNumber]);

  const toggleExpand = (index, e) => {
    e.stopPropagation();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div
      onClick={!isSelected ? onSelect : undefined}
      className={`cursor-pointer relative transition-all duration-300 border-2 rounded-xl shadow-xl overflow-hidden ${isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
        } ${isPeek ? "scale-95 opacity-70" : "scale-100"}`}
    >
      <div className="bg-blue-600 text-white text-center py-2 text-xl font-semibold">
        ✨ Trip Plan {planNumber} ✨
      </div>

      <div className="p-4 space-y-4">
        {option.plan.map((pkg, idx) => (
          <div
            key={idx}
            className="bg-white border rounded-lg shadow-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-lg font-semibold text-blue-700">{`Sub Plan ${String(idx + 1).padStart(2, "0")}`}</h3>
              <div className="text-sm text-gray-600">
                {pkg.Days} days •{" "}
                <span className="text-yellow-600 font-semibold">{pkg.Avg_Rating}⭐</span> •{" "}
                <span className="text-green-700 font-bold">{pkg.Predicted_Budget} LKR</span>
              </div>
            </div>

            {expandedIndex === idx && (
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Package Type:</strong> {pkg.Package_Type}
                </p>
                <p>
                  <strong>Package ID:</strong> {pkg.Package_ID}
                </p>
                <p>
                  <strong>Accommodation:</strong> {pkg.Accommodation}
                </p>
                <p>
                  <strong>Food & Transport:</strong> {pkg["Food & Transport"]}
                </p>
                <p>
                  <strong>Activities:</strong>
                </p>
                <ul className="list-disc list-inside ml-4">
                  {pkg.Activities.map((activity, i) => (
                    <li key={i}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-right mt-2">
              <button
                onClick={(e) => toggleExpand(idx, e)}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {expandedIndex === idx ? "View Less" : "View More"}
              </button>
            </div>
          </div>
        ))}
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
          <span className="text-green-700 font-semibold">{option.total_budget.toFixed(2)} LKR</span>
        </p>
      </div>
    </div>
  );
}

