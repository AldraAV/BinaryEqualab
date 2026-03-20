"""
Binary EquaLab - Math Engine v3.1
Core symbolic computation using SymEngine (C++ native) + SymPy with Spanish function translations.
"""

import sympy as sp
from sympy import (
    Symbol, symbols, sin, cos, tan, sqrt, exp, log, ln, pi, E, I,
    diff, integrate, limit, summation, simplify, expand, factor, solve,
    Abs, factorial, gamma, binomial, floor, ceiling,
    Matrix, det, Transpose,
    csc, sec, cot, asin, acos, atan,
    sinh, cosh, tanh,
    sign, Mod, Max, Min, cbrt, gcd, lcm, isprime, apart, series,
    factorint
)
from sympy.parsing.sympy_parser import (
    parse_expr, standard_transformations, implicit_multiplication_application,
    convert_xor, function_exponentiation
)
from sympy.stats import Normal, density
from typing import Any, Union, List, Optional
import re
import math

# SymEngine C++ native acceleration
HAS_SYMENGINE = False
try:
    import symengine as _sym
    HAS_SYMENGINE = True
except ImportError:
    pass

from .parser_enhanced import EnhancedParser
from .sonify import AudioEngine
from .geometry import GeometryEngine

# Symbol shortcuts
x, y, z, t, n, k = symbols('x y z t n k')

# Import core EquaEngine if available (for Bio-Engine v3.0 inheritence)
import sys
import os
try:
    # Try to reach the main core engine
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))
    from src.core.engine import EquaEngine
    HAS_CORE_ENGINE = True
except ImportError:
    HAS_CORE_ENGINE = False


