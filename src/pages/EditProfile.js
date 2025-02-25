// src/pages/EditProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();

  // 1) Leer datos del usuario desde localStorage
  const storedUser = localStorage.getItem('usuario');
  const user = storedUser
    ? JSON.parse(storedUser)
    : { id: '', nombre: '', correo: '', foto: '', rol: '' };

  // 2) Datos de foto, nombre y correo
  const profileImage = user.foto || user.picture || '';
  const profileName = user.nombre || user.name || 'Sin nombre';
  const profileEmail = user.correo || user.email || '';

  // 3) Estados para teléfono, sede y validación
  const [telefono, setTelefono] = useState('');
  const [sede, setSede] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Manejo de enfoque para las etiquetas flotantes (email, teléfono, sede)
  const [focus, setFocus] = useState({
    email: false,
    telefono: false,
    sede: false,
  });

  // Validar teléfono (empieza con 9 y 9 dígitos)
  const validateTelefono = (tel) => /^9\d{8}$/.test(tel);

  // Actualizar validez cuando cambian teléfono o sede
  useEffect(() => {
    setIsValid(validateTelefono(telefono) && sede);
  }, [telefono, sede]);

  // Manejar cambios de teléfono (solo dígitos)
  const handleTelefonoChange = (e) => {
    setTelefono(e.target.value.replace(/\D/g, ''));
  };

  // Manejar guardar cambios
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateTelefono(telefono)) {
      alert('Ingrese un número de celular correcto');
      return;
    }
    if (!user.id) {
      alert('No se encontró el ID del usuario');
      return;
    }

    const payload = {
      id: Number(user.id),
      telefono,
      sede,
      rol: user.rol || user.role,
    };

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/update-profile`, payload);
      alert('Perfil actualizado correctamente');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar perfil');
    }
  };

  return (
    <div className="edit-background">
      <div className="edit-container">

        {/* Encabezado (título) tipo puzzle piece */}
        <div className="edit-header">
          <h2>MI PERFIL</h2>
        </div>

        {/* Espacio entre el título y la foto */}
        <div className="title-spacer" />

        {/* Foto de perfil */}
        <img
          src={profileImage}
          alt="Foto de perfil"
          className="profile-picture"
        />

        {/* Espacio entre el nombre y el campo correo */}
        <h3 className="profile-name">{profileName}</h3>
        <div className="name-spacer" />

        {/* Campo: Correo (solo lectura), con etiqueta flotante */}
        <div className="profile-field">
          <label className={focus.email || profileEmail ? 'active' : ''}>
            Correo
          </label>
          <input
            type="email"
            value={profileEmail}
            readOnly
            onFocus={() => setFocus({ ...focus, email: true })}
            onBlur={() => setFocus({ ...focus, email: false })}
          />
        </div>

        {/* Espacio entre el campo correo y el campo teléfono */}
        <div className="email-spacer" />

        {/* Campo: Teléfono, con etiqueta flotante */}
        <div className="profile-field">
          <label className={focus.telefono || telefono ? 'active' : ''}>
            Teléfono
          </label>
          <input
            type="text"
            value={telefono}
            onChange={handleTelefonoChange}
            onFocus={() => setFocus({ ...focus, telefono: true })}
            onBlur={() => setFocus({ ...focus, telefono: false })}
            maxLength="9"
          />
        </div>

        {/* Espacio entre el campo teléfono y el campo sede */}
        <div className="phone-spacer" />

        {/* Campo: Sede (con etiqueta flotante) */}
        <div className="profile-field">
          <label className={focus.sede || sede ? 'active' : ''}>
            Sede
          </label>
          <select
            value={sede}
            onChange={(e) => setSede(e.target.value)}
            onFocus={() => setFocus({ ...focus, sede: true })}
            onBlur={() => setFocus({ ...focus, sede: false })}
          >
            <option value=""></option>
            <option value="Huancayo">Huancayo</option>
            <option value="Arequipa">Arequipa</option>
            <option value="Cusco">Cusco</option>
            <option value="Lima - Los Olivos">Lima - Los Olivos</option>
          </select>
        </div>

        {/* Espacio entre el campo sede y el botón */}
        <div className="sede-spacer" />

        {/* Botón Guardar */}
        <button
          onClick={handleSave}
          className="save-button"
          disabled={!isValid}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
