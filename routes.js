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

    // Obtener todos los sensores
    app.get('/api/v1/sensors', async (req, res) => {
        const { company_api_key } = req.query;

        if (!company_api_key) {
            return res.status(400).json({ error: 'company_api_key es requerido' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const sensors = await queryDuckDB('SELECT location_id, sensor_id, sensor_name, sensor_category, sensor_meta FROM Sensor');
            res.json(sensors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Insertar datos del sensor
    app.post('/api/v1/sensor_data', async (req, res) => {
        const { sensor_api_key, json_data } = req.body;

        if (!Array.isArray(json_data)) {
            return res.status(400).json({ error: 'Invalid JSON data format' });
        }

        try {
            const sensor = await queryDuckDB('SELECT sensor_id FROM Sensor WHERE sensor_api_key = $1', [sensor_api_key]);
            if (sensor.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const sensor_id = sensor[0].sensor_id;

            // Iniciar transacción
            await queryDuckDB('BEGIN');
            try {
                for (const { data_key, data_value } of json_data) {
                    if (typeof data_key !== 'string' || typeof data_value !== 'string') {
                        throw new Error('Invalid data format');
                    }
                    await queryDuckDB('INSERT INTO Sensor_Data (sensor_id, data_key, data_value) VALUES ($1, $2, $3)', [sensor_id, data_key, data_value]);
                }

                // Si todo fue bien, hacer COMMIT
                await queryDuckDB('COMMIT');
                res.status(201).json({ success: true });
            } catch (error) {
                // En caso de error, hacer ROLLBACK
                await queryDuckDB('ROLLBACK');
                res.status(400).json({ error: error.message });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Consultar datos del sensor
    app.get('/api/v1/sensor_data', async (req, res) => {
        const { company_api_key, from, to, sensor_id } = req.query;

        if (!company_api_key || !sensor_id) {
            return res.status(400).json({ error: 'company_api_key y sensor_id son requeridos' });
        }

        const fromTimestamp = from ? parseInt(from, 10) : null;
        const toTimestamp = to ? parseInt(to, 10) : null;

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            let query = 'SELECT * FROM Sensor_Data WHERE sensor_id = $1';
            const params = [sensor_id];

            if (from && to) {
                query += ' AND timestamp BETWEEN $2 AND $3';
                params.push(fromTimestamp, toTimestamp);
            }

            const rows = await queryDuckDB(query, params);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });


    // Eliminar una ubicación
    app.delete('/api/v1/location/:id', async (req, res) => {
        const { id } = req.params;
        const { company_api_key } = req.body;

        if (!company_api_key) {
            return res.status(400).json({ error: 'company_api_key es requerido' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await queryDuckDB('DELETE FROM Location WHERE rowid = $1', [id]);
            // DuckDB no da changes, asumimos éxito si no hay error
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Crear nuevo sensor
    app.post('/api/v1/sensor', async (req, res) => {
        const { company_api_key, location_id, sensor_name, sensor_category, sensor_meta } = req.body;

        if (!company_api_key || !location_id || !sensor_name || !sensor_category) {
            return res.status(400).json({ error: 'Faltan campos requeridos para el sensor' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const sensorApiKey = generateApiKey();
            await queryDuckDB(
                'INSERT INTO Sensor (location_id, sensor_name, sensor_category, sensor_meta, sensor_api_key) VALUES ($1, $2, $3, $4, $5)',
                [location_id, sensor_name, sensor_category, sensor_meta, sensorApiKey]
            );

            // Obtener el sensor recién insertado
            const sensor = await queryDuckDB(
                'SELECT sensor_id, sensor_api_key FROM Sensor WHERE location_id = $1 AND sensor_name = $2 AND sensor_category = $3 ORDER BY sensor_id DESC LIMIT 1',
                [location_id, sensor_name, sensor_category]
            );

            if (sensor.length === 0) {
                return res.status(500).json({ error: 'No se pudo obtener el sensor insertado' });
            }

            res.status(201).json({ success: 'true', sensor_api_key: sensor[0].sensor_api_key });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener un sensor por ID
    app.get('/api/v1/sensor/:id', async (req, res) => {
        const { id } = req.params;
        const { company_api_key } = req.query;

        if (!company_api_key) {
            return res.status(400).json({ error: 'company_api_key es requerido' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const sensor = await queryDuckDB('SELECT location_id, sensor_id, sensor_name, sensor_category, sensor_meta FROM Sensor WHERE sensor_id = $1', [id]);
            res.json(sensor[0] || {});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Eliminar un sensor
    app.delete('/api/v1/sensor/:id', async (req, res) => {
        const { id } = req.params;
        const { company_api_key } = req.body;

        if (!company_api_key) {
            return res.status(400).json({ error: 'company_api_key es requerido' });
        }

        try {
            const company = await queryDuckDB('SELECT * FROM Company WHERE company_api_key = $1', [company_api_key]);
            if (company.length === 0) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await queryDuckDB('DELETE FROM Sensor WHERE sensor_id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};
