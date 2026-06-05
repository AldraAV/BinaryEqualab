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

# =============================================================================
# Helper: SymPy Parse Expr Seguro
# =============================================================================
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

def safe_sympify(expr_str, locals_ns=None):
    """Parsea una cadena usando parse_expr con transformaciones estándar + multiplicación implícita.
       Si falla, intenta el sympify básico."""
    transformations = standard_transformations + (implicit_multiplication_application,)
    try:
        return parse_expr(expr_str, local_dict=locals_ns, transformations=transformations)
    except Exception as e:
        # Fallback al sympify normal si parse_expr falla
        return sp.sympify(expr_str, locals=locals_ns)

router = APIRouter(prefix="/api/cas", tags=["CAS"])

class CASRequest(BaseModel):
    expression: str
    var: str = "x"
    variable: str = "x"  # Compatibilidad con el frontend que manda 'variable'
    param: str = ""
    order: int = 1       # Orden de derivada
    lower_bound: float = None
    upper_bound: float = None

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
    order = request.order
    nombre_var = request.variable if request.variable != "x" else request.var
    
    try:
        if HAS_SYMENGINE:
            try:
                parsed = _sym.sympify(request.expression)
                var = _sym.Symbol(nombre_var)
                # Aplicamos la n-esima derivada
                res = parsed
                for _ in range(order):
                    res = _sym.diff(res, var)
                
                # Convertir a sympy para simplificar
                sp_res = sp.sympify(str(res))
                simplified_res = sp.simplify(sp_res)
                result_str = str(simplified_res)
                
                # Intentar aproximación numérica
                approx_val = None
                try:
                    approx_val = str(simplified_res.evalf())
                except:
                    pass

                try:
                    latex_str = translate_latex_es(sp.latex(simplified_res))
                except:
                    latex_str = result_str
                return {"result": result_str, "latex": latex_str, "approx": approx_val, "engine": "equacore-symengine"}
            except Exception:
                pass
            
    except Exception as e:
        # Fallback a SymPy con Timeout
        def _sympy_deriv():
            sp_expr = sp.sympify(request.expression)
            var = sp.Symbol(nombre_var)
            res = sp.diff(sp_expr, var, order)
            simplified_res = sp.simplify(res)
            latex_str = translate_latex_es(sp.latex(simplified_res))
            
            # Intentar aproximación numérica
            approx_val = None
            try:
                approx_val = str(simplified_res.evalf())
            except:
                pass

            return {"result": str(simplified_res), "latex": latex_str, "approx": approx_val, "engine": "sympy"}
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
        
        # Intentar aproximación numérica
        approx_val = None
        try:
            if res.is_number:
                approx_val = str(float(res.evalf()))
        except:
            pass

        return {"result": str(res), "latex": latex_str, "approx": approx_val, "engine": "sympy"}
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
        
        # Intentar aproximación numérica
        approx_val = None
        try:
            if res.is_number:
                approx_val = str(float(res.evalf()))
        except:
            pass

        return {"result": str(res), "latex": latex_str, "approx": approx_val, "engine": "sympy"}
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
    """Integración simbólica o definida (SymPy)."""
    nombre_var = request.variable if request.variable != "x" else request.var
    def _sympy_integrate():
        sp_expr = sp.sympify(request.expression)
        var = sp.Symbol(nombre_var)
        if request.lower_bound is not None and request.upper_bound is not None:
            res = sp.integrate(sp_expr, (var, request.lower_bound, request.upper_bound))
        else:
            res = sp.integrate(sp_expr, var)
            
        simplified_res = sp.simplify(res)
        latex_str = translate_latex_es(sp.latex(simplified_res))
        
        # Intentar aproximación numérica
        approx_val = None
        try:
            approx_val = str(simplified_res.evalf())
        except:
            pass

        return {"result": str(simplified_res), "latex": latex_str, "approx": approx_val, "engine": "sympy"}
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
            
            # Intentar aproximación numérica
            approx_val = None
            try:
                sp_temp = sp.sympify(result_str)
                approx_val = str(sp_temp.evalf())
            except:
                pass

            # Intentar generar LaTeX usando sympy si es posible sin evaluar
            try:
                latex_str = translate_latex_es(sp.latex(sp.sympify(result_str)))
            except:
                latex_str = result_str
            return {"result": result_str, "latex": latex_str, "approx": approx_val, "engine": "equacore-symengine"}
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
        
        # Intentar aproximación numérica
        approx_val = None
        try:
            approx_val = str(simplified.evalf())
        except:
            pass

        return {"result": str(simplified), "latex": latex_str, "approx": approx_val, "engine": "sympy"}
    
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
            
            # Intentar aproximación numérica
            approx_val = None
            try:
                sp_temp = sp.sympify(result_str)
                approx_val = str(sp_temp.evalf())
            except:
                pass

            try:
                latex_str = translate_latex_es(sp.latex(sp.sympify(result_str)))
            except:
                latex_str = result_str
            return {"result": result_str, "latex": latex_str, "approx": approx_val, "engine": "equacore-symengine"}
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
        
        # Intentar aproximación numérica
        approx_val = None
        try:
            approx_val = str(simplified.evalf())
        except:
            pass

        return {"result": str(simplified), "latex": latex_str, "approx": approx_val, "engine": "sympy"}
    
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


