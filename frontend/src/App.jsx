import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PreferencesWizard from './pages/Onboarding/PreferencesWizard.jsx';
import HomePage from './pages/HomePage.jsx';
import PlanPoolPage from "./pages/PlanPoolPage.jsx";
import PlanBuilder from "./pages/PlanBuilder.jsx";
import PlanItinerary from "./pages/PlanItinerary.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<PreferencesWizard />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/plan-pool" element={<PlanPoolPage />} />
        <Route path="/plan/build" element={<PlanBuilder />} />
        <Route path="/plan/itinerary" element={<PlanItinerary />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
