import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {Layout} from './components/common/Layout.jsx';
import {LandingPage} from './pages/LandingPage.jsx';
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RecommendPage from "./pages/RecommandPage.jsx";
import ChatPage from './pages/ChatPage.jsx';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/explore-groups" element={<RecommendPage/>}/>
        <Route path="/chat" element={<ChatPage/>}/>
        {/* Add more routes as needed */}
      </Routes>
      <ToastContainer position="top-right" autoClose={3500} theme="light" />
    </Layout>
  );
}

export default App;
