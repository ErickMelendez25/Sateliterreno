import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/TerrenoDetalles.css'; // Importa el archivo CSS

const TerrenoDetalles = () => {
  const { id } = useParams(); // Obtén el id del terreno desde la URL
  const [terreno, setTerreno] = useState(null);
  const [vendedorNombre, setVendedorNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Obtener detalles del terreno
    axios.get(`${apiUrl}/api/terrenos/${id}`)
      .then((response) => {
        console.log('Detalles del terreno recibido:', response.data);
        setTerreno(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener los detalles del terreno:', error);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    // Obtener el nombre del vendedor
    if (terreno) {
      axios.get(`${apiUrl}/api/usuarios/${terreno.usuario_id}`)
        .then((response) => {
          setVendedorNombre(response.data.nombre);
        })
        .catch((error) => {
          console.error('Error al obtener los detalles del vendedorddddd:', error);
        });
    }
  }, [terreno]);

  if (loading) return <p className="loading">Cargando detalles...</p>;

  if (!terreno) return <p>No se encontraron detalles para este terreno.</p>;

  // URL de WhatsApp
  const whatsappUrl = `https://wa.me/51971168000?text=Hola!%20Estoy%20interesado%20en%20el%20terreno%20${terreno.titulo}`;

  return (
    <div className="terreno-detalles">
      {/* Imagen del terreno */}
      <div className="terreno-imagenes">
        {terreno.imagenes && Array.isArray(terreno.imagenes) && terreno.imagenes.length > 0 ? (
          terreno.imagenes.map((imagen, index) => {
            const imagenName = imagen.split('/').pop(); // Extrae el nombre de la imagen
            return (
              <div key={index}>
                <img src={imagen} alt={imagenName} />
              </div>
            );
          })
        ) : (
          <p className="no-imagenes">No hay imágenes disponibles para este terreno.</p>
        )}
      </div>

      {/* Detalles del terreno */}
      <div className="terreno-info">
        <div className="info-section">
          <h2>{terreno.titulo}</h2>
          <p><strong>Precio:</strong> {terreno.precio}</p>
          <p><strong>Ubicación:</strong> Lat: {terreno.ubicacion_lat}, Lon: {terreno.ubicacion_lon}</p>
          <p><strong>Descripción:</strong> {terreno.descripcion}</p>
          <p><strong>Estado:</strong> {terreno.estado}</p>
          <p><strong>Vendedor:</strong> {vendedorNombre}</p>

          {/* Detalles del terreno organizados en dos columnas */}
          <div className="detalles-adicionales">
            <div className="column">
              <p><strong>Área:</strong> {terreno.area} m²</p>
              <div>
                <div className="checklist">
                  <p><strong>Luz:</strong> {terreno.cuenta_luz ? '✔' : '✘'}</p>
                  <p><strong>Agua:</strong> {terreno.cuenta_agua ? '✔' : '✘'}</p>
                </div>
              </div>
            </div>

            <div className="column">
              <p><strong>Constancia de Posesión:</strong> {terreno.constancia_posesion ? '✔' : '✘'}</p>
              <p><strong>Registrado en SUNARP:</strong> {terreno.registro_sunarp ? '✔' : '✘'}</p>
              <p><strong>Desagüe:</strong> {terreno.cuenta_desague ? '✔' : '✘'}</p>
            </div>
          </div>
        </div>

        {/* Botón de WhatsApp */}
        <div className="whatsapp-button-container">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-button">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="whatsapp-icon" />
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default TerrenoDetalles;
