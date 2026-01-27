"""
Motor matematico central de Binary EquaLab.
Maneja operaciones simbolicas utilizando SymPy.
Incluye: alfabeto griego, constantes fisicas, prefijos SI, y funciones CAS completas.
"""
import sympy as sp
from sympy.abc import t, s, x, y, z, n, k, a, b, c
from sympy.parsing.sympy_parser import (parse_expr, standard_transformations,
                                         implicit_multiplication_application,
                                         convert_xor)
from sympy import symbols, Function


# =============================================================================
# ALFABETO GRIEGO
# =============================================================================
GREEK_ALPHABET = {
    # Minusculas
    'alpha': sp.Symbol('alpha'), 'beta': sp.Symbol('beta'), 'gamma': sp.Symbol('gamma'),
    'delta': sp.Symbol('delta'), 'epsilon': sp.Symbol('epsilon'), 'zeta': sp.Symbol('zeta'),
    'eta': sp.Symbol('eta'), 'theta': sp.Symbol('theta'), 'iota': sp.Symbol('iota'),
    'kappa': sp.Symbol('kappa'), 'lambda': sp.Symbol('lambda'), 'mu': sp.Symbol('mu'),
    'nu': sp.Symbol('nu'), 'xi': sp.Symbol('xi'), 'omicron': sp.Symbol('omicron'),
    'rho': sp.Symbol('rho'), 'sigma': sp.Symbol('sigma'), 'tau': sp.Symbol('tau'),
    'upsilon': sp.Symbol('upsilon'), 'phi': sp.Symbol('phi'), 'chi': sp.Symbol('chi'),
    'psi': sp.Symbol('psi'), 'omega': sp.Symbol('omega'),
    # Mayusculas comunes
    'Alpha': sp.Symbol('Alpha'), 'Beta': sp.Symbol('Beta'), 'Gamma': sp.Symbol('Gamma'),
    'Delta': sp.Symbol('Delta'), 'Theta': sp.Symbol('Theta'), 'Lambda': sp.Symbol('Lambda'),
    'Sigma': sp.Symbol('Sigma'), 'Phi': sp.Symbol('Phi'), 'Psi': sp.Symbol('Psi'),
    'Omega': sp.Symbol('Omega'),
}


# =============================================================================
# CONSTANTES FISICAS (SI)
# =============================================================================
PHYSICAL_CONSTANTS = {
    # Fundamentales
    'c': 299792458,                    # Velocidad de la luz (m/s)
    'G': 6.67430e-11,                  # Constante gravitacional (m^3 kg^-1 s^-2)
    'h': 6.62607015e-34,               # Constante de Planck (J s)
    'hbar': 1.054571817e-34,           # Planck reducida (J s)
    'e_charge': 1.602176634e-19,       # Carga del electron (C)
    'epsilon0': 8.8541878128e-12,      # Permitividad del vacio (F/m)
    'mu0': 1.25663706212e-6,           # Permeabilidad del vacio (H/m)
    
    # Masa de particulas
    'm_e': 9.1093837015e-31,           # Masa del electron (kg)
    'm_p': 1.67262192369e-27,          # Masa del proton (kg)
    'm_n': 1.67492749804e-27,          # Masa del neutron (kg)
    
    # Termodinamica
    'k_B': 1.380649e-23,               # Constante de Boltzmann (J/K)
    'N_A': 6.02214076e23,              # Numero de Avogadro (1/mol)
    'R': 8.314462618,                  # Constante de los gases (J/(mol K))
    
    # Gravedad
    'g': 9.80665,                      # Aceleracion gravitatoria estandar (m/s^2)
    
    # Electromagnetismo
    'ke': 8.9875517923e9,              # Constante de Coulomb (N m^2 / C^2)
}


