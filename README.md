# HOLA BENJA COMO ESTAS

## 1. Registro

```bash
curl -X POST http://localhost:3000/api/v1/register \
-H "Content-Type: application/json" \
-d '{"Username":"user1","Password":"pass1"}'
```

Respuesta
```json
{
  "success": true
}
```

## 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/login \
-H "Content-Type: application/json" \
-d '{"Username":"user1","Password":"pass1"}'
```

Respuesta:
```json
{
  "message": "Logged in successfully",
  "session": "<token>"
}
```

## 3. Admin List

```bash
curl -X GET http://localhost:3000/api/v1/admins \
-H "Authorization: <token>"
```

Respuesta:
```json
[
  {"Username":"user1"}
]
```

## 4. Crear compañia
```bash
curl -X POST http://localhost:3000/api/v1/company \
-H "Content-Type: application/json" \
-H "Authorization: <token>" \
-d '{"company_name":"MiCompañía"}'
```

Respuesta:
```json
{
  "success": true,
  "company_api_key": "<clave_aleatoria>"
}
```

## Obtener todas las compañías

```bash
curl -X GET http://localhost:3000/api/v1/companies -H "Authorization: <token>"
```

Respuesta:
```json
[
  {
    "ID": 1,
    "company_name": "MiCompañía"
  }
]
```

## Crear nueva ubicación

```bash
curl -X POST http://localhost:3000/api/v1/location -H "Content-Type: application/json" -d '{
  "company_api_key":"<company_api_key>",
  "company_id":1,
  "location_name":"Oficina Central",
  "location_country":"Chile",
  "location_city":"Santiago",
  "location_meta":"Piso 1"
}'
```

Respuesta:
```json
{
  "success": true,
  "location": {
    "company_id": 1,
    "location_name": "Oficina Central",
    "location_country": "Chile",
    "location_city": "Santiago",
    "location_meta": "Piso 1"
  }
}
```

## Obtener todas las ubicaciones

```bash
curl -X GET "http://localhost:3000/api/v1/locations?company_api_key=<company_api_key>"
```

Respuesta:
```json
[
  {
    "company_id": 1,
    "location_name": "Oficina Central",
    "location_country": "Chile",
    "location_city": "Santiago",
    "location_meta": "Piso 1"
  }
]
```

## Obtener todos los sensores

```bash
curl -X GET "http://localhost:3000/api/v1/sensors?company_api_key=<company_api_key>"
```

Respuesta:
```json
[
  {
    "location_id": 1,
    "sensor_id": 10,
    "sensor_name": "SensorTemperatura",
    "sensor_category": "Clima",
    "sensor_meta": "Exterior"
  }
]
```

## Crear nuevo sensor

```bash
curl -X POST http://localhost:3000/api/v1/sensor -H "Content-Type: application/json" -d '{
  "company_api_key":"<company_api_key>",
  "location_id":1,
  "sensor_name":"SensorTemperatura",
  "sensor_category":"Clima",
  "sensor_meta":"Exterior"
}'
```

Respuesta:
```json
{
  "success": "true",
  "sensor_api_key": "<sensor_api_key>"
}
```

## Insertar datos del sensor

```bash
curl -X POST http://localhost:3000/api/v1/sensor_data -H "Content-Type: application/json" -d '{
  "sensor_api_key":"<sensor_api_key>",
  "json_data":[
    {"data_key":"temperatura","data_value":"25"},
    {"data_key":"humedad","data_value":"60"}
  ]
}'
```

Respuesta:
```json
{
  "success": true
}
```

## Consultar datos del sensor

```bash
curl -X GET "http://localhost:3000/api/v1/sensor_data?company_api_key=<company_api_key>&sensor_id=10&from=1670000000&to=1679999999"
```

Respuesta:
```json
[
  {
    "sensor_id": 10,
    "data_key": "temperatura",
    "data_value": "25",
    "timestamp": "2024-12-09T12:00:00.000Z"
  },
  {
    "sensor_id": 10,
    "data_key": "humedad",
    "data_value": "60",
    "timestamp": "2024-12-09T12:00:00.000Z"
  }
]
```

## Eliminar una ubicación

```bash
curl -X DELETE http://localhost:3000/api/v1/location/1 -H "Content-Type: application/json" -d '{"company_api_key":"<company_api_key>"}'
```

Respuesta:
```json
{
  "success": true
}
```

## Obtener un sensor por ID

```bash
curl -X GET "http://localhost:3000/api/v1/sensor/10?company_api_key=<company_api_key>"
```

Respuesta:
```json
{
  "location_id": 1,
  "sensor_id": 10,
  "sensor_name": "SensorTemperatura",
  "sensor_category": "Clima",
  "sensor_meta": "Exterior"
}
```

## Eliminar un sensor

```bash
curl -X DELETE http://localhost:3000/api/v1/sensor/10 -H "Content-Type: application/json" -d '{"company_api_key":"<company_api_key>"}'
```

Respuesta:
```json
{
  "success": true
}
```

