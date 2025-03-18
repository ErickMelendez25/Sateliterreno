import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import '../styles/DashboardHeader.css';

const handleLogout = () => {
  // Eliminar el token y el rol del localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('usuario');  // Limpiar también los datos del usuario
  localStorage.removeItem('user'); // Limpiar los datos de Google del usuario
  // Redirigir al login
  window.location.href = '/';
};

function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]); 
  const [asesores, setAsesores] = useState([]); 
  const [revisores, setRevisores] = useState([]); 
  const location = useLocation();
  const [titleVisible, setTitleVisible] = useState(false);
  const [userPhoto, setUserPhoto] = useState(''); // Estado para la foto de perfil del usuario
  const [userName, setUserName] = useState(''); // Estado para el nombre del usuario

  // Verifica si estamos en la página principal del dashboard
  const isDashboard = location.pathname === "/dashboard";
  
  // Obtener la opción actual desde la URL (si existe) y decodificarla
  const opcion = location.pathname.split('/')[2];
  
  // Decodificar la URL y reemplazar los guiones por espacios
  const decodedTitle = opcion ? decodeURIComponent(opcion.replaceAll('-', ' ')) : ''; 

  // Función para abrir o cerrar el menú
  const toggleMenu = () => {
    setIsMenuOpen(prevState => !prevState);
  };

  // Función para confirmar el cierre de sesión
  const confirmLogout = () => {
    setShowConfirmLogout(true);
    setIsMenuOpen(false);
  };

  // Función para confirmar realmente el logout
  const confirmAndLogout = () => {
    handleLogout();
  };

  // Función para cancelar el logout
  const cancelLogout = () => {
    setShowConfirmLogout(false);
  };

  // Cuando el pathname cambia, hacemos aparecer el título con una transición
  useEffect(() => {
    setTitleVisible(false); // Primero ocultamos el título
    const timer = setTimeout(() => {
      setTitleVisible(true); // Mostramos el título después de un tiempo
    }, 100); // Tiempo en ms para que se vea el efecto de transición
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Obtener el rol del usuario desde el localStorage con validación de errores
  const userRole = localStorage.getItem('userRole');

  // Intentar obtener los datos del usuario desde el localStorage y parsearlos correctamente
  let user = null;
  try {
    const userData = localStorage.getItem('usuario');
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  // Si el usuario está logueado con Google, sus datos deben estar en localStorage
  let userEmail = user ? user.correo : '';  
  const userRol = user ? user.rol : '';  

  let Nombre = '';
  let imagen_perfil = ''; 

  // Obtener datos de Google si el usuario está logueado con Google
  useEffect(() => {
    const googleUser = localStorage.getItem('user');
    if (googleUser) {
      const googleData = JSON.parse(googleUser);
      console.log("ID del usuario de Google:", googleData.id); // Mostrar el ID del usuario
      console.log("URL de la foto de perfil del usuario de Google:", googleData.imagen_perfil); // Mostrar la URL de la foto
      setUserPhoto(googleData.imagen_perfil); // Asegurarse de que el valor correcto de imagen se asigna
      setUserName(googleData.nombre); // Establecer el nombre del usuario
    }
  }, []); // Esta dependencia vacía asegura que se ejecute solo al montar el componente

  // Obtener los datos de los estudiantes, asesores y revisores dependiendo del rol del usuario
  useEffect(() => {
    if (userRol === 'estudiante') {
      const fetchEstudiantes = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/estudiantes');
          setEstudiantes(response.data);
        } catch (error) {
          console.error('Error al obtener estudiantes:', error);
        }
      };
      fetchEstudiantes();
    } else if (userRol === 'asesor') {
      const fetchAsesores = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/asesores');
          setAsesores(response.data);
        } catch (error) {
          console.error('Error al obtener asesores:', error);
        }
      };
      fetchAsesores();
    } else if (userRol === 'revisor') {
      const fetchRevisores = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/revisores');
          setRevisores(response.data);
        } catch (error) {
          console.error('Error al obtener revisores:', error);
        }
      };
      fetchRevisores();
    }
  }, [userRol]);  

  // Filtrar y obtener el nombre según el rol y correo
  useEffect(() => {
    if (userRol === 'estudiante') {
      const estudiante = estudiantes.find((item) => item.correo === userEmail);
      Nombre = estudiante ? `${estudiante.nombres} ${estudiante.apellido_paterno} ${estudiante.apellido_materno}` : '';
    } else if (userRol === 'asesor') {
      const asesor = asesores.find((item) => item.correo === userEmail);
      Nombre = asesor ? `${asesor.nombre_asesor} ${asesor.apellido_paterno} ${asesor.apellido_materno}` : '';
    } else if (userRol === 'revisor') {
      const revisor = revisores.find((item) => item.correo === userEmail);
      Nombre = revisor ? `${revisor.nombre_revisor} ${revisor.apellido_paterno} ${revisor.apellido_materno}` : '';
    }
  }, [userEmail, estudiantes, asesores, revisores, userRol]);  

  return (
    <header className="dashboard-header">
      <div className="logo-container">
        <Link to="/dashboard" className="logo-link">
          <img src="/images/logo.png" alt="Logo de CampusUC" className={titleVisible ? 'logo-animate' : ''} />
        </Link>
      </div>

      {/* Mostrar el título de la opción seleccionada o el menú, dependiendo de la ruta */}
      <div className="header-center">
        {decodedTitle ? (
          <h1 className={titleVisible ? 'title-animate' : ''}>
            {decodedTitle.toUpperCase()}
          </h1>
        ) : (
          isDashboard && (
            <div className="navbar-container">
              <nav className="navbar">
                <ul className="header-options">
                  <li><span>Bienvenido, {userName || Nombre || 'Usuario'}</span></li> {/* Mostrar el nombre del usuario */}
                </ul>
              </nav>
            </div>
          )
        )}
      </div>

      {/* Mostrar la imagen de perfil de usuario autenticado de Google */}
      {userPhoto ? (
        <div className="user-photo-container">
          <img 
            src={userPhoto} // Foto de perfil de Google
            alt="Foto de usuario"
            className="user-icon"
            onClick={toggleMenu} 
            title="Opciones" 
          />
          
          {/* Mostrar el menú de opciones cuando se hace clic en la foto */}
          {isMenuOpen && (
            <div className="menu-options">
              <ul>
                <li onClick={confirmLogout}>Cerrar sesión</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="user-photo-container">
          <img 
            src="/images/default-avatar.png" // Imagen predeterminada en caso de no tener foto
            alt="Foto de usuario"
            className="user-icon"
            onClick={toggleMenu} 
            title="Opciones" 
          />
        </div>
      )}
    </header>
  );
}

export default DashboardHeader;
