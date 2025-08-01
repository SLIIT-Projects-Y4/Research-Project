import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RegisterPage from './userpage/Register';;
import LoginPage from './userpage/Login';
import Dashboard from "./userpage/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/dashboard' element={<Dashboard />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}