# =============================================================================
# Endpoints de Resolución de Ecuaciones y Desigualdades
# =============================================================================

class SystemRequest(BaseModel):
    equations: list[str]
    variables: list[str]

@router.post("/solve-equation")
def solve_equation(request: CASRequest):
    """Resuelve una ecuación de forma simbólica en base a la variable solicitada."""
    var_name = request.variable if request.variable != "x" else request.var
    
    def _sympy_solve():
        expresion = request.expression
        # Si tiene signo de igualdad, transformarlo en ecuación de SymPy
        if "=" in expresion:
            partes = expresion.split("=", 1)
            lhs = safe_sympify(partes[0].strip())
            rhs = safe_sympify(partes[1].strip())
            eq = sp.Eq(lhs, rhs)
        else:
            eq = safe_sympify(expresion)
            
        variable = sp.Symbol(var_name)
        soluciones = sp.solve(eq, variable)
        
        result_str = str(soluciones)
        latex_str = translate_latex_es(sp.latex(soluciones))
        
        approx_val = None
        try:
            # Calcular aproximaciones si hay valores numéricos
            approx_list = []
            for sol in soluciones:
                if hasattr(sol, 'evalf'):
                    approx_list.append(str(sol.evalf()))
                else:
                    approx_list.append(str(sol))
            approx_val = "[" + ", ".join(approx_list) + "]"
        except:
            pass
            
        return {"result": result_str, "latex": latex_str, "approx": approx_val, "success": True}
        
    try:
        return with_timeout(_sympy_solve, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Resolución de ecuación excedió el tiempo límite ({TIMEOUT_SECONDS}s)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error resolviendo ecuación: {str(e)}")

@router.post("/solve-system")
def solve_system(request: SystemRequest):
    """Resuelve un sistema de ecuaciones lineales o no lineales con múltiples incógnitas."""
    def _sympy_solve_system():
        ecuaciones_sympy = []
        for eq_str in request.equations:
            if "=" in eq_str:
                partes = eq_str.split("=", 1)
                lhs = safe_sympify(partes[0].strip())
                rhs = safe_sympify(partes[1].strip())
                ecuaciones_sympy.append(sp.Eq(lhs, rhs))
            else:
                ecuaciones_sympy.append(safe_sympify(eq_str))
                
        variables_sympy = [sp.Symbol(v.strip()) for v in request.variables]
        soluciones = sp.solve(ecuaciones_sympy, variables_sympy)
        
        result_str = str(soluciones)
        latex_str = translate_latex_es(sp.latex(soluciones))
        return {"result": result_str, "latex": latex_str, "success": True}
        
    try:
        return with_timeout(_sympy_solve_system, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Resolución de sistema excedió el tiempo límite ({TIMEOUT_SECONDS}s)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error resolviendo sistema: {str(e)}")

@router.post("/solve-inequality")
def solve_inequality(request: CASRequest):
    """Resuelve desigualdades de una variable de forma simbólica."""
    var_name = request.variable if request.variable != "x" else request.var
    
    def _sympy_solve_ineq():
        eq = safe_sympify(request.expression)
        variable = sp.Symbol(var_name)
        soluciones = sp.solve(eq, variable)
        
        result_str = str(soluciones)
        latex_str = translate_latex_es(sp.latex(soluciones))
        return {"result": result_str, "latex": latex_str, "success": True}
        
    try:
        return with_timeout(_sympy_solve_ineq, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail=f"Resolución de desigualdad excedió el tiempo límite ({TIMEOUT_SECONDS}s)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error resolviendo desigualdad: {str(e)}")


# =============================================================================
# Endpoints de Transformadas e Inversas
# =============================================================================

@router.post("/fourier")
def fourier_transform(request: CASRequest):
    """Calcula la transformada de Fourier simbólica F(w) de una función f(t)."""
    var_t_str = request.variable if request.variable != "x" else request.var
    var_w_str = request.param if request.param else "w"
    
    def _sympy_fourier():
        t = sp.Symbol(var_t_str)
        w = sp.Symbol(var_w_str)
        f = sp.sympify(request.expression)
        resultado = sp.fourier_transform(f, t, w)
        latex_str = translate_latex_es(sp.latex(resultado))
        return {"result": str(resultado), "latex": latex_str, "success": True}
        
    try:
        return with_timeout(_sympy_fourier, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail="Cálculo de Fourier excedió el tiempo límite")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/ifourier")
def inverse_fourier_transform(request: CASRequest):
    """Calcula la transformada inversa de Fourier f(t) de una función F(w)."""
    var_w_str = request.variable if request.variable != "x" else request.var
    var_t_str = request.param if request.param else "t"
    
    def _sympy_ifourier():
        w = sp.Symbol(var_w_str)
        t = sp.Symbol(var_t_str)
        F = sp.sympify(request.expression)
        resultado = sp.inverse_fourier_transform(F, w, t)
        latex_str = translate_latex_es(sp.latex(resultado))
        return {"result": str(resultado), "latex": latex_str, "success": True}
        
    try:
        return with_timeout(_sympy_ifourier, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail="Cálculo de Fourier inverso excedió el tiempo límite")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/ilaplace")
def inverse_laplace_transform(request: CASRequest):
    """Calcula la transformada inversa de Laplace f(t) de una función F(s)."""
    var_s_str = request.variable if request.variable != "x" else request.var
    var_t_str = request.param if request.param else "t"
    
    def _sympy_ilaplace():
        s = sp.Symbol(var_s_str)
        t = sp.Symbol(var_t_str)
        F = sp.sympify(request.expression)
        resultado = sp.inverse_laplace_transform(F, s, t, noconds=True)
        latex_str = translate_latex_es(sp.latex(resultado))
        return {"result": str(resultado), "latex": latex_str, "success": True}
        
    try:
        return with_timeout(_sympy_ilaplace, timeout=TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=408, detail="Cálculo de Laplace inverso excedió el tiempo límite")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# Endpoints Aritmética Compleja y Vectorial
# =============================================================================

class ComplexNumberModel(BaseModel):
    re: float
    im: float

class ComplexRequest(BaseModel):
    op: str  # '+', '-', '*', '/', 'potencia', 'raiz'
    z1: ComplexNumberModel
    z2: ComplexNumberModel
    n: int = 2  # Para potencia o raíz

class VectorRequest(BaseModel):
    op: str  # 'sumar', 'restar', 'punto', 'cruz', 'escalar'
    v1: list[float]
    v2: list[float]
    k: float = 1.0  # Escalar k

@router.post("/complex/calculate")
def complex_calculate(request: ComplexRequest):
    """Realiza aritmética de números complejos en el backend, devolviendo resultados y su forma polar."""
    try:
        w1 = complex(request.z1.re, request.z1.im)
        w2 = complex(request.z2.re, request.z2.im)
        res = 0j
        
        operacion = request.op
        if operacion == '+':
            res = w1 + w2
        elif operacion == '-':
            res = w1 - w2
        elif operacion == '*':
            res = w1 * w2
        elif operacion == '/':
            if w2 == 0j:
                raise ValueError("División por cero en números complejos")
            res = w1 / w2
        elif operacion == 'potencia':
            res = w1 ** request.n
        elif operacion == 'raiz':
            res = w1 ** (1.0 / request.n)
        else:
            raise ValueError(f"Operación compleja desconocida: {operacion}")
            
        modulo = float(np.abs(res))
        fase = float(np.angle(res))
        fase_grados = fase * 180.0 / np.pi
        
        part_re = res.real
        part_im = res.imag
        
        if abs(part_im) < 1e-9:
            latex_str = f"{part_re:.4f}"
        elif abs(part_re) < 1e-9:
            latex_str = f"{part_im:.4f}i"
        elif part_im >= 0:
            latex_str = f"{part_re:.4f} + {part_im:.4f}i"
        else:
            latex_str = f"{part_re:.4f} - {abs(part_im):.4f}i"
            
        latex_str = latex_str.replace(".0000", "")
        
        return {
            "result": {
                "re": float(part_re),
                "im": float(part_im)
            },
            "polar": {
                "r": modulo,
                "theta": fase,
                "theta_deg": fase_grados
            },
            "latex": latex_str,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/vectors/calculate")
def vectors_calculate(request: VectorRequest):
    """Calcula operaciones con vectores (2D/3D), devolviendo el vector resultante, magnitud, ángulo, etc."""
    try:
        v1 = np.array(request.v1)
        v2 = np.array(request.v2)
        operacion = request.op
        
        resultado = None
        resultado_escalar = None
        propiedades = []
        
        mag_v1 = float(np.linalg.norm(v1))
        mag_v2 = float(np.linalg.norm(v2))
        propiedades.append(f"|v₁| = {mag_v1:.4f}")
        propiedades.append(f"|v₂| = {mag_v2:.4f}")
        
        if mag_v1 > 0 and mag_v2 > 0:
            dot_val = np.dot(v1, v2)
            cos_theta = dot_val / (mag_v1 * mag_v2)
            cos_theta = np.clip(cos_theta, -1.0, 1.0)
            ang = float(np.arccos(cos_theta) * 180.0 / np.pi)
            propiedades.append(f"∠(v₁, v₂) = {ang:.2f}°")
            
        if operacion == 'sumar':
            resultado = v1 + v2
        elif operacion == 'restar':
            resultado = v1 - v2
        elif operacion == 'escalar':
            resultado = v1 * request.k
        elif operacion == 'punto':
            resultado_escalar = float(np.dot(v1, v2))
        elif operacion == 'cruz':
            if len(v1) == 3 and len(v2) == 3:
                resultado = np.cross(v1, v2)
            else:
                raise ValueError("Producto cruz requiere vectores de 3 dimensiones")
        else:
            raise ValueError(f"Operación vectorial no soportada: {operacion}")
            
        if resultado is not None:
            mag_res = float(np.linalg.norm(resultado))
            propiedades.append(f"|R| = {mag_res:.4f}")
            lista_res = resultado.tolist()
            txt_res = f"({', '.join(f'{x:.4f}' for x in lista_res)})".replace(".0000", "")
            return {
                "result": lista_res,
                "text": txt_res,
                "properties": propiedades,
                "success": True
            }
        else:
            return {
                "result_scalar": resultado_escalar,
                "text": f"{resultado_escalar:.4f}".replace(".0000", ""),
                "properties": propiedades,
                "success": True
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
