const express = require('express');
const exphbs = require('express-handlebars');
const jwt = require('jsonwebtoken');
const duckdb = require('duckdb');
const bodyParser = require('body-parser');
const path = require('path');
const handlebarsHelpers = require('handlebars-helpers')();
const crypto = require('crypto');
const fetch = require('node-fetch'); // Asegúrate de tener esta dependencia instalada

const app = express();
const db = new duckdb.Database('http://localhost:9000/query');
const activeSessions = {};

// Configuración de Handlebars
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        baseUrl: () => {
            return ''; // Aquí podrías agregar la base URL si es necesario
        },
        ...handlebarsHelpers
    }
}));

function generateApiKey() {
    return crypto.randomBytes(16).toString('hex'); // Genera un string aleatorio de 32 caracteres (128 bits)
}

app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Clave secreta para firmar los tokens
const SECRET_KEY = 'eaCtfdrrayY0h12MWkcyVorAfM9Pf2lrKeXQAroaxho5hd4GgjOCvDY//w7+tBoMP2IJMpbFLGu1mw/d0y2Bew==';

// Convierte respuesta DuckDB a objetos
function toRowObjects(result) {
    const { columns, data } = result;
    if (!columns || !data) return [];
    return data.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
            obj[col.name] = row[i];
        });
        return obj;
    });
}

// Función para consultar DuckDB vía HTTP con placeholders $1, $2,...
async function queryDuckDB(query, params = []) {
    const response = await fetch('http://localhost:9000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, parameters: params })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`DuckDB HTTP Error: ${response.status} - ${text}`);
    }

    const result = await response.json();
    return toRowObjects(result);
}

// Middleware de autenticación
function isAuthenticated(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Failed to authenticate token.' });
        }

        req.user = decoded.user;

        // Verificar si la sesión está activa
        if (!activeSessions[req.user]) {
            return res.status(401).json({ error: 'Session expired or invalid.' });
        }

        next();
    });
}

// Importar las rutas desde routes.js y pasar las dependencias necesarias
const routes = require('./routes');
routes(app, queryDuckDB, isAuthenticated, generateApiKey, SECRET_KEY, activeSessions);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});