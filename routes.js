module.exports = function(
    app,
    queryDuckDB,
    isAuthenticated,
    generateApiKey,
    SECRET_KEY,
    activeSessions
) {
    // Ruta de inicio
    app.get('/', (req, res) => {
        res.render('home'); 
    });

    // Crear nuevo admin
    app.post('/api/v1/register', async (req, res) => {
        const { Username, Password } = req.body;
        if (!Username || !Password) {
            return res.status(400).json({ error: 'Username y Password son requeridos' });
        }

        try {
            await queryDuckDB('INSERT INTO Admin (Username, Password) VALUES ($1, $2)', [Username, Password]);
            res.status(201).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener todos los admin
    app.get('/api/v1/admins', isAuthenticated, async (req, res) => {
        try {
            const rows = await queryDuckDB('SELECT Username FROM Admin');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Acceder a la cuenta (login)
    app.post('/api/v1/login', async (req, res) => {
        const { Username, Password } = req.body;

        if (!Username || !Password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        if (activeSessions[Username]) {
            return res.status(400).json({ error: 'User already logged in.' });
        }

        try {
            const rows = await queryDuckDB('SELECT Username FROM Admin WHERE Username = $1 AND Password = $2', [Username, Password]);
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Incorrect username or password.' });
            }

            const token = require('jsonwebtoken').sign({ user: Username }, SECRET_KEY, { expiresIn: '1h' });
            activeSessions[Username] = { token };

            res.status(200).json({ message: 'Logged in successfully!', session: token });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Cierre de sesión
    app.get('/api/v1/logout', isAuthenticated, (req, res) => {
        const { user } = req;
        delete activeSessions[user];
        res.status(200).json({ message: 'Logged out successfully.' });
    });

    // Crear nueva compañía
    app.post('/api/v1/company', isAuthenticated, async (req, res) => {
        const { company_name } = req.body;
        if (!company_name) {
            return res.status(400).json({ error: 'company_name es requerido' });
        }

        try {
            const apiKey = generateApiKey();
            await queryDuckDB('INSERT INTO Company (company_name, company_api_key) VALUES ($1, $2)', [company_name, apiKey]);

            const company = await queryDuckDB('SELECT company_api_key FROM Company WHERE company_name = $1', [company_name]);
            if (company.length === 0) {
                return res.status(500).json({ error: 'No se pudo obtener la compañía creada' });
            }

            res.status(201).json({ success: true, company_api_key: company[0].company_api_key });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener todas las compañías
    app.get('/api/v1/companies', isAuthenticated, async (req, res) => {
        try {
            const rows = await queryDuckDB('SELECT ID, company_name FROM Company');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Crear nueva ubicación
    app.post('/api/v1/location', async (req, res) => {
        const { company_api_key, company_id, location_name, location_country, location_city, location_meta } = req.body;

        if (!company_api_key || !company_id || !location_name || !location_country || !location_city) {
            return res.status(400).json({ error: 'Faltan campos requeridos para la ubicación' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await queryDuckDB(
                'INSERT INTO Location (company_id, location_name, location_country, location_city, location_meta) VALUES ($1, $2, $3, $4, $5)',
                [company_id, location_name, location_country, location_city, location_meta]
            );

            const location = await queryDuckDB(
                'SELECT * FROM Location WHERE company_id = $1 AND location_name = $2',
                [company_id, location_name]
            );

            if (location.length === 0) {
                return res.status(500).json({ error: 'No se pudo obtener la ubicación insertada' });
            }

            res.status(201).json({ success: true, location: location[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener todas las ubicaciones
    app.get('/api/v1/locations', async (req, res) => {
        const { company_api_key } = req.query;
        if (!company_api_key) {
            return res.status(400).json({ error: 'company_api_key es requerido' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const rows = await queryDuckDB('SELECT * FROM Location');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/test-params', async (req, res) => {
        try {
            const rows = await queryDuckDB('SELECT $1 AS col1, $2 AS col2', ['hello', 'world']);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

// Obtener todos los sensores
// app.get('/api/v1/sensors', (req, res) => {
//     const { company_api_key } = req.query;

//     // Verificar la validez de company_api_key
//     db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
//         if (err || !row) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }
//         db.all('SELECT location_id, sensor_id, sensor_name, sensor_category, sensor_meta FROM Sensor', (err, rows) => {
//             if (err) {
//                 return res.status(500).json({ error: err.message });
//             }
//             res.json(rows);
//         });
//     });
// });

// // Insertar datos del sensor
// app.post('/api/v1/sensor_data', (req, res) => {
//     const { sensor_api_key, json_data } = req.body;

//     // Verificar si se recibió json_data y es un array
//     if (!Array.isArray(json_data)) {
//         return res.status(400).json({ error: 'Invalid JSON data format' });
//     }

//     // Verificar si el sensor_api_key es válido
//     db.get('SELECT * FROM Sensor WHERE sensor_api_key = ?', [sensor_api_key], (err, row) => {
//         if (err || !row) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         const sensor_id = row.sensor_id;

//         // Insertar los datos del sensor
//         db.serialize(() => {
//             db.run('BEGIN TRANSACTION');
//             const stmt = db.prepare('INSERT INTO Sensor_Data (sensor_id, data_key, data_value) VALUES (?, ?, ?)');

//             try {
//                 json_data.forEach(({ data_key, data_value }) => {
//                     // Verificar que cada objeto tenga las propiedades esperadas
//                     if (typeof data_key !== 'string' || typeof data_value !== 'string') {
//                         throw new Error('Invalid data format');
//                     }
//                     stmt.run(sensor_id, data_key, data_value);
//                 });

//                 stmt.finalize((err) => {
//                     if (err) {
//                         db.run('ROLLBACK');
//                         return res.status(500).json({ error: err.message });
//                     }
//                     db.run('COMMIT');
//                     res.status(201).json({ success: true });
//                 });
//             } catch (error) {
//                 db.run('ROLLBACK');
//                 res.status(400).json({ error: error.message });
//             }
//         });
//     });
// });

// // Consultar datos del sensor
// app.get('/api/v1/sensor_data', (req, res) => {
//     const { company_api_key, from, to, sensor_id } = req.query;

//     // Convertir from y to a timestamps si es necesario
//     const fromTimestamp = parseInt(from, 10);
//     const toTimestamp = parseInt(to, 10);

//     // Verificar la validez de company_api_key
//     db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
//         if (err || !row) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         // Obtener los datos del sensor según los parámetros
//         let query = 'SELECT * FROM Sensor_Data WHERE sensor_id = ?';
//         const params = [sensor_id];

//         if (from && to) {
//             query += ' AND timestamp BETWEEN ? AND ?';
//             params.push(fromTimestamp, toTimestamp);
//         }

//         db.all(query, params, (err, rows) => {
//             if (err) {
//                 return res.status(500).json({ error: err.message });
//             }
//             res.json(rows);
//         });
//     });
// });
