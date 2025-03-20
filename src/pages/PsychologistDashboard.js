// src/pages/PsychologistDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaClock } from 'react-icons/fa';
import Header from '../components/layout/Header';
import '../assets/styles/PsychologistDashboard.css';

const stateMapping = {
  pendiente: 'PENDIENTE',
  atendida: 'ATENDIDA',
  no_asistio: 'NO ASISTIÓ',
  cancelada: 'CANCELADA',
  reprogramada: 'REPROGRAMADA'
};

const PsychologistDashboard = ({ psicologo }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const navigate = useNavigate();

  const convertToLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateSpanish = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('es-ES', { ...options, timeZone: 'UTC' });
  };

  const fetchCitas = useCallback(async (date) => {
    const fechaStr = convertToLocalDateString(date);
    try {
      const response = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/citas`, {
        params: {
          psicologoId: psicologo.id,
          fecha: fechaStr,
        },
      });
      setCitas(response.data.citas);
    } catch (error) {
      console.error("Error fetching citas:", error);
    }
  }, [psicologo.id]);

  useEffect(() => {
    fetchCitas(selectedDate);
    const interval = setInterval(() => {
      fetchCitas(selectedDate);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDate, fetchCitas]);

  const handleCardClick = (cita) => {
    navigate(`/appointment/${cita.id}`);
  };

  return (
    <>
      <Header psicologo={psicologo} />
      <div className="dashboard-container">
        <h2 className="dashboard-title">Panel de Psicólogo</h2>
        <div className="dashboard-content">
          <div className="calendar-column">
            <Calendar 
              onChange={setSelectedDate} 
              value={selectedDate} 
              className="custom-calendar"
            />
          </div>
          <div className="appointments-column">
            <h3 className="appointments-title">
              Citas para el día {formatDateSpanish(selectedDate)}
            </h3>
            {citas.filter(cita => cita.estado === 'pendiente').length === 0 ? (
              <p className="no-citas">No hay citas pendientes para este día.</p>
            ) : (
              <div className="citas-grid">
                {citas.filter(cita => cita.estado === 'pendiente').map(cita => (
                  <div 
                    key={cita.id} 
                    className={`cita-card ${cita.estado}`} 
                    onClick={() => handleCardClick(cita)}
                  >
                    <div className="cita-card-header">
                      <div className="hora-text">
                        <span className="label">Hora:</span>
                        <span className="time">{cita.hora}</span>
                      </div>
                      <div className="icon-container">
                        <FaClock />
                      </div>
                    </div>
                    <p className="cita-estudiante">
                      <strong>Estudiante:</strong> {cita.estudiante.nombre}
                    </p>
                    <p className="cita-estado">
                      <strong>Estado:</strong> {stateMapping[cita.estado] || cita.estado.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PsychologistDashboard;