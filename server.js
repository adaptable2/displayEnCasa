// Carga variables de entorno desde .env
require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

// Leer clave de API de Google y Place ID desde variables de entorno
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const PLACE_ID = process.env.PLACE_ID;

if (!GOOGLE_API_KEY || !PLACE_ID) {
    console.warn('Advertencia: Falta GOOGLE_API_KEY o PLACE_ID en el entorno (.env).');
}

// Sirve los archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy-google-photo', async (req, res) => {
    try {
        const photoUrl = req.query.url; // Obtenemos la URL de la foto de la consulta
        if (!photoUrl) {
            return res.status(400).send('URL de foto no proporcionada.');
        }

        const { default: fetch } = await import('node-fetch');
        const response = await fetch(photoUrl);
        
        // Establecemos el tipo de contenido y enviamos la imagen
        res.setHeader('Content-Type', response.headers.get('content-type'));
        response.body.pipe(res);

    } catch (error) {
        console.error('Error al obtener la imagen:', error);
        res.status(500).send('No se pudo cargar la imagen.');
    }
});

// Ruta de la API para obtener las reseñas
app.get('/api/google-reviews', async (req, res) => {
    try {
        // La importación dinámica de fetch es la solución más robusta
        const { default: fetch } = await import('node-fetch');
        const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${PLACE_ID}&fields=reviews&language=es&key=${GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        // Si la API de Google devuelve un error, lo enviamos al cliente
        if (data.status !== 'OK') {
            console.error('Error de la API de Google:', data.error_message);
            return res.status(500).json({ error: data.error_message || 'Error desconocido de la API de Google' });
        }

        res.json(data.result.reviews);
    } catch (error) {
        console.error('Error al obtener las reseñas:', error);
        res.status(500).json({ error: 'No se pudieron obtener las reseñas. Revisa la consola del servidor.' });
    }
});

// Sirve el archivo index.html para la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
