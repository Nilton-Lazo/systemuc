// src/components/layout/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Header.css';

const Header = ({ psicologo }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const headerRightRef = useRef(null);

  const firstName = psicologo.nombre ? psicologo.nombre.split(' ')[0] : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRightRef.current && !headerRightRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
    window.location.reload();
  };

  // Calcular el saludo basado en la hora en America/Lima
  const nowTimeString = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    hour12: false
  });
  const hour = parseInt(nowTimeString.split(':')[0], 10);
  let greeting;
  if (hour < 12) {
    greeting = 'Buenos días';
  } else if (hour < 18) {
    greeting = 'Buenas tardes';
  } else {
    greeting = 'Buenas noches';
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="header-button" 
          onClick={() => navigate('/dashboard')}
        >
          Atención de cita
        </button>
        <button 
          className="header-button" 
          onClick={() => navigate('/report')}
        >
          Ver reporte
        </button>
        <button 
          className="header-button" 
          onClick={() => navigate('/derivacion')}
        >
          Derivación
        </button>
      </div>
      <div 
        className="header-right" 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        ref={headerRightRef}
      >
        <span className="greeting">
          {greeting} <strong>{firstName}</strong>
        </span>
        <img 
          src={psicologo.foto || '/default_profile.png'} 
          alt="Perfil" 
          className="profile-image" 
        />
        {dropdownOpen && (
          <div className="dropdown-menu">
            <button onClick={() => { setDropdownOpen(false); navigate('/edit-profile'); }}>
              Mi perfil
            </button>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
