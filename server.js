import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';   // Importa fileURLToPath
import { dirname } from 'path';        // Importa dirname
import path from 'path';  // Importa path
import fetch from 'node-fetch';

// Usamos import.meta.url para obtener la URL del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();



const app = express();
const port = process.env.PORT ||5000;

// Configura CORS para permitir solicitudes solo desde tu frontend en producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://sateliterreno-production.up.railway.app'
    : 'http://localhost:5173',  // Cambié esto para permitir localhost:5173
  methods: 'GET, POST, PUT, DELETE',
  allowedHeaders: 'Content-Type, Authorization, X-Requested-With', 
  credentials: true,  
};

// Aplica la configuración de CORS
app.use(cors(corsOptions));
app.use(express.json());

  // Configuración de las cabeceras de seguridad Cross-Origin
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    
    // Configuración de Content-Security-Policy
    res.setHeader("Content-Security-Policy", 
      "script-src 'self' https://www.gstatic.com https://apis.google.com 'unsafe-inline' 'unsafe-eval'; " + 
      "object-src 'none';");
  
    next();
  });

// Crear un pool de conexiones en lugar de una conexión única
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, //Cambiar a DB_USER PARA PRODUCCION
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  connectionLimit: 10,  // Número de conexiones simultáneas que el pool puede manejar
  waitForConnections: true,  // Espera cuando no haya conexiones disponibles
  queueLimit: 0  // No limitar el número de consultas que esperan en la cola
});


// Verificación de conexión a la base de datos al iniciar el servidor
db.getConnection((err, connection) => {
  if (err) {
      console.error('Error al conectar a la base de datos:', err.stack);
      return;
  }
  console.log('Conexión a la base de datos exitosa');
  cifrarContraseñas();  // Llamar a la función para cifrar contraseñas si es necesario

  // Libera la conexión cuando termines
  connection.release();
});





// Endpoint de autenticación con Google
app.post('/api/auth', async (req, res) => {
  const { google_id, nombre, email, imagen_perfil } = req.body;
  console.log('Datos recibidos en /api/auth:', { google_id, nombre, email, imagen_perfil });

  if (!google_id || !email) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  let connection;
  try {
    connection = await db.getConnection();

    console.log('Conexión obtenida desde el pool');

    const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

    let usuario;
    if (rows.length === 0) {
      await connection.execute(
        'INSERT INTO usuarios (google_id, nombre, email, imagen_perfil, tipo, puede_vender) VALUES (?, ?, ?, ?, ?, ?)',
        [google_id, nombre, email, imagen_perfil, 'comprador', false]
      );
      const [newUser] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
      usuario = newUser[0];
    } else {
      usuario = rows[0];
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Responder con el token y los datos del usuario
    res.status(200).json({ token, usuario });

  } catch (error) {
    console.error('Error en /api/auth:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    if (connection) connection.release();
  }
});



// Rutas para obtener los datos
app.get('/api/terrenos', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

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
    connection = await db.getConnection();

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
    connection = await db.getConnection();

    const [rows] = await connection.execute('SELECT * FROM usuarios');
    res.json(rows);  // Asegúrate de que res.json() esté siendo usado para devolver los datos como JSON
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });  // Muestra el mensaje de error
  } finally {
    if (connection) connection.release();
  }
});


// Ruta para obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await db.getConnection();

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
    connection = await db.getConnection();

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
    connection = await db.getConnection();

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
// Verificar la conexión a la base de datos antes de iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
