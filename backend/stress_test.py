"""
Binary EquaLab - Script de Pruebas de Estrés de la API CAS

Este script envía múltiples peticiones concurrentes a los endpoints del backend
para evaluar la estabilidad, concurrencia y velocidad del motor en C++ EquaCore y SymPy.
"""
import asyncio
import time
import statistics
import httpx

# Configuración de la prueba de carga
URL_BASE = "http://localhost:8000"
PETICIONES_CONCURRENTES = 50
TOTAL_PETICIONES = 500

# Expresiones complejas para evaluar la robustez y fidelidad del motor matemático
EXPRESIONES_PRUEBA = [
    {"url": "/api/simplify", "datos": {"expression": "x^2 + 2*x + 1 - (x + 1)^2", "variable": "x"}},
    {"url": "/api/expand", "datos": {"expression": "(x + y + z)^3", "variable": "x"}},
    {"url": "/api/factor", "datos": {"expression": "x^4 - 16", "variable": "x"}},
    {"url": "/api/derivative", "datos": {"expression": "sin(x) * cos(x) * exp(x)", "variable": "x", "order": 1}},
    {"url": "/api/derivative", "datos": {"expression": "x^5 - 5*x^4 + 10*x^3 - 10*x^2 + 5*x - 1", "variable": "x", "order": 2}},
    {"url": "/api/limit", "datos": {"expression": "sin(x)/x", "variable": "x", "point": "0", "direction": "+"}},
    {"url": "/api/taylor", "datos": {"expression": "exp(x)", "variable": "x", "point": "0", "order": 5}},
    {"url": "/api/solve", "datos": {"expression": "x^2 - 5*x + 6", "variable": "x"}}
]

async def enviar_peticion_estres(cliente_http: httpx.AsyncClient, identificador: int, estadisticas_tiempos: list):
    """Envia una petición individual, mide su tiempo de respuesta y verifica su éxito."""
    # Seleccionar una expresión matemática de forma cíclica
    caso_prueba = EXPRESIONES_PRUEBA[identificador % len(EXPRESIONES_PRUEBA)]
    url = f"{URL_BASE}{caso_prueba['url']}"
    datos = caso_prueba['datos']
    
    tiempo_inicio = time.perf_counter()
    try:
        respuesta = await cliente_http.post(url, json=datos, timeout=30.0)
        tiempo_fin = time.perf_counter()
        duracion = (tiempo_fin - tiempo_inicio) * 1000  # En milisegundos
        
        exito_api = False
        detalles_error = None
        if respuesta.status_code == 200:
            datos_respuesta = respuesta.json()
            # La respuesta del backend de Binary EquaLab tiene un campo 'success'
            if datos_respuesta.get("success", True):
                exito_api = True
            else:
                detalles_error = datos_respuesta.get("error", "Error interno de la CAS")
        else:
            detalles_error = f"Código HTTP {respuesta.status_code}"
            
        estadisticas_tiempos.append({
            "exito": exito_api,
            "duracion": duracion,
            "error": detalles_error
        })
    except Exception as error_red:
        tiempo_fin = time.perf_counter()
        duracion = (tiempo_fin - tiempo_inicio) * 1000
        estadisticas_tiempos.append({
            "exito": False,
            "duracion": duracion,
            "error": str(error_red)
        })

