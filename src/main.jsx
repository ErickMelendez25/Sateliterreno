import React from 'react';
import ReactDOM from 'react-dom/client'; // Importación correcta para React 18
import './styles/Global.css'; // Asegúrate de que la ruta sea correcta para tus estilos globales
import App from './App'; // Asegúrate de tener un archivo App.jsx o App.js en el directorio

// Creación de la raíz del DOM
const root = ReactDOM.createRoot(document.getElementById('root')); 

// Renderiza el componente App envuelto en React.StrictMode para detectar problemas en el desarrollo
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
