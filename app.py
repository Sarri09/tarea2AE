from flask import Flask, jsonify, request
import duckdb

app = Flask(__name__)
conn = duckdb.connect('database.db')
with open('init.sql', 'r') as f:
    conn.execute(f.read())

@app.route('/query', methods=['POST'])
def query():
    querytext = request.json.get('query', '')
    parameters = request.json.get('parameters', [])  # Leer parámetros
    try:
        # Ejecutar la consulta con los parámetros
        result = conn.execute(querytext, parameters).fetchall()
        # DuckDB ahora reemplazará $1, $2, etc. con los valores en `parameters`
        return jsonify({
            "columns": [desc[0] for desc in conn.description],
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)