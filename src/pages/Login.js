// src/pages/Login.js
import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Login.css';
import uniLogo from '../assets/images/logo_universidad_blanco.png';
import googleLogo from '../assets/images/google_logo.png';

const Login = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (response) => {
      try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/google-signin`, {
          code: response.code,
        });
        // Guarda token y datos del usuario en localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));

        // Extraer datos del usuario
        const user = res.data.usuario;
        // Si es psicólogo o administrador y faltan datos (teléfono o sede), redirige a editar perfil
        if (
          (user.rol === 'psicologo' || user.rol === 'administrador') &&
          (!user.telefono || !user.sede)
        ) {
          navigate('/edit-profile');
        } else {
          // Si el perfil está completo, redirige al panel de citas
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error al comunicarse con el backend:', error.response?.data || error.message);
        alert(error.response?.data?.error || 'Error al iniciar sesión. Por favor, inténtalo nuevamente.');
      }
    },
    onError: (error) => {
      console.error("Error en login:", error);
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
