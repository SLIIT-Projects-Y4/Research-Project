import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {Layout} from './components/common/Layout.jsx';
import {LandingPage} from './pages/LandingPage.jsx';
import LoginPage from "./pages/LoginPage.jsx";
import TestingPage from "./pages/TestingPage.jsx";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/test" element={<TestingPage/>}/>
      </Routes>
    </Layout>
  );
}

export default App;
