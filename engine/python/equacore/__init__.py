"""
EquaCore - High-performance symbolic and numerical computation
Python wrapper for C++ engine using GiNaC and Eigen
"""

# Flags de estado del motor
NATIVE_BIO = False
NATIVE_SYMBOLIC = False

# 1. Intento de carga del motor Bio-Médico (Séptima)
try:
    from ._equacore import (
        BioODESolver,
        ODESolver,
        PTIParams,
        BergmanParams,
        HHParams,
        PKParams,
        WindkesselParams
    )
    NATIVE_BIO = True
except ImportError:
    # Fallback biomédico si fuera necesario (por ahora no hay fallback Python para ODEs complejos)
    pass

# 2. Intento de carga del motor Simbólico (GiNaC)
try:
    from ._equacore import (
        Expr,
        symbol,
        matrix,
        vector,
        add,
        multiply,
        scale,
        transpose,
        inverse,
        determinant,
        rank,
        lu,
        qr,
        svd,
        eigen,
        solve,
        rref,
        null_space,
        column_space,
        __version__ as _ver
    )
    NATIVE_SYMBOLIC = True
    __version__ = _ver
except ImportError:
    # Fallback a SymPy/NumPy para la parte simbólica
    from sympy import (
        Symbol as symbol,
        expand,
        simplify,
        factor,
        diff,
        integrate,
        solve as sym_solve,
        latex,
    )
    import numpy as np
    
    __version__ = "1.0.0-hybrid"
    
    class Expr:
        def __init__(self, expr_str_or_val):
            from sympy import sympify
            if isinstance(expr_str_or_val, str):
                from sympy.parsing.sympy_parser import (
                    parse_expr, 
                    standard_transformations, 
                    implicit_multiplication_application, 
                    convert_xor
                )
                transformations = standard_transformations + (implicit_multiplication_application, convert_xor)
                self._expr = parse_expr(expr_str_or_val, transformations=transformations)
            else:
                self._expr = sympify(expr_str_or_val)
        def expand(self): return Expr(self._expr.expand())
        def simplify(self): return Expr(self._expr.simplify())
        def factor(self): return Expr(self._expr.factor())
        def to_latex(self): return latex(self._expr)
        def __str__(self): return str(self._expr)
        def __repr__(self): return f"Expr({self._expr})"

    # NumPy Fallbacks
    def matrix(data): return np.array(data)
    def vector(data): return np.array(data)
    def add(a, b): return a + b
    def multiply(a, b): return a @ b
    def scale(m, s): return m * s
    def transpose(m): return m.T
    def inverse(m): return np.linalg.inv(m)
    def determinant(m): return np.linalg.det(m)
    def rank(m): return np.linalg.matrix_rank(m)
    def lu(m): from scipy.linalg import lu as slu; return slu(m)
    def qr(m): return np.linalg.qr(m)
    def svd(m): return np.linalg.svd(m)
    def eigen(m): return np.linalg.eigh(m)
    def solve(a, b): return np.linalg.solve(a, b)
    def rref(m): 
        from sympy import Matrix
        return np.array(Matrix(m).rref()[0].tolist(), dtype=float)

# Estado global
NATIVE_ENGINE = NATIVE_BIO and NATIVE_SYMBOLIC

if not NATIVE_SYMBOLIC:
    import warnings
    msg = "EquaCore Symbolic (GiNaC) not found. Using SymPy fallback."
    if NATIVE_BIO:
        msg += " | Bio-Engine (Séptima) is ACTIVE in C++ mode."
    warnings.warn(msg)

# Exportaciones dinámicas
__all__ = [
    'Expr', 'symbol', 'matrix', 'vector', 'add', 'multiply', 'scale',
    'transpose', 'inverse', 'determinant', 'rank', 'lu', 'qr', 'svd',
    'eigen', 'solve', 'rref', 'NATIVE_ENGINE', 'NATIVE_BIO', 'NATIVE_SYMBOLIC',
    'BioODESolver', 'PTIParams'
]