# =============================================================================
# PREFIJOS SI
# =============================================================================
SI_PREFIXES = {
    'yotta': 1e24,  'Y': 1e24,
    'zetta': 1e21,  'Z': 1e21,
    'exa':   1e18,  'E': 1e18,
    'peta':  1e15,  'P': 1e15,
    'tera':  1e12,  'T': 1e12,
    'giga':  1e9,   'G': 1e9,
    'mega':  1e6,   'M': 1e6,
    'kilo':  1e3,   'k': 1e3,
    'hecto': 1e2,   'h': 1e2,
    'deca':  1e1,   'da': 1e1,
    # Base
    'deci':  1e-1,  'd': 1e-1,
    'centi': 1e-2,  'cm': 1e-2,
    'milli': 1e-3,  'm': 1e-3,
    'micro': 1e-6,  'u': 1e-6,
    'nano':  1e-9,  'n': 1e-9,
    'pico':  1e-12, 'p': 1e-12,
    'femto': 1e-15, 'f': 1e-15,
    'atto':  1e-18, 'a': 1e-18,
    'zepto': 1e-21, 'z': 1e-21,
    'yocto': 1e-24, 'y_prefix': 1e-24,
}


class EquaEngine:
    def __init__(self):
        self.last_expr = None
        self.history = []
        self.variables = {}  # Almacen de variables definidas por el usuario
        
        # Transformaciones para parseo inteligente
        self.transformations = (standard_transformations + 
                                 (implicit_multiplication_application, convert_xor))
        
        # Construir diccionario local con todo
        self.local_dict = self._build_local_dict()

    def _build_local_dict(self):
        """Construye el diccionario de simbolos y funciones disponibles."""
        d = {
            # Variables comunes
            't': t, 's': s, 'x': x, 'y': y, 'z': z, 'n': n, 'k': k,
            'a': a, 'b': b, 'c': c,
            
            # Constantes matematicas
            'pi': sp.pi, 'e': sp.E, 'I': sp.I, 'i': sp.I,
            'oo': sp.oo, 'inf': sp.oo,  # Infinito
            
            # Funciones trigonometricas
            'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
            'csc': sp.csc, 'sec': sp.sec, 'cot': sp.cot,
            'asin': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
            'acsc': sp.acsc, 'asec': sp.asec, 'acot': sp.acot,
            'arcsin': sp.asin, 'arccos': sp.acos, 'arctan': sp.atan,
            
            # Funciones hiperbolicas
            'sinh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh,
            'csch': sp.csch, 'sech': sp.sech, 'coth': sp.coth,
            'asinh': sp.asinh, 'acosh': sp.acosh, 'atanh': sp.atanh,
            
            # Logaritmos y exponenciales
            'log': sp.log, 'ln': sp.log, 'exp': sp.exp,
            'log10': lambda x: sp.log(x, 10),
            'log2': lambda x: sp.log(x, 2),
            
            # Raices y potencias
            'sqrt': sp.sqrt, 'cbrt': lambda x: x**sp.Rational(1,3),
            'root': lambda x, n: x**sp.Rational(1, n),
            
            # Valores absolutos y signos
            'abs': sp.Abs, 'sign': sp.sign,
            
            # Factorial y combinatoria
            'factorial': sp.factorial, 'binomial': sp.binomial,
            'perm': lambda n, k: sp.factorial(n) / sp.factorial(n-k),
            'comb': sp.binomial,
            
            # Funciones especiales
            'gamma': sp.gamma, 'beta': sp.beta,
            'erf': sp.erf, 'erfc': sp.erfc,
            'Heaviside': sp.Heaviside, 'DiracDelta': sp.DiracDelta,
            
            # Numeros complejos
            're': sp.re, 'im': sp.im, 'conjugate': sp.conjugate,
            'arg': sp.arg, 'Abs': sp.Abs,
            
            # Redondeo
            'floor': sp.floor, 'ceiling': sp.ceiling, 'round': sp.N,
            
            # Matrices
            'Matrix': sp.Matrix, 'eye': sp.eye, 'zeros': sp.zeros, 'ones': sp.ones,
            'det': lambda M: M.det() if hasattr(M, 'det') else sp.det(M),
            'inv': lambda M: M.inv() if hasattr(M, 'inv') else M**(-1),
            'transpose': lambda M: M.T if hasattr(M, 'T') else sp.transpose(M),
            
            # Sumatorias y productos
            'Sum': sp.Sum, 'Product': sp.Product,
            'summation': sp.summation, 'product': sp.product,
        }
        
        # Agregar alfabeto griego
        d.update(GREEK_ALPHABET)
        
        # Agregar constantes fisicas como simbolos
        for name, value in PHYSICAL_CONSTANTS.items():
            d[name] = sp.Float(value)
        
        return d

    def parse_expression(self, expr_str, var_name='t'):
        """Convierte un string a expresion SymPy con parseo inteligente."""
        try:
            # Usar MathParser para preprocesamiento robusto
            from ..utils.math_parser import parse_expression as preprocess
            
            parsed = preprocess(expr_str)
            if not parsed.success:
                return f"Error de sintaxis: {parsed.error}"
            
            clean_expr = parsed.expression
            # Reemplazar ^ con ** para exponentes (por si queda alguno)
            clean_expr = clean_expr.replace('^', '**')
            
            # Usar el parser de SymPy con multiplicacion implicita
            expr = parse_expr(clean_expr, 
                              local_dict=self.local_dict,
                              transformations=self.transformations)
            self.last_expr = expr
            self.history.append(('parse', expr_str, expr))
            return expr
        except ImportError:
            # Fallback si no está disponible math_parser
            clean_expr = expr_str.replace('^', '**')
            expr = parse_expr(clean_expr, 
                              local_dict=self.local_dict,
                              transformations=self.transformations)
            self.last_expr = expr
            self.history.append(('parse', expr_str, expr))
            return expr
        except Exception as e:
            return f"Error de sintaxis: {str(e)}"

    def simplify(self, expr_str):
        """Simplifica una expresion."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        return sp.simplify(expr)

    def expand(self, expr_str):
        """Expande una expresion."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        return sp.expand(expr)

    def factor(self, expr_str):
        """Factoriza una expresion."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        return sp.factor(expr)

    def derivative(self, expr_str, var_name='x', order=1):
        """Calcula la derivada de orden n."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        var = self.local_dict.get(var_name, x)
        return sp.diff(expr, var, order)

    def integral(self, expr_str, var_name='x', a=None, b=None):
        """Calcula la integral (definida o indefinida)."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        var = self.local_dict.get(var_name, x)
        if a is not None and b is not None:
            return sp.integrate(expr, (var, a, b))
        return sp.integrate(expr, var)

    def limit(self, expr_str, var_name='x', point=0, direction='+'):
        """Calcula el limite de una expresion."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        var = self.local_dict.get(var_name, x)
        return sp.limit(expr, var, point, direction)

    def solve(self, expr_str, var_name='x'):
        """Resuelve una ecuacion (expr = 0)."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        var = self.local_dict.get(var_name, x)
        return sp.solve(expr, var)

    def laplace(self, expr_str):
        """Calcula la Transformada de Laplace F(s) asumiendo f(t)."""
        expr = self.parse_expression(expr_str, 't')
        if isinstance(expr, str): return expr
        
        return sp.laplace_transform(expr, t, s, noconds=True)

    def inverse_laplace(self, expr_str):
        """Calcula la Transformada Inversa de Laplace f(t) asumiendo F(s)."""
        expr = self.parse_expression(expr_str, 's')
        if isinstance(expr, str): return expr
        
        return sp.inverse_laplace_transform(expr, s, t)

    def taylor(self, expr_str, var_name='x', point=0, order=5):
        """Calcula la serie de Taylor."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        var = self.local_dict.get(var_name, x)
        return sp.series(expr, var, point, order).removeO()

    def dsolve(self, expr_str):
        """Resuelve una ecuacion diferencial ordinaria."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        # Crear funcion y(x) para EDO
        y_func = Function('y')
        return sp.dsolve(expr)

    def to_latex(self, expr_str):
        """Convierte una expresion a LaTeX."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        return sp.latex(expr)

    def evaluate(self, expr_str, val, var_name='x'):
        """Evalua numericamente una expresion."""
        expr = self.parse_expression(expr_str)
        if isinstance(expr, str): return expr
        
        var = self.local_dict.get(var_name, x)
        return expr.subs(var, val).evalf()

    def set_variable(self, name, value):
        """Define una variable personalizada."""
        self.variables[name] = value
        self.local_dict[name] = value

    def get_physical_constant(self, name):
        """Obtiene el valor de una constante fisica."""
        return PHYSICAL_CONSTANTS.get(name, None)

    def convert_prefix(self, value, from_prefix, to_prefix=''):
        """Convierte entre prefijos SI."""
        from_factor = SI_PREFIXES.get(from_prefix, 1)
        to_factor = SI_PREFIXES.get(to_prefix, 1) if to_prefix else 1
        return value * from_factor / to_factor
