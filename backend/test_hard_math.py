import time
import requests

API_URL = "http://localhost:8000"

tests = [
    {
        "name": "1. Derivada de orden superior (Cadena masiva)",
        "endpoint": "/api/cas/derivative",
        "payload": {"expression": "sin(exp(x^2)) * log(cos(x))", "var": "x", "order": 3}
    },
    {
        "name": "2. Límite de alta complejidad (L'Hôpital repetido)",
        "endpoint": "/api/cas/limit",
        "payload": {"expression": "(sin(x) - x + (x^3)/6) / (x^5)", "var": "x", "point": "0", "direction": "+"}
    },
    {
        "name": "3. Serie de Taylor extendida (Orden 15)",
        "endpoint": "/api/cas/taylor",
        "payload": {"expression": "tan(x)", "var": "x", "point": "0", "order": 15}
    },
    {
        "name": "4. Expansión Polinomial Extrema",
        "endpoint": "/api/cas/expand",
        "payload": {"expression": "(x + y + z)^15", "variable": "x"}
    },
    {
        "name": "5. Factorización de número gigante (RSA-like small)",
        "endpoint": "/api/cas/evaluate",
        "payload": {"expression": "factorint(12345678901234567890)", "expression_type": "math"}
    },
    {
        "name": "6. Transformada de Laplace Compleja (Decaimiento oscilatorio)",
        "endpoint": "/api/cas/laplace",
        "payload": {"expression": "t^5 * sin(3*t) * exp(-2*t)"}
    },
    {
        "name": "7. Integral Indefinida Intensa",
        "endpoint": "/api/cas/integrate",
        "payload": {"expression": "x^3 * exp(-x^2) * sin(x)", "var": "x"}
    }
]

print("==================================================")
print("INICIANDO PRUEBAS DE ESTRES - BINARY EQUALAB")
print("==================================================\n")

passed = 0
for t in tests:
    print(f"Prueba: {t['name']}")
    print(f"  Enviando: {t['payload']['expression']}")
    start = time.time()
    try:
        res = requests.post(f"{API_URL}{t['endpoint']}", json=t['payload'], timeout=30)
        dur = time.time() - start
        
        if res.status_code == 200:
            data = res.json()
            engine = data.get('engine', 'N/A')
            result_str = str(data.get('result', data))
            
            print(f"  EXITO ({dur:.3f}s) | Motor: {engine}")
            # Mostrar solo los primeros 150 caracteres para no saturar la consola
            print(f"  Resultado: {result_str[:150] + '...' if len(result_str) > 150 else result_str}\n")
            passed += 1
        else:
            print(f"  FALLO! HTTP {res.status_code} ({dur:.3f}s)")
            print(f"  Detalle: {res.text}\n")
    except Exception as e:
        dur = time.time() - start
        print(f"  ERROR CRITICO ({dur:.3f}s)")
        print(f"  Excepcion: {e}\n")

print("==================================================")
print(f"RESOLUCION FINAL: {passed} / {len(tests)} PRUEBAS SUPERADAS")
print("==================================================")
