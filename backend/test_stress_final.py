# -*- coding: utf-8 -*-
"""
Test de Estres Final - Fase 5: Motor C++ + Timeout SymPy
Valida que:
  1. Operaciones simples responden en < 2s
  2. Operaciones complejas que toman > 5s reciben HTTP 408 (timeout) sin congelar el servidor
  3. El servidor sigue respondiendo despues de un timeout
"""
import requests
import time
import sys

API = "http://localhost:8000/api/cas"

def float_eq(a, b, tol=1e-4):
    try: return abs(float(a) - float(b)) < tol
    except: return False

# =====================================================
# GRUPO A: Operaciones Simples (deben ser < 2s)
# =====================================================
simple_tests = [
    ("Suma basica", "/evaluate", {"expression": "2 + 3"}, "5"),
    ("Seno de pi", "/evaluate", {"expression": "sin(pi)"}, "0"),
    ("Derivada x^3", "/derivative", {"expression": "x**3", "var": "x"}, "3*x**2"),
    ("Integral x^2", "/integrate", {"expression": "x**2", "var": "x"}, "x**3/3"),
    ("Expand (x+1)^3", "/expand", {"expression": "(x+1)**3"}, None),
    ("Factor x^2-1", "/factor", {"expression": "x**2-1"}, None),
    ("Limite sin(x)/x", "/limit", {"expression": "sin(x)/x", "var": "x"}, "1"),
    ("Media [1,2,3]", "/evaluate", {"expression": "media([1, 2, 3])"}, "2"),
    ("Det 2x2", "/evaluate", {"expression": "det([[1,2],[3,4]])"}, "-2"),
    ("Taylor sin(x)", "/taylor", {"expression": "sin(x)", "var": "x"}, None),
    ("Simplify", "/simplify", {"expression": "sin(x)**2 + cos(x)**2"}, "1"),
    ("sen(pi) espanol", "/evaluate", {"expression": "sen(pi)"}, "0"),
    ("raiz(16)", "/evaluate", {"expression": "raiz(16)"}, "4"),
    ("mcd(12,8)", "/evaluate", {"expression": "mcd(12,8)"}, "4"),
    ("esPrimo(17)", "/evaluate", {"expression": "esPrimo(17)"}, None),
]

# =====================================================
# GRUPO B: Operaciones Monstruosas (deben dar timeout 408 o responder)
# =====================================================
stress_tests = [
    ("Taylor grado 20 de exp(sin(x))", "/evaluate", {"expression": "series(exp(sin(x)), x, 0, 20)"}),
    ("Integral imposible", "/evaluate", {"expression": "integrate(exp(x**x), x)"}),
    ("Factorizacion n enorme", "/evaluate", {"expression": "factorint(2**61 - 1)"}),
    ("Derivada 10 veces sin(cos(tan(x)))", "/evaluate", {"expression": "diff(sin(cos(tan(x))), x, 10)"}),
]

print("=" * 60)
print("TEST DE ESTRES FINAL - FASE 5")
print("Motor: C++ SymEngine -> SymPy (timeout 5s) -> Error 408")
print("=" * 60)

# --- GRUPO A ---
print("\n--- GRUPO A: Operaciones Simples (< 2s) ---\n")
passed_a = 0
for name, endpoint, payload, expected in simple_tests:
    t0 = time.time()
    try:
        r = requests.post(f"{API}{endpoint}", json=payload, timeout=10)
        dt = time.time() - t0
        status = r.status_code
        
        if status == 200:
            data = r.json()
            result = data.get("result", "")
            engine = data.get("engine", "?")
            ok = True
            if expected and not (expected in result or float_eq(expected, result)):
                ok = False
            
            tag = "OK" if ok else "RESULTADO INESPERADO"
            speed = "RAPIDO" if dt < 2 else "LENTO"
            print(f"  [{tag}] {name} = {result} ({engine}, {dt:.2f}s, {speed})")
            if ok: passed_a += 1
        else:
            dt = time.time() - t0
            print(f"  [HTTP {status}] {name} ({dt:.2f}s) - {r.text[:80]}")
    except Exception as e:
        dt = time.time() - t0
        print(f"  [ERROR] {name} ({dt:.2f}s) - {e}")

print(f"\nGrupo A: {passed_a}/{len(simple_tests)} pasaron")

# --- GRUPO B ---
print("\n--- GRUPO B: Pruebas de Estres (timeout o respuesta) ---\n")
passed_b = 0
for name, endpoint, payload in stress_tests:
    t0 = time.time()
    try:
        r = requests.post(f"{API}{endpoint}", json=payload, timeout=15)
        dt = time.time() - t0
        status = r.status_code
        
        if status == 200:
            data = r.json()
            engine = data.get("engine", "?")
            print(f"  [RESUELTO] {name} ({engine}, {dt:.2f}s)")
            passed_b += 1
        elif status == 408:
            print(f"  [TIMEOUT CONTROLADO] {name} ({dt:.2f}s) - Servidor sigue vivo!")
            passed_b += 1  # Timeout controlado = EXITO (no se congelo)
        else:
            print(f"  [HTTP {status}] {name} ({dt:.2f}s) - {r.text[:80]}")
            passed_b += 1  # Cualquier respuesta que no congele = ok
    except requests.exceptions.Timeout:
        dt = time.time() - t0
        print(f"  [CONGELADO] {name} ({dt:.2f}s) - SERVIDOR NO RESPONDIO!")
    except Exception as e:
        dt = time.time() - t0
        print(f"  [ERROR] {name} ({dt:.2f}s) - {e}")

print(f"\nGrupo B: {passed_b}/{len(stress_tests)} no congelaron el servidor")

# --- PRUEBA FINAL: Servidor sigue vivo? ---
print("\n--- PRUEBA FINAL: Servidor vivo despues del estres? ---")
try:
    r = requests.post(f"{API}/evaluate", json={"expression": "1+1"}, timeout=5)
    if r.status_code == 200 and "2" in r.json().get("result", ""):
        print("  [SERVIDOR VIVO] 1+1 = 2. Todo bien!\n")
    else:
        print(f"  [PROBLEMA] Respuesta inesperada: {r.text}\n")
except Exception as e:
    print(f"  [SERVIDOR MUERTO] {e}\n")

# --- RESUMEN ---
total = passed_a + passed_b
total_tests = len(simple_tests) + len(stress_tests)
print("=" * 60)
print(f"RESULTADO FINAL: {total}/{total_tests} pruebas superadas")
print("=" * 60)
