// src/pages/Login.js
import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Login.css';
import uniLogo from '../assets/images/logo_universidad_blanco.png';
import googleLogo from '../assets/images/google_logo.png';

const Login = () => {
  const navigate = useNavigate();
  const login = useGoogleLogin({
    flow: 'auth-code',
    hostedDomain: 'continental.edu.pe',
    access_type: 'offline',
    onSuccess: async (response) => {
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/google-signin`,
          { code: response.code }
        );
        const user = res.data.usuario;
        // Si es psicólogo o administrador y falta teléfono o sede, el perfil está incompleto.
        if (
          (user.rol === 'psicologo' || user.rol === 'administrador') &&
          (!user.telefono || !user.sede)
        ) {
          // Redirigir a EditProfile pasando el usuario vía location.state (no se guarda en localStorage)
          navigate('/edit-profile', { state: { user } });
        } else {
          // Perfil completo: guardar en localStorage y redirigir al Dashboard
          localStorage.setItem('usuario', JSON.stringify(user));
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error durante el inicio de sesión:', error.response?.data || error.message);
        alert(
          error.response?.data?.error ||
            'Error al iniciar sesión. Por favor, inténtalo nuevamente.'
        );
      }
    },
    onError: (error) => {
      console.error("Error en el login:", error);
      alert('Fallo en la autenticación con Google.');
    },
    scope: "profile email https://www.googleapis.com/auth/calendar",
  });

  return (
    <div className="login-background">
      <div className="login-container">
        <img src={uniLogo} alt="Logo Universidad" className="uni-logo" />
        <h2 className="login-title">Gestión de Citas Psicológicas</h2>
        <button onClick={() => login()} className="google-button">
          <img src={googleLogo} alt="Google Logo" className="google-logo" />
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

export default Login;
