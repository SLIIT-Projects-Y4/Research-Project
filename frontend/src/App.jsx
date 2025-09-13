import React from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PreferencesWizard from './pages/Onboarding/PreferencesWizard.jsx';
import HomePage from './pages/HomePage.jsx';
import PlanPoolPage from "./pages/PlanPoolPage.jsx";
import PlanBuilder from "./pages/PlanBuilder.jsx";
import PlanItinerary from "./pages/PlanItinerary.jsx";
import SavedItineraries from "@/pages/SavedItineraries.jsx";
import {Layout} from "@/components/common/Layout.jsx";
import LocationPage from "@/pages/LocationPage.jsx";
import PlanCreatePage from "@/pages/CreatePlanPage.jsx";
import BudgetPlanningPage from './pages/BudgetPlanningPage.jsx';
import ConfirmedPlansPage from './pages/ConfirmedPlansPage.jsx';
import PlanDetails from "@/pages/PlanDetails.jsx";
import ChatPage from "@/pages/ChatPage.jsx";
import RecommendPage from "@/pages/RecommandPage.jsx";

export default function App() {
    return (
      <Layout>
          <Routes>
              <Route path="/" element={<Navigate to="/login" replace/>}/>
              <Route path="/register" element={<RegisterPage/>}/>
              <Route path="/login" element={<LoginPage/>}/>

              <Route element={<ProtectedRoute/>}>
                  <Route path="/onboarding" element={<PreferencesWizard/>}/>
                  <Route path="/home" element={<HomePage/>}/>
                  <Route path="/plan-pool" element={<PlanPoolPage/>}/>
                  <Route path="/plan/build" element={<PlanBuilder/>}/>
                  <Route path="/plan/itinerary" element={<PlanItinerary/>}/>
                  <Route path="/plan/saved" element={<SavedItineraries/>}/>
                  <Route path="/locations/:id" element={<LocationPage/>}/>
                  <Route path="/plan/create" element={<PlanCreatePage/>}/>
                  <Route path="/budget-planning" element={<BudgetPlanningPage/>}/>
                  <Route path="/confirmed-plans" element={<ConfirmedPlansPage/>}/>
                  <Route path="/plan/details" element={<PlanDetails/>}/>
                  <Route path="/explore-groups" element={<RecommendPage/>}/>
                  <Route path="/chat" element={<ChatPage/>}/>

              </Route>

              <Route path="*" element={<Navigate to="/home" replace/>}/>
          </Routes>
      </Layout>
    );
}
