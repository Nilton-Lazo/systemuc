// src/pages/EditProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/EditProfile.css';

const validateTelefono = (tel) => /^9\d{8}$/.test(tel);

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Intentamos obtener el usuario de location.state o de localStorage.
  const storedUserFromState = location.state ? location.state.user : null;
  const storedUserFromLocal = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario'))
    : null;
  const initialUser = storedUserFromState || storedUserFromLocal || null;

  // Declaramos todos los hooks incondicionalmente.
  const [user] = useState(initialUser);
  const [telefono, setTelefono] = useState(user && user.telefono ? user.telefono : '');
  const [sede, setSede] = useState(user && user.sede ? user.sede : '');
  const [isValid, setIsValid] = useState(false);
  const [focus, setFocus] = useState({ email: false, telefono: false, sede: false });
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para redirigir si no se encontró usuario; de lo contrario, se finaliza la carga.
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    } else {
      setIsLoading(false);
    }
  }, [user, navigate]);

  // Actualizamos la validez del formulario cada vez que cambian "telefono" o "sede".
  useEffect(() => {
    setIsValid(validateTelefono(telefono) && Boolean(sede));
  }, [telefono, sede]);

  // Comprobamos si se han realizado cambios respecto a los valores iniciales.
  const initialTelefonoValue = user && user.telefono ? user.telefono : '';
  const initialSedeValue = user && user.sede ? user.sede : '';
  const hasChanged = telefono !== initialTelefonoValue || sede !== initialSedeValue;

  const handleTelefonoChange = (e) => {
    setTelefono(e.target.value.replace(/\D/g, ''));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateTelefono(telefono)) {
      alert('Ingrese un número de celular correcto');
      return;
    }
    if (!user?.id) {
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
      // Actualizamos el usuario en localStorage (perfil ya completo)
      const updatedUser = { ...user, telefono, sede };
      localStorage.setItem('usuario', JSON.stringify(updatedUser));
      alert('Perfil actualizado correctamente');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar perfil');
    }
  };

  // Mientras se esté cargando, mostramos "Loading..."
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Datos de perfil para renderizar.
  const profileImage = user.foto || user.picture || '';
  const profileName = user.nombre || user.name || 'Sin nombre';
  const profileEmail = user.correo || user.email || '';
  // Se considera primera vez si falta alguno de estos datos.
  const isFirstTime = !(user.telefono && user.sede);

  return (
    <div className="edit-background">
      <div className="edit-container">
        <div className="edit-header">
          <h2>MI PERFIL</h2>
        </div>
        <div className="title-spacer" />
        <img src={profileImage} alt="Foto de perfil" className="profile-picture" />
        <h3 className="profile-name">{profileName}</h3>
        <div className="name-spacer" />
        <div className="profile-field">
          <label className={focus.email || profileEmail ? 'active' : ''}>Correo</label>
          <input
            type="email"
            value={profileEmail}
            readOnly
            onFocus={() => setFocus({ ...focus, email: true })}
            onBlur={() => setFocus({ ...focus, email: false })}
          />
        </div>
        <div className="email-spacer" />
        <div className="profile-field">
          <label className={focus.telefono || telefono ? 'active' : ''}>Teléfono</label>
          <input
            type="text"
            value={telefono}
            onChange={handleTelefonoChange}
            onFocus={() => setFocus({ ...focus, telefono: true })}
            onBlur={() => setFocus({ ...focus, telefono: false })}
            maxLength="9"
          />
        </div>
        <div className="phone-spacer" />
        <div className="profile-field">
          <label className={focus.sede || sede ? 'active' : ''}>Sede</label>
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
        <div className="sede-spacer" />
        <button onClick={handleSave} className="save-button" disabled={!isValid || !hasChanged}>
          {isFirstTime ? 'Guardar' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
