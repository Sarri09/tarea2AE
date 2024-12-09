-- Crear las secuencias antes de usarlas
CREATE SEQUENCE IF NOT EXISTS company_seq;
CREATE SEQUENCE IF NOT EXISTS sensor_seq;

-- Crear la tabla Admin
CREATE TABLE IF NOT EXISTS Admin (
    Username TEXT PRIMARY KEY,
    Password TEXT NOT NULL
);

-- Crear la tabla Company
CREATE TABLE IF NOT EXISTS Company (
    ID INTEGER PRIMARY KEY DEFAULT nextval('company_seq'),
    company_name TEXT NOT NULL UNIQUE,
    company_api_key TEXT
);

-- Crear la tabla Location
CREATE TABLE IF NOT EXISTS Location (
    company_id INTEGER NOT NULL,
    location_name TEXT NOT NULL,
    location_country TEXT NOT NULL,
    location_city TEXT NOT NULL,
    location_meta TEXT,
    UNIQUE(company_id, location_name),
    PRIMARY KEY (company_id, location_name),
    FOREIGN KEY (company_id) REFERENCES Company(ID)
);

-- Crear la tabla Sensor
CREATE TABLE IF NOT EXISTS Sensor (
    location_id INTEGER NOT NULL,
    location_name TEXT NOT NULL,
    sensor_id INTEGER PRIMARY KEY DEFAULT nextval('sensor_seq'),
    sensor_name TEXT NOT NULL,
    sensor_category TEXT NOT NULL,
    sensor_meta TEXT,
    sensor_api_key TEXT,
    FOREIGN KEY (location_id, location_name) REFERENCES Location(company_id, location_name)
);

-- Crear la tabla Sensor_Data
CREATE TABLE IF NOT EXISTS Sensor_Data (
    sensor_id INTEGER NOT NULL,
    data_key TEXT NOT NULL,
    data_value TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES Sensor(sensor_id),
    PRIMARY KEY (sensor_id, data_key, timestamp)
);
