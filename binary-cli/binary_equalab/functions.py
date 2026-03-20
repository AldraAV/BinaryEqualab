"""
Binary EquaLab - Exported Functions v3.1
Convenience re-exports for direct import usage.
"""

from .engine import (
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
