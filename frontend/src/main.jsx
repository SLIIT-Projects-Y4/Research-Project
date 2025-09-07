import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider } from './store/auth.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      <AuthProvider>
        <BrowserRouter>
          <App />
          <ToastContainer position="top-right" autoClose={3000} newestOnTop />
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>
);
