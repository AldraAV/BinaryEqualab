from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
import sys
import os
import concurrent.futures
import sympy as sp
import re

# =============================================================================
# Helper: Límite de tiempo para evitar bloqueos
# =============================================================================
TIEMPO_LIMITE_SEGUNDOS = 5

def con_limite_tiempo(funcion, *argumentos, tiempo_limite=TIEMPO_LIMITE_SEGUNDOS):
    """Ejecuta una función en un hilo con límite de tiempo. Si tarda más, lanza TimeoutError."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        futuro = pool.submit(funcion, *argumentos)
        return futuro.result(timeout=tiempo_limite)

# =============================================================================
# Motores C++ Nativo y SymEngine
# =============================================================================
TIENE_EQUACORE = False
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../engine/python'))
    import equacore
    from equacore import _equacore as eq
    TIENE_EQUACORE = True
except ImportError:
    TIENE_EQUACORE = False

TIENE_SYMENGINE = False
try:
    import symengine as _sym
    TIENE_SYMENGINE = True
except ImportError:
    pass

# =============================================================================
# Funciones Auxiliares en Español
# =============================================================================
def traducir_latex_espanol(cadena_latex: str) -> str:
    """Traduce funciones matemáticas en LaTeX al español."""
    reemplazos = {
        r'\sin': r'\operatorname{sen}',
        r'\arcsin': r'\operatorname{arcsen}',
        r'\sinh': r'\operatorname{senh}',
        r'\arcsinh': r'\operatorname{arcsenh}',
        r'\csc': r'\operatorname{csc}',
        r'\sec': r'\operatorname{sec}',
        r'\cot': r'\operatorname{cot}',
        r'\log': r'\ln',
    }
    for ingles, espanol in reemplazos.items():
        cadena_latex = cadena_latex.replace(ingles, espanol)
    return cadena_latex

def convertir_base_numerica(numero, base_origen, base_destino):
    """Convierte un número entre diferentes bases."""
    cadena_num = str(numero).replace(' ', '').strip(' "\'')
    base_o = int(str(base_origen).strip(' "\''))
    base_d = int(str(base_destino).strip(' "\''))
    valor = int(cadena_num, base_o)
    if base_d == 10:
        return sp.sympify(valor)
    elif base_d == 2:
        return sp.Symbol(bin(valor)[2:])
    elif base_d == 8:
        return sp.Symbol(oct(valor)[2:])
    elif base_d == 16:
        return sp.Symbol(hex(valor)[2:].upper())
    else:
        import numpy as np
        return sp.Symbol(np.base_repr(valor, base=base_d))

def convertir_unidad_fisica(valor, unidad_origen, unidad_destino):
    """Convierte un valor entre diferentes unidades físicas."""
    from sympy.physics.units import convert_to
    import sympy.physics.units as u
    uni_o = getattr(u, str(unidad_origen).strip(' "\''), None)
    uni_d = getattr(u, str(unidad_destino).strip(' "\''), None)
    if uni_o and uni_d:
        return convert_to(valor * uni_o, uni_d)
    return valor

# =============================================================================
# Enrutador y Modelos
# =============================================================================
enrutador_consola = APIRouter(prefix="/api/consola", tags=["Consola"])

class PeticionConsola(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    expresion: str = Field(..., alias="expression")
    variable: str = "x"

@enrutador_consola.post("/evaluar")
def evaluar_comando(peticion: PeticionConsola):
    """
    Punto de entrada principal para la Consola.
    Orquesta las solicitudes enviadas desde el frontend y las enruta a EquaCore o SymPy.
    """
    cadena_expresion = peticion.expresion
    
    PALABRAS_SYMPY = [
        'sumatoria', 'productoria', 'normal', 'normalpdf', 'binomialpmf',
        'binomialcdf', 'normalcdf', 'poissonpmf', 'poissoncdf', 'aleatorio', 'aleatorio_entero',
        'sen', 'arcsen', 'senh', 'arcsenh', 'arccosh', 'arctanh', 'raiz', 'raizcub', 'modulo',
        'maximo', 'minimo', 'signo', 'piso', 'techo', 'factorial', 'mcd', 'mcm',
        'combinar', 'esPrimo', 'factoresPrimos', 'parciales', 'Matriz',
        'determinante', 'inversa', 'transpuesta', 'identidad', 'ceros', 'unos',
        'media', 'mediana', 'varianza', 'desviacion', 'resolver', 'Igual',
        'convertir_', 'N', 'grados', 'radianes'
    ]
    requiere_sympy = any(re.search(rf'\b{palabra}\b', peticion.expresion) for palabra in PALABRAS_SYMPY)
    
    # NIVEL 1: EquaCore C++ (SymEngine) — ultra rápido
    if TIENE_SYMENGINE and not requiere_sympy:
        try:
            parseado = _sym.sympify(cadena_expresion)
            simplificado = _sym.expand(parseado)
            resultado_cadena = str(simplificado)
            
            valor_aproximado = None
            try:
                temporal_sympy = sp.sympify(resultado_cadena)
                valor_aproximado = str(temporal_sympy.evalf())
            except Exception:
                pass

            try:
                cadena_latex = traducir_latex_espanol(sp.latex(sp.sympify(resultado_cadena)))
            except Exception:
                cadena_latex = resultado_cadena
                
            return {
                "resultado": resultado_cadena,
                "latex": cadena_latex,
                "aproximacion": valor_aproximado,
                "motor": "equacore-symengine"
            }
        except Exception:
            pass  # Falla silenciosa, delegar a SymPy
            
    # NIVEL 2: SymPy (Python) — Funciones avanzadas y en español
    def_sympy_evaluar = lambda expresion: procesar_con_sympy(expresion)
    
    try:
        return con_limite_tiempo(def_sympy_evaluar, cadena_expresion, tiempo_limite=TIEMPO_LIMITE_SEGUNDOS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"La expresión es demasiado compleja (límite de {TIEMPO_LIMITE_SEGUNDOS}s superado).")
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Error evaluando comando: {str(error)}")

def procesar_con_sympy(cadena_expr: str):
    """Procesa la expresión usando SymPy con mapeo completo al español."""
    espacio_nombres = {
        'sen': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
        'csc': sp.csc, 'sec': sp.sec, 'cot': sp.cot,
        'arcsen': sp.asin, 'arccos': sp.acos, 'arctan': sp.atan,
        'senh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh,
        'raiz': sp.sqrt, 'raizcub': sp.cbrt, 'absoluto': sp.Abs,
        'modulo': sp.Mod, 'maximo': sp.Max, 'minimo': sp.Min,
        'signo': sp.sign, 'piso': sp.floor, 'techo': sp.ceiling,
        'factorial': sp.factorial,
        'mcd': sp.gcd, 'mcm': sp.lcm,
        'combinar': sp.binomial, 'esPrimo': sp.isprime,
        'factoresPrimos': sp.factorint, 'parciales': sp.apart,
        'pi': sp.pi, 'infinito': sp.oo,
        'Matriz': sp.Matrix, 'determinante': lambda M: sp.Matrix(M).det(),
        'inversa': lambda M: sp.Matrix(M).inv(),
        'transpuesta': lambda M: sp.Matrix(M).transpose(),
        'identidad': sp.eye, 'ceros': sp.zeros, 'unos': sp.ones,
        'media': lambda L: sum(L)/len(L),
        'mediana': lambda L: sorted(L)[len(L)//2] if len(L)%2!=0 else (sorted(L)[len(L)//2 - 1] + sorted(L)[len(L)//2])/2,
        'varianza': lambda L: sum((x - sum(L)/len(L))**2 for x in L) / (len(L)-1 if len(L)>1 else 1),
        'desviacion': lambda L: sp.sqrt(sum((x - sum(L)/len(L))**2 for x in L) / (len(L)-1 if len(L)>1 else 1)),
        'resolver': sp.solve, 'Igual': sp.Eq,
        'convertir_base': convertir_base_numerica,
        'convertir_unidad': convertir_unidad_fisica,
        'normalpdf': lambda x, mu, sigma: (1/(sp.sympify(sigma)*sp.sqrt(2*sp.pi))) * sp.exp(-0.5*((sp.sympify(x)-sp.sympify(mu))/sp.sympify(sigma))**2),
        'normalcdf': lambda x, mu, sigma: 0.5 * (1 + sp.erf((sp.sympify(x) - sp.sympify(mu)) / (sp.sympify(sigma) * sp.sqrt(2)))),
        'normal': lambda x, mu, sigma: (1/(sp.sympify(sigma)*sp.sqrt(2*sp.pi))) * sp.exp(-0.5*((sp.sympify(x)-sp.sympify(mu))/sp.sympify(sigma))**2),
        'binomialpmf': lambda k, n, p: sp.binomial(n, k) * (sp.sympify(p)**sp.sympify(k)) * ((1-sp.sympify(p))**(sp.sympify(n)-sp.sympify(k))),
        'binomialcdf': lambda k, n, p: sum([sp.binomial(n, i) * (sp.sympify(p)**i) * ((1-sp.sympify(p))**(sp.sympify(n)-i)) for i in range(int(k)+1)]),
        'poissonpmf': lambda k, lam: (sp.sympify(lam)**sp.sympify(k) * sp.exp(-sp.sympify(lam))) / sp.factorial(sp.sympify(k)),
        'poissoncdf': lambda k, lam: sp.exp(-sp.sympify(lam)) * sum([(sp.sympify(lam)**i) / sp.factorial(i) for i in range(int(k)+1)]),
        'aleatorio': lambda: __import__('random').random(),
        'aleatorio_entero': lambda a, b: __import__('random').randint(int(a), int(b)),
        'sumatoria': lambda expr, var, inicio, fin: sp.Sum(sp.sympify(expr), (sp.sympify(var), sp.sympify(inicio), sp.sympify(fin))),
        'productoria': lambda expr, var, inicio, fin: sp.Product(sp.sympify(expr), (sp.sympify(var), sp.sympify(inicio), sp.sympify(fin))),
        'sustituir': lambda expr, var, val: sp.sympify(expr).subs(sp.sympify(var), sp.sympify(val)),
        'grados': lambda rad: sp.sympify(rad) * 180 / sp.pi,
        'radianes': lambda deg: sp.sympify(deg) * sp.pi / 180,
        # Fallbacks en inglés por si el parser no tradujo algo
        'sin': sp.sin, 'sqrt': sp.sqrt, 'solve': sp.solve, 'sum': sp.Sum,
        'sinh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh, 'asinh': sp.asinh, 'acosh': sp.acosh, 'atanh': sp.atanh,
        'arcsenh': sp.asinh, 'arccosh': sp.acosh, 'arctanh': sp.atanh,
        'N': lambda x, mu, sigma: (1/(sp.sympify(sigma)*sp.sqrt(2*sp.pi))) * sp.exp(-0.5*((sp.sympify(x)-sp.sympify(mu))/sp.sympify(sigma))**2)
    }
    
    # Manejo especial: factorint
    if 'factoresPrimos(' in cadena_expr:
        resultado_busqueda = re.search(r'factoresPrimos\((.+)\)', cadena_expr)
        if resultado_busqueda:
            numero = int(sp.sympify(resultado_busqueda.group(1)))
            factores = sp.factorint(numero)
            cadena_latex = " \\cdot ".join(f"{p}^{{{e}}}" if e > 1 else str(p) for p, e in sorted(factores.items()))
            return {"resultado": str(factores), "latex": cadena_latex, "motor": "sympy"}
            
    # Manejo especial: isprime
    if 'esPrimo(' in cadena_expr:
        resultado_busqueda = re.search(r'esPrimo\((.+)\)', cadena_expr)
        if resultado_busqueda:
            numero = int(sp.sympify(resultado_busqueda.group(1)))
            es_primo = sp.isprime(numero)
            etiqueta = "\\text{Sí, es primo}" if es_primo else "\\text{No es primo}"
            return {"resultado": str(es_primo), "latex": etiqueta, "motor": "sympy"}
            
    # Manejo especial: permutaciones
    if 'permutaciones(' in cadena_expr:
        resultado_busqueda = re.search(r'permutaciones\((.+?),\s*(.+?)\)', cadena_expr)
        if resultado_busqueda:
            n = sp.sympify(resultado_busqueda.group(1))
            k = sp.sympify(resultado_busqueda.group(2))
            resultado = sp.factorial(n) / sp.factorial(n - k)
            simplificado = sp.simplify(resultado)
            cadena_latex = traducir_latex_espanol(sp.latex(simplificado))
            return {"resultado": str(simplificado), "latex": cadena_latex, "motor": "sympy"}
            
    parseado = sp.sympify(cadena_expr, locals=espacio_nombres)
    
    # Convertir listas anidadas a Matrices
    if isinstance(parseado, list) and len(parseado) > 0 and isinstance(parseado[0], list):
        parseado = sp.Matrix(parseado)
        
    # Evaluar operaciones pendientes como sumatorias y productorias
    if hasattr(parseado, 'doit'):
        parseado = parseado.doit()
        
    simplificado = sp.simplify(parseado)
    cadena_latex = traducir_latex_espanol(sp.latex(simplificado))
    
    valor_aproximado = None
    try:
        valor_aproximado = str(simplificado.evalf())
    except Exception:
        pass

    return {
        "resultado": str(simplificado),
        "latex": cadena_latex,
        "aproximacion": valor_aproximado,
        "motor": "sympy"
    }