class MathEngine:
    """
    Core math engine with Spanish function support.
    Wraps SymPy with user-friendly Spanish aliases.
    """
    
    def __init__(self):
        self.symbols = {'x': x, 'y': y, 'z': z, 't': t, 'n': n, 'k': k}
        self.last_result = None
        self.history: List[str] = []
        
        # Initialize Core Bio-Engine if available
        self.core = EquaEngine() if HAS_CORE_ENGINE else None
        
        # User-defined functions (scripting)
        self.user_functions = {}

        # Spanish → SymPy function mapping
        self.function_map = {
            # Calculus
            'derivar': self._derivar,
            'integrar': self._integrar,
            'limite': self._limite,
            'sumatoria': self._sumatoria,
            'taylor': self._taylor,
            
            # Algebra
            'simplificar': self._simplificar,
            'expandir': self._expandir,
            'factorizar': self._factorizar,
            'resolver': self._resolver,
            'parciales': self._parciales,
            'mcd': self._mcd,
            'mcm': self._mcm,
            'esPrimo': self._es_primo,
            'combinar': self._combinar,
            'permutar': self._permutar,
            'factoresPrimos': self._factores_primos,
            
            # Statistics (Basic)
            'media': self._media,
            'mediana': self._mediana,
            'desviacion': self._desviacion,
            'varianza': self._varianza,
            # Statistics (Advanced)
            'covarianza': self._covarianza,
            'correlacion': self._correlacion,
            'regresion': self._regresion,
            'normalpdf': self._normalpdf,
            'binomialpmf': self._binomialpmf,
            
            # Finance
            'van': self._van,
            'tir': self._tir,
            'depreciar': self._depreciar,
            'interes_simple': self._interes_simple,
            'interes_compuesto': self._interes_compuesto,
            
            # Audio / Sonification
            'sonify': self._sonify,
            'sonificar': self._sonify,

            # Geometry
            'distancia': self._distancia,
            'punto_medio': self._punto_medio,
            'pendiente': self._pendiente,
            'recta': self._recta,
            'circulo': self._circulo,
            
            # Numeral Systems
            'bin': self._binario,
            'oct': self._octal,
            'hex': self._hexadecimal,
            'base': self._base_n,
            
            # Trigonometry (basic aliases)
            'seno': sin, 'coseno': cos, 'tangente': tan,
            'arcoseno': sp.asin, 'arcocoseno': sp.acos, 'arcotangente': sp.atan,
            # Trigonometry (extended)
            'csc': csc, 'sec': sec, 'cot': cot,
            'acsc': sp.acsc, 'asec': sp.asec, 'acot': sp.acot,
            # Hyperbolic
            'senh': sinh, 'cosh': cosh, 'tanh': tanh,
            # Arithmetic extended
            'mod': lambda a, b: Mod(a, b),
            'maximo': lambda a, b: Max(a, b),
            'minimo': lambda a, b: Min(a, b),
            'signo': lambda x: sign(x),
            'raizcub': lambda x: cbrt(x),
            'redondear': lambda x, n=0: round(float(x), int(n)),
        }
    
    def parse(self, expression: str) -> Any:
        """Parse a math expression string into SymPy."""
        # Preprocess Spanish functions
        expr = self._preprocess(expression)
        
        # Parse with transformations
        transformations = (
            standard_transformations + 
            (implicit_multiplication_application, convert_xor, function_exponentiation)
        )
        
        try:
            result = parse_expr(expr, local_dict=self.symbols, transformations=transformations)
            return result
        except Exception as e:
            raise ValueError(f"Parse error: {e}")
    
    def evaluate(self, expression: str) -> Any:
        """Evaluate a math expression and return the result."""
        expression = expression.strip()
        
        if not expression:
            return None
            
        self.history.append(expression)
        
        if expression.lower().strip() in ["sentimiento", "amor", "error", "feel"]:
            return "Aquí el sentimiento existe. El error, no."

        # Check for user function definition: f(x) := expr
        func_def = re.match(r'^(\w+)\(([^)]+)\)\s*:=\s*(.+)$', expression)
        if func_def:
            fname, params_str, body = func_def.groups()
            params = [p.strip() for p in params_str.split(',')]
            self.user_functions[fname] = {'params': params, 'body': body}
            return f"Función {fname}({', '.join(params)}) definida."

        # Substitute user functions before evaluation
        expression = self._substitute_user_functions(expression)

        # Check for variable assignment (e.g., "a = 5")
        assignment_match = re.match(r'^([a-zA-Z_]\w*)\s*=\s*(.+)$', expression)
        if assignment_match:
            var_name, val_expr = assignment_match.groups()
            try:
                val_result = self.evaluate(val_expr)
                self.symbols[var_name] = val_result
                return val_result
            except Exception as e:
                raise ValueError(f"Assignment error: {e}")

        # Check for function calls
        for func_name, func in self.function_map.items():
            if expression.startswith(f'{func_name}('):
                result = self._call_function(expression)
                self.last_result = result
                return result
        
        # Standard expression evaluation with SymEngine acceleration
        try:
            if HAS_SYMENGINE:
                try:
                    parsed = _sym.sympify(expression)
                    result = _sym.expand(parsed)
                    self.last_result = result
                    return sp.sympify(str(result))
                except Exception:
                    pass

            if self.core:
                result = self.core.simplify(expression)
                self.last_result = result
                return result
            
            parsed = self.parse(expression)
            result = sp.simplify(parsed)
            self.last_result = result
            return result
        except Exception as e:
            raise ValueError(f"Evaluation error: {e}")

    def evaluate_batch(self, expression: str) -> list:
        """Evaluate multiple expressions separated by ';'. Returns list of results."""
        parts = [p.strip() for p in expression.split(';') if p.strip()]
        results = []
        for part in parts:
            try:
                result = self.evaluate(part)
                results.append(result)
            except Exception as e:
                results.append(f"Error: {e}")
        return results

    def _substitute_user_functions(self, expr: str) -> str:
        """Expand user-defined functions in expression."""
        for fname, fdef in self.user_functions.items():
            pattern = rf'{fname}\(([^)]+)\)'
            match = re.search(pattern, expr)
            while match:
                args_str = match.group(1)
                args = [a.strip() for a in args_str.split(',')]
                body = fdef['body']
                for param, arg in zip(fdef['params'], args):
                    body = re.sub(rf'\b{param}\b', f'({arg})', body)
                expr = expr[:match.start()] + f'({body})' + expr[match.end():]
                match = re.search(pattern, expr)
        return expr
    
    def _preprocess(self, expr: str) -> str:
        """Convert Spanish function names and shortcuts."""
        replacements = {
            'seno': 'sin', 'sen': 'sin',
            'coseno': 'cos', 'tangente': 'tan',
            'arcoseno': 'asin', 'arcocoseno': 'acos', 'arcotangente': 'atan',
            'raiz': 'sqrt', 'absoluto': 'Abs',
            'logaritmo': 'log', 'exponencial': 'exp',
            # New in v3.1
            'senh': 'sinh',
            'raizcub': 'cbrt',
            'acsc': 'acsc', 'asec': 'asec', 'acot': 'acot',
        }
        
        for es, en in replacements.items():
            expr = re.sub(rf'\b{es}\b', en, expr, flags=re.IGNORECASE)
        
        expr = EnhancedParser.preprocess(expr)
        expr = expr.replace('^', '**')
        
        return expr
    
    def _call_function(self, expression: str) -> Any:
        """Call a Spanish function with arguments."""
        # Extract function name and args
        match = re.match(r'(\w+)\((.*)\)$', expression, re.DOTALL)
        if not match:
            raise ValueError(f"Invalid function call: {expression}")
        
        func_name = match.group(1)
        args_str = match.group(2)
        
        if func_name not in self.function_map:
            raise ValueError(f"Unknown function: {func_name}")
        
        func = self.function_map[func_name]
        
        # Parse arguments
        args = self._parse_args(args_str)
        
        return func(*args)
    
    def _parse_args(self, args_str: str) -> List[Any]:
        """Parse function arguments, handling nested parentheses."""
        args = []
        current = ""
        depth = 0
        
        for char in args_str:
            if char == '(':
                depth += 1
                current += char
            elif char == ')':
                depth -= 1
                current += char
            elif char == ',' and depth == 0:
                if current.strip():
                    args.append(self._parse_single_arg(current.strip()))
                current = ""
            else:
                current += char
        
        if current.strip():
            args.append(self._parse_single_arg(current.strip()))
        
        return args
    
    def _parse_single_arg(self, arg: str) -> Any:
        """Parse a single argument - could be number, symbol, or expression."""
        try:
            return float(arg)
        except ValueError:
            pass
        
        if arg in self.symbols:
            return self.symbols[arg]
        
        return self.parse(arg)
    
    # ============ CALCULUS ============
    
    def _derivar(self, expr, var=None, n=1):
        """Derivative: derivar(x^2 + 3x, x) → 2x + 3"""
        if var is None:
            var = x
        return diff(expr, var, n)
    
    def _integrar(self, expr, var=None, a=None, b=None):
        """Integral: integrar(x^2, x) or integrar(x^2, x, 0, 1)"""
        if var is None:
            var = x
        if a is not None and b is not None:
            return integrate(expr, (var, a, b))
        return integrate(expr, var)
    
    def _limite(self, expr, var=None, punto=0, direccion=None):
        """Limit: limite(sin(x)/x, x, 0) → 1"""
        if var is None:
            var = x
        if direccion:
            return limit(expr, var, punto, direccion)
        return limit(expr, var, punto)
    
    def _sumatoria(self, expr, var=None, a=0, b=10):
        """Sum: sumatoria(n^2, n, 1, 10) → 385"""
        if var is None:
            var = n
        return summation(expr, (var, a, b))

    def _taylor(self, expr, var=None, punto=0, orden=5):
        """Taylor series: taylor(sin(x), x, 0, 5)"""
        if var is None:
            var = x
        return series(expr, var, float(punto), int(orden)).removeO()
    
    # ============ ALGEBRA ============
    
    def _simplificar(self, expr):
        """Simplify: simplificar((x^2-1)/(x-1)) → x+1"""
        return simplify(expr)
    
    def _expandir(self, expr):
        """Expand: expandir((x+1)^2) → x^2 + 2x + 1"""
        return expand(expr)
    
    def _factorizar(self, expr):
        """Factor: factorizar(x^2 - 1) → (x-1)(x+1)"""
        return factor(expr)
    
    def _resolver(self, expr, var=None):
        """Solve: resolver(x^2 - 4, x) → [-2, 2]"""
        if var is None:
            var = x
        return solve(expr, var)

    def _parciales(self, expr, var=None):
        """Partial fractions: parciales(1/(x^2-1), x)"""
        if var is None:
            var = x
        return apart(expr, var)

    def _mcd(self, a, b):
        """GCD: mcd(24, 36) → 12"""
        return gcd(int(a), int(b))

    def _mcm(self, a, b):
        """LCM: mcm(4, 6) → 12"""
        return lcm(int(a), int(b))

    def _es_primo(self, n):
        """Is prime: esPrimo(17) → 'Sí, 17 es primo'"""
        result = isprime(int(n))
        return f"Sí, {int(n)} es primo" if result else f"No, {int(n)} no es primo"

    def _combinar(self, n, k):
        """Combinations: combinar(10, 3) → 120"""
        return binomial(int(n), int(k))

    def _permutar(self, n, k):
        """Permutations: permutar(10, 3) → 720"""
        return factorial(int(n)) // factorial(int(n) - int(k))

    def _factores_primos(self, n):
        """Prime factorization: factoresPrimos(360) → {2: 3, 3: 2, 5: 1}"""
        factors = factorint(int(n))
        parts = [f"{p}^{e}" if e > 1 else str(p) for p, e in sorted(factors.items())]
        return " × ".join(parts)

    # ============ STATISTICS ============
    
    def _media(self, *values):
        """Mean: media(1, 2, 3, 4, 5) → 3"""
        nums = [float(v) for v in values]
        return sum(nums) / len(nums)
    
    def _mediana(self, *values):
        """Median: mediana(1, 2, 3, 4, 5) → 3"""
        nums = sorted([float(v) for v in values])
        n_vals = len(nums)
        mid = n_vals // 2
        if n_vals % 2 == 0:
            return (nums[mid - 1] + nums[mid]) / 2
        return nums[mid]
    
    def _desviacion(self, *values):
        """Standard deviation: desviacion(1, 2, 3, 4, 5)"""
        nums = [float(v) for v in values]
        mean_val = sum(nums) / len(nums)
        variance_val = sum((xi - mean_val) ** 2 for xi in nums) / len(nums)
        return variance_val ** 0.5
    
    def _varianza(self, *values):
        """Variance: varianza(1, 2, 3, 4, 5)"""
        nums = [float(v) for v in values]
        mean_val = sum(nums) / len(nums)
        return sum((xi - mean_val) ** 2 for xi in nums) / len(nums)

    def _covarianza(self, *values):
        """Covariance: covarianza(1,2,3, 4,5,6) → pass pairs"""
        nums = [float(v) for v in values]
        half = len(nums) // 2
        xs, ys = nums[:half], nums[half:]
        mx, my = sum(xs)/len(xs), sum(ys)/len(ys)
        return sum((xi-mx)*(yi-my) for xi, yi in zip(xs, ys)) / len(xs)

    def _correlacion(self, *values):
        """Pearson correlation"""
        nums = [float(v) for v in values]
        half = len(nums) // 2
        xs, ys = nums[:half], nums[half:]
        mx, my = sum(xs)/len(xs), sum(ys)/len(ys)
        cov = sum((xi-mx)*(yi-my) for xi, yi in zip(xs, ys)) / len(xs)
        sx = (sum((xi-mx)**2 for xi in xs) / len(xs)) ** 0.5
        sy = (sum((yi-my)**2 for yi in ys) / len(ys)) ** 0.5
        if sx == 0 or sy == 0:
            return 0
        return round(cov / (sx * sy), 6)

    def _regresion(self, *values):
        """Linear regression: regresion(x1,x2,..., y1,y2,...) → {m, b}"""
        nums = [float(v) for v in values]
        half = len(nums) // 2
        xs, ys = nums[:half], nums[half:]
        n_pts = len(xs)
        mx, my = sum(xs)/n_pts, sum(ys)/n_pts
        num = sum((xi-mx)*(yi-my) for xi, yi in zip(xs, ys))
        den = sum((xi-mx)**2 for xi in xs)
        m = num / den if den != 0 else 0
        b = my - m * mx
        return {'pendiente': round(m, 6), 'intercepto': round(b, 6), 'ecuacion': f'y = {round(m,4)}x + {round(b,4)}'}

    def _normalpdf(self, x_val, mu=0, sigma=1):
        """Normal PDF: normalpdf(0, 0, 1) → 0.3989..."""
        x_val, mu, sigma = float(x_val), float(mu), float(sigma)
        return round((1/(sigma * math.sqrt(2*math.pi))) * math.exp(-0.5*((x_val-mu)/sigma)**2), 8)

    def _binomialpmf(self, k_val, n_val, p_val):
        """Binomial PMF: binomialpmf(3, 10, 0.5)"""
        k_val, n_val, p_val = int(k_val), int(n_val), float(p_val)
        coeff = math.comb(n_val, k_val)
        return round(coeff * (p_val ** k_val) * ((1 - p_val) ** (n_val - k_val)), 8)

    # ============ FINANCE ============

    def _van(self, tasa, *flujos):
        """NPV: van(0.10, -1000, 300, 400, 500)"""
        r = float(tasa)
        result = 0
        for i, flujo in enumerate(flujos):
            result += float(flujo) / ((1 + r) ** i)
        return round(result, 2)

    def _tir(self, *flujos):
        """IRR: tir(-1000, 300, 400, 500) using Newton-Raphson"""
        flows = [float(f) for f in flujos]

        def npv(r):
            return sum(f / ((1 + r) ** i) for i, f in enumerate(flows))

        def npv_deriv(r):
            return sum(-i * f / ((1 + r) ** (i + 1)) for i, f in enumerate(flows))

        r = 0.1  # Initial guess
        for _ in range(100):
            npv_val = npv(r)
            if abs(npv_val) < 1e-10:
                break
            deriv = npv_deriv(r)
            if deriv == 0:
                break
            r = r - npv_val / deriv

        return round(r * 100, 2)  # Return as percentage

    def _depreciar(self, costo, residual, años):
        """Straight-line depreciation: depreciar(10000, 1000, 5)"""
        c, r, n = float(costo), float(residual), int(años)
        annual = (c - r) / n
        schedule = []
        for i in range(n):
            schedule.append({
                'año': i + 1,
                'depreciacion': round(annual, 2),
                'acumulado': round(annual * (i + 1), 2),
                'valor_libro': round(c - annual * (i + 1), 2)
            })
        return schedule

    def _interes_simple(self, capital, tasa, tiempo):
        """Simple interest: interes_simple(1000, 0.05, 3)"""
        c, r, t = float(capital), float(tasa), float(tiempo)
        interest = c * r * t
        return {
            'interes': round(interest, 2),
            'monto_final': round(c + interest, 2)
        }

    def _interes_compuesto(self, capital, tasa, n, tiempo):
        """Compound interest: interes_compuesto(1000, 0.05, 12, 3)"""
        c, r, periods, t = float(capital), float(tasa), int(n), float(tiempo)
        monto = c * ((1 + r / periods) ** (periods * t))
        return {
            'monto_final': round(monto, 2),
            'interes': round(monto - c, 2)
        }

    def _distancia(self, p1, p2):
        geo = GeometryEngine()
        return geo.distancia(p1, p2)

    def _punto_medio(self, p1, p2):
        geo = GeometryEngine()
        return geo.punto_medio(p1, p2)

    def _pendiente(self, p1, p2):
        geo = GeometryEngine()
        return geo.pendiente(p1, p2)

    def _recta(self, p1, p2):
        geo = GeometryEngine()
        return geo.recta(p1, p2)

    def _circulo(self, centro, radio):
        geo = GeometryEngine()
        return geo.circulo(centro, radio)

    def _sonify(self, expr, duration=3.0, filename="output.wav"):
        """Generate audio from expression: sonify(sin(440*2*pi*t))"""
        engine = AudioEngine()
        return engine.generate(str(expr), float(duration), str(filename))

    # ============ NUMERAL SYSTEMS ============

    def _binario(self, number):
        """Convert to binary: bin(10) → '0b1010'"""
        try:
            return bin(int(number))
        except:
            return bin(int(float(number)))

    def _octal(self, number):
        """Convert to octal: oct(10) → '0o12'"""
        try:
            return oct(int(number))
        except:
            return oct(int(float(number)))

    def _hexadecimal(self, number):
        """Convert to hex: hex(255) → '0xff'"""
        try:
            return hex(int(number))
        except:
            return hex(int(float(number)))

    def _base_n(self, number, base):
        """Convert to arbitrary base: base(10, 2) → '1010'"""
        n = int(number)
        b = int(base)
        if n == 0:
            return "0"
        digits = []
        while n:
            digits.append(int(n % b))
            n //= b
        return "".join(str(d) for d in digits[::-1])

