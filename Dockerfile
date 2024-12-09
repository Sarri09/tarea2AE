# Usa una imagen base de Python
FROM python:3.10-slim

# Actualiza pip e instala las dependencias necesarias
RUN pip install --upgrade pip
RUN pip install duckdb flask flask_cors

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios al contenedor
COPY init.sql /app/init.sql
COPY app.py /app/app.py

# Expone el puerto 9000
EXPOSE 9000

# Comando de inicio
CMD ["python", "app.py"]
