import requests
import time

API_URL = "http://localhost:8000/api/cas/evaluate"

tests = [
    {
        "name": "Matriz Base (Sintaxis anidada)",
        "payload": {"expression": "[[1, 2], [3, 4]]"},
        "expected_in_latex": r"\left[\begin{matrix}1 & 2\\3 & 4\end{matrix}\right]"
    },
    {
        "name": "Determinante",
        "payload": {"expression": "det([[1, 2], [3, 4]])"},
        "expected_result": "-2"
    },
    {
        "name": "Inversa",
        "payload": {"expression": "inversa([[1, 2], [3, 4]])"},
        "expected_in_latex": r"\left[\begin{matrix}-2 & 1\\\frac{3}{2} & - \frac{1}{2}\end{matrix}\right]"
    },
    {
        "name": "Transpuesta",
        "payload": {"expression": "transpuesta([[1, 2], [3, 4]])"},
        "expected_in_latex": r"\left[\begin{matrix}1 & 3\\2 & 4\end{matrix}\right]"
    },
    {
        "name": "Identidad (3x3)",
        "payload": {"expression": "identidad(3)"},
        "expected_in_latex": r"\left[\begin{matrix}1 & 0 & 0\\0 & 1 & 0\\0 & 0 & 1\end{matrix}\right]"
    },
    {
        "name": "Media (Promedio)",
        "payload": {"expression": "media([10, 20, 30, 40, 50])"},
        "expected_result": "30.0"
    },
    {
        "name": "Mediana (Par)",
        "payload": {"expression": "mediana([10, 40, 20, 30])"},
        "expected_result": "25.0"
    },
    {
        "name": "Mediana (Impar)",
        "payload": {"expression": "mediana([10, 40, 20, 30, 50])"},
        "expected_result": "30"
    },
    {
        "name": "Varianza Muestral",
        "payload": {"expression": "varianza([1, 2, 3, 4, 5])"},
        "expected_result": "2.5"
    },
    {
        "name": "Desviación Estándar",
        "payload": {"expression": "desviacion([2, 4, 4, 4, 5, 5, 7, 9])"},
        "expected_result": "sqrt(32/7)" # Aproximadamente 2.138, pero SymPy lo deja simbólico
    }
]

print("==================================================")
print("INICIANDO PRUEBAS AUTOMATIZADAS - FASE 3 Y 4")
print("==================================================\n")

passed = 0
for t in tests:
    print(f"Prueba: {t['name']}")
    print(f"  Enviando: {t['payload']['expression']}")
    start = time.time()
    try:
        res = requests.post(API_URL, json=t['payload'], timeout=5)
        dur = time.time() - start
        
        if res.status_code == 200:
            data = res.json()
            result_str = str(data.get('result', ''))
            latex_str = str(data.get('latex', ''))
            
            success = False
            if 'expected_result' in t:
                # Truncar decimales si es necesario para comparar float o revisar si está contenido
                # Para simplificar, vemos si está en el string o si es igual
                if t['expected_result'] in result_str or float_eq(t['expected_result'], result_str):
                     success = True
                else:
                     # Intentar conversión robusta (SymPy a veces devuelve números exactos o aproximados)
                     success = t['expected_result'] == result_str
            elif 'expected_in_latex' in t:
                success = t['expected_in_latex'] in latex_str or latex_str.replace(" ", "") == t['expected_in_latex'].replace(" ", "")
                
            if success:
                print(f"  EXITO ({dur:.3f}s)")
                passed += 1
            else:
                print(f"  FALLO LOGICO ({dur:.3f}s)")
                print(f"    Esperado: {t.get('expected_result') or t.get('expected_in_latex')}")
                print(f"    Obtenido (Result): {result_str}")
                print(f"    Obtenido (LaTeX): {latex_str}")
        else:
            print(f"  FALLO HTTP {res.status_code} ({dur:.3f}s)")
            print(f"  Detalle: {res.text}")
    except Exception as e:
        dur = time.time() - start
        print(f"  ERROR CRITICO ({dur:.3f}s)")
        print(f"  Excepcion: {e}")
    print()

print("==================================================")
print(f"RESOLUCION FINAL: {passed} / {len(tests)} PRUEBAS SUPERADAS")
print("==================================================")

def float_eq(a_str, b_str):
    try:
        return abs(float(a_str) - float(b_str)) < 1e-5
    except:
        return False
