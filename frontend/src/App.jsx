import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {Layout} from './components/common/Layout.jsx';
import {LandingPage} from './pages/LandingPage.jsx';
import LoginPage from "./pages/LoginPage.jsx";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
      </Routes>
    </Layout>
  );
}

export default App;
