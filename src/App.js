// src/App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import axios from 'axios';

import Login from './pages/Login';
import EditProfile from './pages/EditProfile';
import PsychologistDashboard from './pages/PsychologistDashboard';
import AppointmentDetail from './pages/AppointmentDetail';
import Report from './pages/Report';
import './App.css';
import ScrollToTop from './ScrollToTop';

const AppRoutes = () => {
  const location = useLocation();

  // Leer usuario desde localStorage.
  const [psicologo, setPsicologo] = useState(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });

  // Actualizar el estado cada vez que cambia la ruta.
  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    setPsicologo(stored ? JSON.parse(stored) : null);
  }, [location]);

  // Efecto para refrescar tokens automáticamente.
  useEffect(() => {
    const refreshTokens = async () => {
      const stored = localStorage.getItem('usuario');
      if (stored) {
        const storedUser = JSON.parse(stored);
        if (storedUser.refreshToken) {
          try {
            const res = await axios.post(
              `${process.env.REACT_APP_API_URL}/refresh-tokens`,
              { refreshToken: storedUser.refreshToken }
            );
            const updatedUser = {
              ...storedUser,
              calendarAccessToken: res.data.access_token,
              calendarTokenExpiry: res.data.expiry_date,
            };
            console.log("Token refrescado:", updatedUser.calendarAccessToken);
            localStorage.setItem('usuario', JSON.stringify(updatedUser));
            setPsicologo(updatedUser);
          } catch (error) {
            console.error("Error refreshing tokens:", error);
          }
        } else {
          console.warn("No refreshToken found for the user.");
        }
      }
    };

    // Llamada inmediata al montar la app.
    refreshTokens();
    // Establecer un intervalo para refrescar tokens cada 5 minutos.
    const intervalId = setInterval(refreshTokens, 1 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Routes>
      <Route path="/" element={psicologo ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route
        path="/dashboard"
        element={
          psicologo ? (
            <PsychologistDashboard psicologo={psicologo} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/appointment/:id"
        element={
          psicologo ? (
            <AppointmentDetail psicologo={psicologo} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/report"
        element={psicologo ? <Report psicologo={psicologo} /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
};

export default App;
