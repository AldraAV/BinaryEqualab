"""
Binary EquaLab CLI v3.1
Command-line CAS calculator with Spanish math functions.
Powered by SymEngine (C++ native) + SymPy.
"""

__version__ = "3.1.0"
__author__ = "BinaryEquaLab Team"

from .engine import MathEngine, HAS_SYMENGINE
from .functions import (
    # Calculus
    derivar, integrar, limite, sumatoria, taylor,
    # Algebra
    simplificar, expandir, factorizar, resolver,
    parciales, mcd, mcm, esPrimo, combinar, permutar, factoresPrimos,
    # Statistics
    media, mediana, desviacion, varianza,
    covarianza, correlacion, regresion, normalpdf, binomialpmf,
    # Finance
    van, tir, depreciar, interes_simple, interes_compuesto,
    # Geometry
    distancia, punto_medio, pendiente, recta, circulo,
    # Audio
    sonify,
    # Numeral
    binario, octal, hexadecimal, base,
)

__all__ = [
    "MathEngine", "HAS_SYMENGINE",
    "derivar", "integrar", "limite", "sumatoria", "taylor",
    "simplificar", "expandir", "factorizar", "resolver",
    "parciales", "mcd", "mcm", "esPrimo", "combinar", "permutar", "factoresPrimos",
    "media", "mediana", "desviacion", "varianza",
    "covarianza", "correlacion", "regresion", "normalpdf", "binomialpmf",
    "van", "tir", "depreciar", "interes_simple", "interes_compuesto",
    "distancia", "punto_medio", "pendiente", "recta", "circulo",
    "sonify",
    "binario", "octal", "hexadecimal", "base",
]
