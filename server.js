import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();



const app = express();
const port = process.env.DB_PORT || 8080;

// Configura CORS para permitir solicitudes solo desde tu frontend en producción
const corsOptions = {
  origin: 'https://sateliterreno-production.up.railway.app', // Permitir solo solicitudes desde este dominio
  methods: 'GET, POST, PUT, DELETE', // Métodos permitidos
  allowedHeaders: 'Content-Type, Authorization', // Encabezados permitidos
};

// Aplica la configuración de CORS
app.use(cors(corsOptions));
app.use(express.json());

// Crear un pool de conexiones en lugar de una conexión única
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,  // Espera si no hay conexiones disponibles
  connectionLimit: 10,  // Número máximo de conexiones simultáneas
  queueLimit: 0,  // Sin límite de espera
});




// Endpoint de autenticación con Google
app.post('/api/auth', (req, res, next) => {
  console.log('Solicitud POST recibida en /auth');
  next();
}, async (req, res) => {
  const { google_id, nombre, email, imagen_perfil } = req.body;

  if (!google_id || !email) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  let connection;

  try {
    // Obtén la conexión desde el pool
    connection = await pool.getConnection();
    
    // Verificar si el usuario ya existe
    const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

    let usuario;
    if (rows.length === 0) {
      // Si no existe, insertar el nuevo usuario
      await connection.execute(
        'INSERT INTO usuarios (google_id, nombre, email, imagen_perfil, tipo, puede_vender) VALUES (?, ?, ?, ?, ?, ?)',
        [google_id, nombre, email, imagen_perfil, 'comprador', false]
      );

      // Obtener el usuario recién insertado
      const [newUser] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
      usuario = newUser[0];
    } else {
      // Si ya existe, tomar los datos del usuario
      usuario = rows[0];
    }

    // Generar el token JWT
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Responder con el token y los datos del usuario
    res.json({ token, usuario });
  } catch (error) {
    console.error('Error en la autenticación con Google:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    // Asegurarse de liberar la conexión al pool
    if (connection) connection.release();
  }
});


// Rutas para obtener los datos
app.get('/api/terrenos', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM terrenos WHERE estado = "disponible"');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener terrenos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta para obtener los detalles de un terreno por ID
app.get('/api/terrenos/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM terrenos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Terreno no encontrado' });
    }

    res.json(rows[0]); // Devuelve el terreno específico
  } catch (error) {
    console.error('Error al obtener el terreno:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});


app.get('/api/usuarios', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM usuarios');
    res.json(rows);  // Asegúrate de que res.json() esté siendo usado para devolver los datos como JSON
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta para obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM usuarios WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(rows[0]); // Devuelve el usuario específico
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});


app.get('/api/favoritos', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM favoritos');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/Createterrenos', async (req, res) => {
  let connection;
  try {
    const { titulo, descripcion, precio, ubicacion_lat, ubicacion_lon, metros_cuadrados, imagenes, estado, usuario_id } = req.body;

    // Verificar si faltan datos
    if (!titulo || !descripcion || !precio || !ubicacion_lat || !ubicacion_lon || !metros_cuadrados || !imagenes || !estado || !usuario_id) {
      console.error('Faltan campos en el formulario:', req.body);  // Log de lo que se recibe
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    console.log('Datos recibidos:', req.body); // Log de los datos recibidos

    // Crear una nueva entrada en la base de datos
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO terrenos (titulo, descripcion, precio, ubicacion_lat, ubicacion_lon, metros_cuadrados, imagenes, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [titulo, descripcion, precio, ubicacion_lat, ubicacion_lon, metros_cuadrados, imagenes, estado, usuario_id]
    );

    console.log('Resultado de la inserción:', result);  // Log del resultado de la inserción

    // Respuesta exitosa
    res.status(201).json({
      message: 'Terreno creado exitosamente',
      terrenoId: result.insertId,
    });
  } catch (error) {
    console.error('Error al crear el terreno:', error);  // Log del error
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});


// Para cualquier otra ruta (no API), servir el index.html
app.use(express.static(path.join(__dirname, 'dist')));

// Esta ruta debe ir **al final** después de todas las rutas API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});



// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
