import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';


import jwt_decode from 'jwt-decode';
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const [usuarios, setUsuarios] = useState([]); // Estado para manejar la lista de usuarios
  const navigate = useNavigate();

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://sateliterreno-production.up.railway.app'
    : 'http://localhost:5000';


  // Función para obtener la lista de usuarios
  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/usuarios`);
      console.log('Usuarios obtenidos:', response.data);
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setErrorMessage('No se pudo obtener la lista de usuarios');
    }
  };

  // Llamada para obtener los usuarios cuando se carga el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Iniciar carga

    try {
      const response = await axios.post(`${apiUrl}/api/login`, { correo: username, password });
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      setLoading(false); // Detener carga
      navigate('/dashboard');
    } catch (error) {
      setLoading(false); // Detener carga
      setErrorMessage(error.response?.data?.message || 'Hubo un error en el login');
    }
  };

  const handleGoogleLoginSuccess = async (response) => {
    setLoading(true); // Iniciar carga
  
    try {
      const { credential } = response;
      const userInfo = jwt_decode(credential);  
      
      // Limpiar el localStorage antes de guardar nuevos datos
      localStorage.removeItem('authToken');
      localStorage.removeItem('usuario');
  
      // Verificar usuario en el backend
      const { data } = await axios.post(`${apiUrl}/auth`, {
        google_id: userInfo.sub,
        nombre: userInfo.name,
        email: userInfo.email,
        imagen_perfil: userInfo.picture,
      });
  
      // Guardar los nuevos datos del usuario
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario)); // Asegúrate de que el nombre sea correcto
      setLoading(false); // Detener carga
      navigate('/dashboard');
    } catch (error) {
      setLoading(false); // Detener carga
      setErrorMessage('Error al iniciar sesión con Google');
    }
  };
  

  const handleGoogleLoginFailure = (error) => {
    setErrorMessage('Error al iniciar sesión con Google');
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h1>Satélite Perú</h1>

        <div>
          <label htmlFor="username">Correo</label>
          <input 
            type="email" 
            id="username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            disabled={loading} // Deshabilitar si está cargando
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading} // Deshabilitar si está cargando
          />
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" className="login-button" disabled={loading}> {/* Deshabilitar si está cargando */}
          {loading ? 'Cargando...' : 'Iniciar sesión'}
        </button>

        <div className="google-login-container">
          <h1 className="or-text">ó</h1>
          <GoogleLogin 
            onSuccess={handleGoogleLoginSuccess} 
            onError={handleGoogleLoginFailure}
            disabled={loading} // Deshabilitar si está cargando
          />
        </div>
      </form>
    </div>
  );
};

export default Login;
