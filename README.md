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
To log in, send a `POST` request to the `/api/v1/login` endpoint.

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