# ============================================================
# Convenience functions for direct import: from binary_equalab import *
# ============================================================
_engine = MathEngine()

def derivar(expr, var=None, n=1):
    return _engine._derivar(_engine.parse(str(expr)), var, n)

def integrar(expr, var=None, a=None, b=None):
    return _engine._integrar(_engine.parse(str(expr)), var, a, b)

def limite(expr, var=None, punto=0):
    return _engine._limite(_engine.parse(str(expr)), var, punto)

def sumatoria(expr, var=None, a=0, b=10):
    return _engine._sumatoria(_engine.parse(str(expr)), var, a, b)

def taylor(expr, var=None, punto=0, orden=5):
    return _engine._taylor(_engine.parse(str(expr)), var, punto, orden)

def simplificar(expr):
    return _engine._simplificar(_engine.parse(str(expr)))

def expandir(expr):
    return _engine._expandir(_engine.parse(str(expr)))

def factorizar(expr):
    return _engine._factorizar(_engine.parse(str(expr)))

def resolver(expr, var=None):
    return _engine._resolver(_engine.parse(str(expr)), var)

def parciales(expr, var=None):
    return _engine._parciales(_engine.parse(str(expr)), var)

def mcd(a, b):
    return _engine._mcd(a, b)

def mcm(a, b):
    return _engine._mcm(a, b)

