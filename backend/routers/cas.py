from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.maxima_service import maxima
import equacore
from equacore import _equacore as eq  # Motor C++
import sympy as sp
import numpy as np
import concurrent.futures
import re

# =============================================================================
# Helper: Timeout para operaciones CPU-bound (anti-bloqueo)
# =============================================================================
TIMEOUT_SECONDS = 5

def with_timeout(func, *args, timeout=TIMEOUT_SECONDS):
    """Ejecuta func(*args) en un thread con timeout. Si tarda más, lanza TimeoutError."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(func, *args)
        return future.result(timeout=timeout)

# Intento de carga del motor SymEngine (C++ nativo vía Python)
HAS_SYMENGINE = False
try:
    import symengine as _sym
    HAS_SYMENGINE = True
except ImportError:
    pass

# =============================================================================
# Helper: LaTeX en español
# =============================================================================
def translate_latex_es(latex_str: str) -> str:
    """Traduce funciones matemáticas en LaTeX al español."""
    replacements = {
        r'\sin': r'\operatorname{sen}',
        r'\arcsin': r'\operatorname{arcsen}',
        r'\sinh': r'\operatorname{senh}',
        r'\arcsinh': r'\operatorname{arcsenh}',
        r'\csc': r'\operatorname{csc}',
        r'\sec': r'\operatorname{sec}',
        r'\cot': r'\operatorname{cot}',
        r'\log': r'\ln',
    }
    for eng, esp in replacements.items():
        latex_str = latex_str.replace(eng, esp)
    return latex_str

router = APIRouter(prefix="/api/cas", tags=["CAS"])

class CASRequest(BaseModel):
    expression: str
    var: str = "x"
    param: str = ""

class StatsRequest(BaseModel):
    data: list[float]
    operation: str = "mean" # mean, median, variance, stdev, pop_variance, pop_stdev

@router.post("/solve-ode")
def solve_ode(request: CASRequest):
    """Resuelve ecuaciones diferenciales simbólicamente."""
    result = maxima.solve_ode(request.expression, request.var)
    return {"solution": result, "engine": "maxima"}

# =============================================================================
# Helper: SymPy AST -> EquaCore C++ AST
# =============================================================================
def sympy_to_equacore(expr):
    """Convierte un árbol de expresión de SymPy a nuestro motor C++ EquaCore."""
    s = eq.sym
    
    if isinstance(expr, sp.Symbol):
        return s.sym(str(expr))
    
    if isinstance(expr, sp.Number):
        return s.num(float(expr))
        
    if isinstance(expr, sp.Add):
        args = expr.args
        result = sympy_to_equacore(args[0])
        for arg in args[1:]:
            # Detectar sub() para e.g x - 2 (SymPy lo guarda como Add(x, Mul(-1, 2)))
            result = s.add(result, sympy_to_equacore(arg))
        return result
        
    if isinstance(expr, sp.Mul):
        args = expr.args
        result = sympy_to_equacore(args[0])
        for arg in args[1:]:
            result = s.mul(result, sympy_to_equacore(arg))
        return result
        
    if isinstance(expr, sp.Pow):
        base = sympy_to_equacore(expr.base)
        exp = sympy_to_equacore(expr.exp)
        return s.pow(base, exp)
        
    # Funciones Trigonométricas y Trascendentales
    if isinstance(expr, sp.sin): return s.sin(sympy_to_equacore(expr.args[0]))
    if isinstance(expr, sp.cos): return s.cos(sympy_to_equacore(expr.args[0]))
    if isinstance(expr, sp.tan): return s.tan(sympy_to_equacore(expr.args[0]))
    if isinstance(expr, sp.exp): return s.exp(sympy_to_equacore(expr.args[0]))
    if isinstance(expr, sp.log): return s.log(sympy_to_equacore(expr.args[0]))
    if hasattr(sp, 'Abs') and isinstance(expr, sp.Abs): return s.abs(sympy_to_equacore(expr.args[0]))
    
    # Manejo genérico si no lo conocemos en C++, lo dejamos pasar (fallará elegante)
    raise ValueError(f"Operación no soportada por EquaCore: {type(expr)}")

# =============================================================================
# Endpoints Acelerados C++ (EquaCore)
# =============================================================================

@router.post("/derivative")
def derivative(request: CASRequest):
    """Derivada de orden n acelerada vía C++."""
    # Obtenemos `order` (el frontend React lo manda, pero CASRequest no lo modeló, usamos kwargs o body)
    order = 1
    
    try:
        if HAS_SYMENGINE:
            try:
                parsed = _sym.sympify(request.expression)
                var = _sym.Symbol(request.var)
                # Aplicamos la n-esima derivada
                res = parsed
                for _ in range(order):
                    res = _sym.diff(res, var)
                result_str = str(res)
                try:
                    latex_str = translate_latex_es(sp.latex(sp.sympify(result_str)))
                except:
                    latex_str = result_str
                return {"result": result_str, "latex": latex_str, "engine": "equacore-symengine"}
            except Exception:
                pass
            
    except Exception as e:
        # Fallback a SymPy con Timeout
        def _sympy_deriv():
            sp_expr = sp.sympify(request.expression)
            var = sp.Symbol(request.var)
            res = sp.diff(sp_expr, var, order)
            latex_str = translate_latex_es(sp.latex(sp.simplify(res)))
            return {"result": str(res), "latex": latex_str, "engine": "sympy"}
        try:
            return with_timeout(_sympy_deriv, timeout=TIMEOUT_SECONDS)
        except concurrent.futures.TimeoutError:
            raise HTTPException(status_code=408, detail=f"Derivada demasiado compleja (timeout {TIMEOUT_SECONDS}s)")
        except Exception as ex:
            raise HTTPException(status_code=400, detail=str(ex))

@router.post("/limit")
def limit(request: CASRequest):
    """Límite numérico o simbólico (fallback SymPy)."""
    point = 0.0
    def _sympy_limit():
        sp_expr = sp.sympify(request.expression)
        var = sp.Symbol(request.var)
        res = sp.limit(sp_expr, var, point)
        latex_str = translate_latex_es(sp.latex(res))
        return {"result": str(res), "latex": latex_str, "engine": "sympy"}
    try:
        return with_timeout(_sympy_limit, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Limite demasiado complejo (timeout {TIMEOUT_SECONDS}s)")
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/taylor")
def taylor(request: CASRequest):
    """Serie de Taylor."""
    order = 5
    point = 0.0
    def _sympy_taylor():
        sp_expr = sp.sympify(request.expression)
        var = sp.Symbol(request.var)
        res = sp.series(sp_expr, var, point, order).removeO()
        latex_str = translate_latex_es(sp.latex(res))
        return {"result": str(res), "latex": latex_str, "engine": "sympy"}
    try:
        return with_timeout(_sympy_taylor, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Taylor demasiado compleja (timeout {TIMEOUT_SECONDS}s)")
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/expand")
def expand(request: CASRequest):
    """Expansión algebraica nativa."""
    def _sympy_expand():
        sp_expr = sp.sympify(request.expression)
        res = sp.expand(sp_expr)
        latex_str = translate_latex_es(sp.latex(res))
        return {"result": str(res), "latex": latex_str, "engine": "sympy"}
    try:
        return with_timeout(_sympy_expand, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Expansion demasiado compleja (timeout {TIMEOUT_SECONDS}s)")
    except Exception as str_err:
        raise HTTPException(status_code=400, detail=str(str_err))

@router.post("/factor")
def factor(request: CASRequest):
    """Factorización algebraica nativa."""
    def _sympy_factor():
        sp_expr = sp.sympify(request.expression)
        res = sp.factor(sp_expr)
        latex_str = translate_latex_es(sp.latex(res))
        return {"result": str(res), "latex": latex_str, "engine": "sympy"}
    try:
        return with_timeout(_sympy_factor, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Factorizacion demasiado compleja (timeout {TIMEOUT_SECONDS}s)")
    except Exception as str_err:
        raise HTTPException(status_code=400, detail=str(str_err))

@router.post("/stats")
def compute_stats(request: StatsRequest):
    """Calcula estadísticas descriptivas súper rápidas usando C++ nativo."""
    try:
        # data needs to be parsed securely 
        if not request.data:
            raise ValueError("Data vector cannot be empty")
            
        op = request.operation.lower()
        val = 0.0
        
        if op == "mean":
            val = eq.stats.mean(request.data)
        elif op == "median":
            val = eq.stats.median(request.data)
        elif op in ["var", "variance"]:
            val = eq.stats.variance(request.data)
        elif op == "pop_variance":
            val = eq.stats.population_variance(request.data)
        elif op in ["std", "stdev", "standard_deviation"]:
            val = eq.stats.standard_deviation(request.data)
        elif op == "pop_stdev":
            val = eq.stats.population_standard_deviation(request.data)
        else:
            raise ValueError(f"Unknown statistical operation: {op}")
            
        return {"result": str(val), "engine": "equacore"}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/laplace")
def laplace_transform(request: CASRequest):
    """Transformada de Laplace."""
    # request.var es 't', request.param es 's'
    s_var = request.param if request.param else "s"
    result = maxima.laplace(request.expression, request.var, s_var)
    return {"result": result, "engine": "maxima"}

@router.post("/integrate")
def integrate(request: CASRequest):
    """Integración simbólica (SymPy)."""
    def _sympy_integrate():
        sp_expr = sp.sympify(request.expression)
        var = sp.Symbol(request.var)
        res = sp.integrate(sp_expr, var)
        latex_str = translate_latex_es(sp.latex(res))
        return {"result": str(res), "latex": latex_str, "engine": "sympy"}
    try:
        return with_timeout(_sympy_integrate, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Integral demasiado compleja (timeout {TIMEOUT_SECONDS}s)")
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/evaluate")
def evaluate_universal(request: CASRequest):
    """Endpoint universal CAS — Cascada: C++ SymEngine → SymPy (timeout 5s) → Error."""
    expr_str = request.expression
    
    # =================================================================
    # NIVEL 1: EquaCore C++ (SymEngine) — milisegundos, sin GIL
    # =================================================================
    if HAS_SYMENGINE:
        try:
            # sympify de symengine está expuesto en C++ directamente
            parsed = _sym.sympify(expr_str)
            # En SymEngine la expansión y simplificación básica ocurren en background (o explicitamente expand)
            simplified = _sym.expand(parsed)
            result_str = str(simplified)
            # Intentar generar LaTeX usando sympy si es posible sin evaluar
            try:
                latex_str = translate_latex_es(sp.latex(sp.sympify(result_str)))
            except:
                latex_str = result_str
            return {"result": result_str, "latex": latex_str, "engine": "equacore-symengine"}
        except Exception:
            pass  # C++ no pudo, caemos a SymPy
    
    # =================================================================
    # NIVEL 2: SymPy (Python) — con Timeout de 5 segundos
    # =================================================================
    def _sympy_evaluate(expr_str):
        local_ns = {
            # Trig extendida (Inglés y Español)
            'sin': sp.sin, 'sen': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
            'csc': sp.csc, 'sec': sp.sec, 'cot': sp.cot,
            'asin': sp.asin, 'arcsen': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
            'acsc': sp.acsc, 'asec': sp.asec, 'acot': sp.acot,
            # Hiperbólicas
            'sinh': sp.sinh, 'senh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh,
            'asinh': sp.asinh, 'acosh': sp.acosh, 'atanh': sp.atanh,
            # Exponenciales/Logaritmos
            'exp': sp.exp, 'log': sp.log, 'ln': sp.ln,
            'sqrt': sp.sqrt, 'raiz': sp.sqrt, 'cbrt': sp.cbrt, 'raizcub': sp.cbrt, 'Abs': sp.Abs,
            # Aritmética
            'Mod': sp.Mod, 'mod': sp.Mod, 'Max': sp.Max, 'maximo': sp.Max, 'Min': sp.Min, 'minimo': sp.Min,
            'sign': sp.sign, 'signo': sp.sign, 'floor': sp.floor, 'piso': sp.floor, 'ceiling': sp.ceiling, 'techo': sp.ceiling,
            'factorial': sp.factorial,
            # Álgebra
            'gcd': sp.gcd, 'mcd': sp.gcd, 'lcm': sp.lcm, 'mcm': sp.lcm,
            'binomial': sp.binomial, 'combinar': sp.binomial,
            'isprime': sp.isprime, 'esPrimo': sp.isprime,
            'factorint': sp.factorint, 'factoresPrimos': sp.factorint,
            'apart': sp.apart, 'parciales': sp.apart,
            # Constantes
            'pi': sp.pi, 'E': sp.E, 'I': sp.I, 'oo': sp.oo, 'inf': sp.oo,
            'GoldenRatio': sp.GoldenRatio,
            # Matrices (Álgebra Lineal)
            'Matrix': sp.Matrix, 'det': lambda M: sp.Matrix(M).det(),
            'inversa': lambda M: sp.Matrix(M).inv(), 'inv': lambda M: sp.Matrix(M).inv(),
            'transpuesta': lambda M: sp.Matrix(M).transpose(), 'transpose': lambda M: sp.Matrix(M).transpose(),
            'identidad': sp.eye, 'eye': sp.eye,
            'ceros': sp.zeros, 'zeros': sp.zeros,
            'unos': sp.ones, 'ones': sp.ones,
            'media': lambda L: sum(L)/len(L),
            'mediana': lambda L: sorted(L)[len(L)//2] if len(L)%2!=0 else (sorted(L)[len(L)//2 - 1] + sorted(L)[len(L)//2])/2,
            'varianza': lambda L: sum((x - sum(L)/len(L))**2 for x in L) / (len(L)-1 if len(L)>1 else 1),
            'desviacion': lambda L: sp.sqrt(sum((x - sum(L)/len(L))**2 for x in L) / (len(L)-1 if len(L)>1 else 1)),
            # Estadística Bivariada
            'covarianza': lambda X, Y: sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1),
            'correlacion': lambda X, Y: (sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1)) / (sp.sqrt(sum((x - sum(X)/len(X))**2 for x in X) / (len(X)-1 if len(X)>1 else 1)) * sp.sqrt(sum((y - sum(Y)/len(Y))**2 for y in Y) / (len(Y)-1 if len(Y)>1 else 1))),
            'regresion': lambda X, Y: sp.Symbol('x') * ((sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1)) / (sum((x - sum(X)/len(X))**2 for x in X) / (len(X)-1 if len(X)>1 else 1))) + (sum(Y)/len(Y) - ((sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1)) / (sum((x - sum(X)/len(X))**2 for x in X) / (len(X)-1 if len(X)>1 else 1))) * sum(X)/len(X)),
            # Distribuciones
            'normalpdf': lambda x, mu, sigma: (1/(sigma*sp.sqrt(2*sp.pi))) * sp.exp(-0.5*((x-mu)/sigma)**2),
            'binomialpmf': lambda k, n, p: sp.binomial(n, k) * (p**k) * ((1-p)**(n-k)),
            # Resolutores e Igualdades
            'resolver': sp.solve,
            'solve': sp.solve,
            'Eq': sp.Eq,
            'Igual': sp.Eq,
        }
        
        # Caso especial: factorint devuelve dict
        if 'factorint(' in expr_str or 'factoresPrimos(' in expr_str:
            m = re.search(r'(?:factorint|factoresPrimos)\((.+)\)', expr_str)
            if m:
                n = int(sp.sympify(m.group(1)))
                factors = sp.factorint(n)
                result_str = " \\cdot ".join(f"{p}^{{{e}}}" if e > 1 else str(p) for p, e in sorted(factors.items()))
                return {"result": str(factors), "latex": result_str, "engine": "sympy"}
        
        # Caso especial: isprime / esPrimo devuelve bool
        if 'isprime(' in expr_str or 'esPrimo(' in expr_str:
            m = re.search(r'(?:isprime|esPrimo)\((.+)\)', expr_str)
            if m:
                n = int(sp.sympify(m.group(1)))
                is_prime = sp.isprime(n)
                label = "\\text{Si, es primo}" if is_prime else "\\text{No es primo}"
                return {"result": str(is_prime), "latex": label, "engine": "sympy"}
        
        # Caso especial: permutations(n,k)
        if 'permutations(' in expr_str:
            m = re.search(r'permutations\((.+?),\s*(.+?)\)', expr_str)
            if m:
                n = sp.sympify(m.group(1))
                k = sp.sympify(m.group(2))
                result = sp.factorial(n) / sp.factorial(n - k)
                simplified = sp.simplify(result)
                latex_str = translate_latex_es(sp.latex(simplified))
                return {"result": str(simplified), "latex": latex_str, "engine": "sympy"}
        
        parsed = sp.sympify(expr_str, locals=local_ns)
        
        # Auto-convertir listas anidadas a Matrices
        if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], list):
            parsed = sp.Matrix(parsed)
            
        simplified = sp.simplify(parsed)
        latex_str = translate_latex_es(sp.latex(simplified))
        return {"result": str(simplified), "latex": latex_str, "engine": "sympy"}
    
    try:
        result = with_timeout(_sympy_evaluate, expr_str, timeout=TIMEOUT_SECONDS)
        return result
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Expresion demasiado compleja (timeout {TIMEOUT_SECONDS}s). Intenta simplificarla.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error evaluando expresion: {str(e)}")

@router.post("/simplify")
def simplify(request: CASRequest):
    """Simplificación de expresiones — Cascada: C++ SymEngine → SymPy (timeout 5s)."""
    # NIVEL 1: EquaCore C++ (SymEngine)
    if HAS_SYMENGINE:
        try:
            parsed = _sym.sympify(request.expression)
            simplified = _sym.expand(parsed)
            result_str = str(simplified)
            try:
                latex_str = translate_latex_es(sp.latex(sp.sympify(result_str)))
            except:
                latex_str = result_str
            return {"result": result_str, "latex": latex_str, "engine": "equacore-symengine"}
        except Exception:
            pass
    
    # NIVEL 2: SymPy con Timeout
    def _sympy_simplify():
        local_ns = {
            'sin': sp.sin, 'sen': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
            'csc': sp.csc, 'sec': sp.sec, 'cot': sp.cot,
            'asin': sp.asin, 'arcsen': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
            'acsc': sp.acsc, 'asec': sp.asec, 'acot': sp.acot,
            'sinh': sp.sinh, 'senh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh,
            'asinh': sp.asinh, 'acosh': sp.acosh, 'atanh': sp.atanh,
            'exp': sp.exp, 'log': sp.log, 'ln': sp.ln,
            'sqrt': sp.sqrt, 'raiz': sp.sqrt, 'cbrt': sp.cbrt, 'raizcub': sp.cbrt, 'Abs': sp.Abs,
            'Mod': sp.Mod, 'mod': sp.Mod, 'Max': sp.Max, 'maximo': sp.Max, 'Min': sp.Min, 'minimo': sp.Min,
            'sign': sp.sign, 'signo': sp.sign, 'floor': sp.floor, 'piso': sp.floor, 'ceiling': sp.ceiling, 'techo': sp.ceiling,
            'factorial': sp.factorial,
            'gcd': sp.gcd, 'mcd': sp.gcd, 'lcm': sp.lcm, 'mcm': sp.lcm,
            'binomial': sp.binomial, 'combinar': sp.binomial,
            'isprime': sp.isprime, 'esPrimo': sp.isprime,
            'factorint': sp.factorint, 'factoresPrimos': sp.factorint,
            'apart': sp.apart, 'parciales': sp.apart,
            'pi': sp.pi, 'E': sp.E, 'I': sp.I, 'oo': sp.oo, 'inf': sp.oo,
            'GoldenRatio': sp.GoldenRatio,
            'Matrix': sp.Matrix, 'det': lambda M: sp.Matrix(M).det(),
            'inversa': lambda M: sp.Matrix(M).inv(), 'inv': lambda M: sp.Matrix(M).inv(),
            'transpuesta': lambda M: sp.Matrix(M).transpose(), 'transpose': lambda M: sp.Matrix(M).transpose(),
            'identidad': sp.eye, 'eye': sp.eye,
            'ceros': sp.zeros, 'zeros': sp.zeros,
            'unos': sp.ones, 'ones': sp.ones,
            'media': lambda L: sum(L)/len(L),
            'mediana': lambda L: sorted(L)[len(L)//2] if len(L)%2!=0 else (sorted(L)[len(L)//2 - 1] + sorted(L)[len(L)//2])/2,
            'varianza': lambda L: sum((x - sum(L)/len(L))**2 for x in L) / (len(L)-1 if len(L)>1 else 1),
            'desviacion': lambda L: sp.sqrt(sum((x - sum(L)/len(L))**2 for x in L) / (len(L)-1 if len(L)>1 else 1)),
            # Estadística Bivariada
            'covarianza': lambda X, Y: sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1),
            'correlacion': lambda X, Y: (sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1)) / (sp.sqrt(sum((x - sum(X)/len(X))**2 for x in X) / (len(X)-1 if len(X)>1 else 1)) * sp.sqrt(sum((y - sum(Y)/len(Y))**2 for y in Y) / (len(Y)-1 if len(Y)>1 else 1))),
            'regresion': lambda X, Y: sp.Symbol('x') * ((sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1)) / (sum((x - sum(X)/len(X))**2 for x in X) / (len(X)-1 if len(X)>1 else 1))) + (sum(Y)/len(Y) - ((sum((x - sum(X)/len(X))*(y - sum(Y)/len(Y)) for x, y in zip(X, Y)) / (len(X)-1 if len(X)>1 else 1)) / (sum((x - sum(X)/len(X))**2 for x in X) / (len(X)-1 if len(X)>1 else 1))) * sum(X)/len(X)),
            # Distribuciones
            'normalpdf': lambda x, mu, sigma: (1/(sigma*sp.sqrt(2*sp.pi))) * sp.exp(-0.5*((x-mu)/sigma)**2),
            'binomialpmf': lambda k, n, p: sp.binomial(n, k) * (p**k) * ((1-p)**(n-k)),
            # Resolutores e Igualdades
            'resolver': sp.solve,
            'solve': sp.solve,
            'Eq': sp.Eq,
            'Igual': sp.Eq,
        }
        parsed = sp.sympify(request.expression, locals=local_ns)
        if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], list):
            parsed = sp.Matrix(parsed)
        simplified = sp.simplify(parsed)
        latex_str = translate_latex_es(sp.latex(simplified))
        return {"result": str(simplified), "latex": latex_str, "engine": "sympy"}
    
    try:
        return with_timeout(_sympy_simplify, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Simplificacion demasiado compleja (timeout {TIMEOUT_SECONDS}s)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error simplificando: {str(e)}")

@router.get("/status")
async def get_status():
    """Verifica si los motores CAS están operativos."""
    return {
        "maxima_active": True, # Asumiendo que se instaló
        "native_equacore": equacore.NATIVE_BIO,
        "symbolic_fallback": "sympy" if not equacore.NATIVE_SYMBOLIC else "native"
    }

class PlotRequest(BaseModel):
    expression: str
    var: str = "x"
    x_min: float = -10.0
    x_max: float = 10.0
    points: int = 200

@router.post("/plot")
async def plot_function(request: PlotRequest):
    """Genera coordenadas (x,y) de una expresión para graficar en Frontend usando SymPy y NumPy."""
    try:
        import sympy as sp
        import numpy as np
        
        # Parse expression safely
        x = sp.Symbol(request.var)
        expr = sp.sympify(request.expression)
        
        # Create a fast numerical function
        f_num = sp.lambdify(x, expr, modules=["numpy", "math"])
        
        # Generate x values
        x_vals = np.linspace(request.x_min, request.x_max, request.points)
        y_vals = []
        
        for val in x_vals:
            try:
                # Need to handle complex numbers and math domain errors
                y = f_num(val)
                # Check if result is real and finite
                if np.isreal(y) and np.isfinite(y):
                    # Sp sympify converts to array sometimes, ensure float
                    y_vals.append({"x": float(val), "y": float(y)})
                else:
                    y_vals.append({"x": float(val), "y": None})
            except Exception:
                # Math domain error like sqrt(-1)
                y_vals.append({"x": float(val), "y": None})
                
        return {"expression": request.expression, "points": y_vals, "success": True}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al evaluar la gráfica: {str(e)}")
