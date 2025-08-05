import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BudgetPlanningPage from './pages/BudgetPlanningPage.jsx';
import ConfirmedPlansPage from './pages/ConfirmedPlansPage.jsx';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/budget-planning" element={<BudgetPlanningPage />} />
          <Route path="/confirmed-plans" element={<ConfirmedPlansPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
