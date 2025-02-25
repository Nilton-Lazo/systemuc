// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import EditProfile from './pages/EditProfile';
import PsychologistDashboard from './pages/PsychologistDashboard';
import AppointmentDetail from './pages/AppointmentDetail';
import './App.css';

const App = () => {
  const [psicologo, setPsicologo] = useState(null);

  // Al iniciar, lee el usuario almacenado en localStorage (lo que guardaste en Login.js)
  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      setPsicologo(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        {/* Si aún no se obtuvo el psicólogo, muestra un mensaje de carga */}
        <Route
          path="/dashboard"
          element={psicologo ? <PsychologistDashboard psicologo={psicologo} /> : <div>Cargando...</div>}
        />
        <Route
          path="/appointment/:id"
          element={psicologo ? <AppointmentDetail psicologo={psicologo} /> : <div>Cargando...</div>}
        />
      </Routes>
    </Router>
  );
};

export default App;

