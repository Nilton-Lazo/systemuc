// src/components/layout/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Header.css';

const Header = ({ psicologo }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const headerRightRef = useRef(null);

  // Extraemos el primer nombre del psicólogo
  const firstName = psicologo.nombre ? psicologo.nombre.split(' ')[0] : '';

  // Función para cerrar el menú desplegable al hacer click fuera
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
      </div>
      <div 
        className="header-right" 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        ref={headerRightRef}
      >
        <span className="greeting">
          Hola <strong>{firstName}</strong>
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