def esPrimo(n):
    return _engine._es_primo(n)

def combinar(n, k):
    return _engine._combinar(n, k)

def permutar(n, k):
    return _engine._permutar(n, k)

def factoresPrimos(n):
    return _engine._factores_primos(n)

def van(tasa, *flujos):
    return _engine._van(tasa, *flujos)

def tir(*flujos):
    return _engine._tir(*flujos)

def depreciar(costo, residual, años):
    return _engine._depreciar(costo, residual, años)

def interes_simple(capital, tasa, tiempo):
    return _engine._interes_simple(capital, tasa, tiempo)

def interes_compuesto(capital, tasa, n, tiempo):
    return _engine._interes_compuesto(capital, tasa, n, tiempo)

def media(*values):
    return _engine._media(*values)

def mediana(*values):
    return _engine._mediana(*values)

def desviacion(*values):
    return _engine._desviacion(*values)

def varianza(*values):
    return _engine._varianza(*values)

def covarianza(*values):
    return _engine._covarianza(*values)

def correlacion(*values):
    return _engine._correlacion(*values)

def regresion(*values):
    return _engine._regresion(*values)

def normalpdf(x, mu=0, sigma=1):
    return _engine._normalpdf(x, mu, sigma)

def binomialpmf(k, n, p):
    return _engine._binomialpmf(k, n, p)

def distancia(p1, p2):
    return _engine._distancia(p1, p2)

def punto_medio(p1, p2):
    return _engine._punto_medio(p1, p2)

def pendiente(p1, p2):
    return _engine._pendiente(p1, p2)

def recta(p1, p2):
    return _engine._recta(p1, p2)

def circulo(centro, radio):
    return _engine._circulo(centro, radio)

def sonify(expr, duration=3.0, filename="output.wav"):
    return _engine._sonify(expr, duration, filename)

def binario(number):
    return _engine._binario(number)

def octal(number):
    return _engine._octal(number)

def hexadecimal(number):
    return _engine._hexadecimal(number)

def base(number, n):
    return _engine._base_n(number, n)