async def orquestar_prueba_estres():
    """Divide las peticiones en ráfagas concurrentes para evitar sobrecargar los descriptores de sockets del SO."""
    lista_tiempos = []
    
    print("=" * 60)
    print("🧪 INICIANDO PRUEBAS DE ESTRÉS DE BINARY EQUALAB")
    print(f"URL de pruebas: {URL_BASE}")
    print(f"Peticiones concurrentes simultáneas: {PETICIONES_CONCURRENTES}")
    print(f"Total de peticiones planificadas: {TOTAL_PETICIONES}")
    print("=" * 60)
    
    # Crear cliente asíncrono con límites de conexión configurados
    limites_conexion = httpx.Limits(max_keepalive_connections=50, max_connections=100)
    
    tiempo_total_inicio = time.perf_counter()
    
    async with httpx.AsyncClient(limits=limites_conexion) as cliente_http:
        peticiones_restantes = TOTAL_PETICIONES
        contador_peticiones = 0
        
        while peticiones_restantes > 0:
            grupo_actual = min(PETICIONES_CONCURRENTES, peticiones_restantes)
            tareas = []
            
            for _ in range(grupo_actual):
                tareas.append(enviar_peticion_estres(cliente_http, contador_peticiones, lista_tiempos))
                contador_peticiones += 1
            
            # Ejecutar el lote de peticiones concurrentemente
            await asyncio.gather(*tareas)
            peticiones_restantes -= grupo_actual
            print(f"-> Procesadas {contador_peticiones}/{TOTAL_PETICIONES} peticiones...")
            
            # Pequeña pausa de estabilización entre ráfagas
            await asyncio.sleep(0.1)
            
    tiempo_total_fin = time.perf_counter()
    duracion_total_segundos = tiempo_total_fin - tiempo_total_inicio
    
    # Análisis y reporte de resultados de las pruebas
    procesar_resultados_estres(lista_tiempos, duracion_total_segundos)

def procesar_resultados_estres(lista_tiempos: list, duracion_total: float):
    """Calcula y muestra métricas estadísticas en la consola."""
    exitosos = [t for t in lista_tiempos if t["exito"]]
    fallidos = [t for t in lista_tiempos if not t["exito"]]
    
    total_efectivo = len(lista_tiempos)
    porcentaje_exito = (len(exitosos) / total_efectivo * 100) if total_efectivo > 0 else 0
    
    tiempos_exitosos = [t["duracion"] for t in exitosos]
    
    print("\n" + "=" * 60)
    print("📊 RESULTADOS FINALES DE LA PRUEBA DE ESTRÉS")
    print("=" * 60)
    print(f"Duración total del test: {duracion_total:.2f} segundos")
    print(f"Total de peticiones procesadas: {total_efectivo}")
    print(f"Peticiones exitosas: {len(exitosos)} ({porcentaje_exito:.1f}%)")
    print(f"Peticiones fallidas: {len(fallidos)} ({100 - porcentaje_exito:.1f}%)")
    
    if tiempos_exitosos:
        tiempo_minimo = min(tiempos_exitosos)
        tiempo_maximo = max(tiempos_exitosos)
        tiempo_promedio = statistics.mean(tiempos_exitosos)
        desviacion_estandar = statistics.stdev(tiempos_exitosos) if len(tiempos_exitosos) > 1 else 0.0
        percentil_95 = sorted(tiempos_exitosos)[int(len(tiempos_exitosos) * 0.95)]
        
        print("-" * 60)
        print("Tiempos de respuesta (solo exitosas):")
        print(f"  Mínimo: {tiempo_minimo:.1f} ms")
        print(f"  Promedio: {tiempo_promedio:.1f} ms")
        print(f"  Máximo: {tiempo_maximo:.1f} ms")
        print(f"  Percentil 95: {percentil_95:.1f} ms")
        print(f"  Desviación Estándar: {desviacion_estandar:.1f} ms")
        print(f"  Tasa de transferencia (Throughput): {total_efectivo / duracion_total:.1f} pet/seg")
    else:
        print("\n[!] Todas las peticiones fallaron. No se pueden calcular métricas de tiempo.")
        
    if fallidos:
        print("-" * 60)
        print("Errores más frecuentes encontrados:")
        errores_conteo = {}
        for f in fallidos:
            err = f["error"]
            errores_conteo[err] = errores_conteo.get(err, 0) + 1
        
        for error_msg, conteo in sorted(errores_conteo.items(), key=lambda item: item[1], reverse=True)[:5]:
            print(f"  - [{conteo} veces] {error_msg}")
            
    print("=" * 60 + "\n")

if __name__ == "__main__":
    asyncio.run(orquestar_prueba_estres())
