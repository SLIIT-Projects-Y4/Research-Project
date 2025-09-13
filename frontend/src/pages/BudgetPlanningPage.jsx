import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BudgetForm from '../components/features/budgetPlanning/BudgetForm';
import Predictions from '../components/features/budgetPlanning/Predictions';
import ChatBot from '../components/features/budgetPlanning/ChatBot';
import { postPrediction, getConfirmedPlans } from '../api/budgetPlanningAPI/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';

// Utility functions for localStorage management (matching PlanItinerary.jsx)
const getSavedItineraries = () => {
  try {
    const saved = localStorage.getItem('savedItineraries');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const getLocationIdsByTitle = (title) => {
  const savedItineraries = getSavedItineraries();
  return savedItineraries[title]?.locationIds || [];
};

const getAllSavedTitles = () => {
  const savedItineraries = getSavedItineraries();
  return Object.keys(savedItineraries);
};

const getItineraryDetails = (title) => {
  const savedItineraries = getSavedItineraries();
  return savedItineraries[title] || null;
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Updated state for handling itinerary data
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [locationIds, setLocationIds] = useState([]);
  const [availableItineraries, setAvailableItineraries] = useState([]);
  const [pendingItineraryTitle, setPendingItineraryTitle] = useState(null);

  // Load available itineraries first
  useEffect(() => {
    const loadAvailableItineraries = () => {
      const savedTitles = getAllSavedTitles();
      const itinerariesWithDetails = savedTitles.map(title => {
        const details = getItineraryDetails(title);
        return {
          title,
          locationIds: details.locationIds || [],
          totalDistance: details.totalDistance,
          attractionsCount: details.attractionsCount,
          savedAt: details.savedAt
        };
      });
      setAvailableItineraries(itinerariesWithDetails);
      return itinerariesWithDetails;
    };

    const itineraries = loadAvailableItineraries();

    // Handle navigation state or session storage data
    let locationData = null;

    if (location.state) {
      locationData = location.state;
    } else {
      try {
        const stored = sessionStorage.getItem('budgetPlanningData');
        if (stored) {
          locationData = JSON.parse(stored);
          // Clear session storage after reading
          sessionStorage.removeItem('budgetPlanningData');
        }
      } catch (error) {
        console.error('Error reading budget planning data:', error);
      }
    }

    if (locationData) {
      // Handle the new structure with location IDs
      if (locationData.locationIds && Array.isArray(locationData.locationIds)) {
        const itineraryTitle = locationData.itineraryTitle;

        // Check if the itinerary exists in available itineraries
        const existingItinerary = itineraries.find(it => it.title === itineraryTitle);

        if (existingItinerary) {
          // Use existing itinerary data (most up-to-date)
          setLocationIds(existingItinerary.locationIds);
          setSelectedItinerary(existingItinerary);
          toast.success(`Loaded ${existingItinerary.locationIds.length} location IDs from "${existingItinerary.title}"`);
        } else {
          // Fall back to navigation data if itinerary not found in storage
          setLocationIds(locationData.locationIds);
          setSelectedItinerary({
            title: locationData.itineraryTitle,
            locationIds: locationData.locationIds,
            totalDistance: locationData.totalDistance,
            attractionsCount: locationData.attractionsCount
          });
          setPendingItineraryTitle(locationData.itineraryTitle);
          toast.success(`Loaded ${locationData.locationIds.length} location IDs from "${locationData.itineraryTitle}"`);
        }
      }
      // Fallback for the old structure
      else if (locationData.locations && Array.isArray(locationData.locations)) {
        setSelectedItinerary({
          title: locationData.itineraryTitle,
          locations: locationData.locations,
          totalDistance: locationData.totalDistance
        });
        setPendingItineraryTitle(locationData.itineraryTitle);
        toast.success(`Loaded ${locationData.locations.length} locations from "${locationData.itineraryTitle}"`);
      }
    }
  }, [location.state]);

  // Handle pending itinerary selection once availableItineraries is loaded
  useEffect(() => {
    if (pendingItineraryTitle && availableItineraries.length > 0) {
      const foundItinerary = availableItineraries.find(it => it.title === pendingItineraryTitle);
      if (foundItinerary && !selectedItinerary) {
        setSelectedItinerary(foundItinerary);
        setLocationIds(foundItinerary.locationIds);
        setPendingItineraryTitle(null);
      }
    }
  }, [availableItineraries, pendingItineraryTitle, selectedItinerary]);

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

  // Handle itinerary selection from dropdown
  const handleItinerarySelection = (itineraryTitle) => {
    if (!itineraryTitle) {
      setSelectedItinerary(null);
      setLocationIds([]);
      setPendingItineraryTitle(null);
      return;
    }

    const details = getItineraryDetails(itineraryTitle);
    if (details && details.locationIds) {
      const itineraryData = {
        title: itineraryTitle,
        locationIds: details.locationIds,
        totalDistance: details.totalDistance,
        attractionsCount: details.attractionsCount,
        savedAt: details.savedAt
      };

      setLocationIds(details.locationIds);
      setSelectedItinerary(itineraryData);
      setPendingItineraryTitle(null);

      toast.success(`Selected itinerary: ${itineraryTitle} (${details.locationIds.length} locations)`);
    } else {
      // If details not found, set pending title for later resolution
      setPendingItineraryTitle(itineraryTitle);
      toast.info(`Looking for itinerary: ${itineraryTitle}...`);
    }
  };

  // Submit form
  const handleSubmit = async (formData) => {
    setLoading(true);
    setPredictions(null);
    setChatVisible(false);

    try {
      // Include location IDs in the form data if available
      const enhancedFormData = {
        ...formData,
        ...(locationIds.length > 0 && { locationIds })
      };

      const response = await postPrediction(enhancedFormData);
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

  const handleClearItineraryData = () => {
    setSelectedItinerary(null);
    setLocationIds([]);
    setPendingItineraryTitle(null);
    toast.info("Cleared itinerary selection");
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

          {/* Show selected itinerary info */}
          {selectedItinerary && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-green-800 mb-1">
                    Planning Budget for: {selectedItinerary.title}
                  </h2>
                  <div className="text-green-600 text-sm space-y-1">
                    <p>{selectedItinerary.locationIds?.length || 0} location IDs loaded</p>
                    {selectedItinerary.totalDistance && (
                      <p>Total Distance: {selectedItinerary.totalDistance.toFixed(1)} km</p>
                    )}
                    {selectedItinerary.attractionsCount && (
                      <p>Attractions: {selectedItinerary.attractionsCount}</p>
                    )}
                    {selectedItinerary.savedAt && (
                      <p>Saved: {new Date(selectedItinerary.savedAt).toLocaleDateString()}</p>
                    )}
                    {selectedItinerary.locationIds?.length > 0 && (
                      <p className="font-mono text-xs bg-green-100 p-2 rounded mt-2">
                        IDs: {selectedItinerary.locationIds.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClearItineraryData}
                  className="text-green-600 hover:text-green-800 text-sm underline"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Show pending itinerary loading state */}
          {pendingItineraryTitle && !selectedItinerary && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <p className="text-yellow-800">Loading itinerary: {pendingItineraryTitle}...</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl p-10 sm:p-14 mb-14 border border-gray-100">
            <BudgetForm
              onSubmit={handleSubmit}
              selectedItinerary={selectedItinerary}
              locationIds={locationIds}
              availableItineraries={availableItineraries}
              onItinerarySelect={handleItinerarySelection}
            />
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