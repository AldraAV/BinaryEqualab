from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import math
import os
import sys

router = APIRouter(prefix="/api/graphics", tags=["Graphics"])

# Lazy globals to avoid startup deadlock
_np = None
_sp = None
_engine = None

def _get_deps():
    global _np, _sp, _engine
    if _np is None:
        import numpy as np
        _np = np
    if _sp is None:
        import sympy as sp
        _sp = sp
    if _engine is None:
        # Load equacore
        current_dir = os.path.dirname(os.path.abspath(__file__))
        engine_path = os.path.abspath(os.path.join(current_dir, '..', '..', 'engine', 'python'))
        if engine_path not in sys.path:
            sys.path.insert(0, engine_path)
        try:
            from equacore import MathEngine
            _engine = MathEngine()
        except ImportError:
            # Fallback to pure sympy if equacore fails
            _engine = None
    return _np, _sp, _engine

def parse_expr(expr_str: str, sp, engine):
    """Convierte un string a una expresión de SymPy de forma segura"""
    # Limpieza basica
    expr_str = str(expr_str).replace('seno', 'sin')
    
    if engine:
        try:
            # The method is parse_expression in EquaEngine
            parsed = engine.parse_expression(expr_str)
            if not isinstance(parsed, str):
                return parsed
        except Exception:
            pass
    # Fallback puramente sympy
    from sympy.parsing.sympy_parser import parse_expr as sp_parse, standard_transformations, implicit_multiplication_application, convert_xor
    transformations = standard_transformations + (implicit_multiplication_application, convert_xor)
    return sp_parse(expr_str, transformations=transformations)

# --- Modelos de Peticion ---

class EvaluateRequest(BaseModel):
    expressions: List[str]
    x_min: float
    x_max: float
    points: int = 400

class EvaluateResponse(BaseModel):
    x: List[float]
    y_curves: List[List[Optional[float]]]

class DerivativeRequest(BaseModel):
    expression: str
    x_min: float
    x_max: float
    points: int = 400

class DerivativeResponse(BaseModel):
    x: List[float]
    y: List[Optional[float]]
    derivative_expr: str

class ConvolutionRequest(BaseModel):
    f_expr: str
    g_expr: str
    t_val: float
    x_min: float = -10.0
    x_max: float = 10.0
    curve_points: int = 100

class ConvolutionResponse(BaseModel):
    curve_x: List[float]
    curve_y: List[float]
    area_x: List[float]
    area_y: List[float]
    current_val: float

# --- Endpoints ---

@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate_functions(request: EvaluateRequest):
    np, sp, engine = _get_deps()
    x_sym = sp.Symbol('x')
    
    # Generar vector x
    x_arr = np.linspace(request.x_min, request.x_max, request.points)
    x_list = x_arr.tolist()
    
    y_curves = []
    for expr_str in request.expressions:
        try:
            expr = parse_expr(expr_str, sp, engine)
            # Lambdify para evaluacion rapida
            f = sp.lambdify(x_sym, expr, modules=['numpy', 'math'])
            
            # Evaluar
            try:
                y_arr = f(x_arr)
                # Manejar el caso donde lambdify devuelve un escalar (ej. f(x) = 5)
                if np.isscalar(y_arr):
                    y_arr = np.full_like(x_arr, float(y_arr))
                
                # Convertir NaN o Inf a None para JSON
                y_list = [float(val) if np.isfinite(val) else None for val in y_arr]
                y_curves.append(y_list)
            except Exception:
                # Si falla lambdify vectorizado, intentamos punto por punto
                y_list = []
                for x_val in x_list:
                    try:
                        y = float(expr.subs(x_sym, x_val))
                        y_list.append(y if np.isfinite(y) else None)
                    except Exception:
                        y_list.append(None)
                y_curves.append(y_list)
        except Exception:
            # Falla al parsear, devolvemos vacio
            y_curves.append([None] * request.points)
            
    return {"x": x_list, "y_curves": y_curves}

@router.post("/derivative", response_model=DerivativeResponse)
def evaluate_derivative(request: DerivativeRequest):
    np, sp, engine = _get_deps()
    x_sym = sp.Symbol('x')
    
    try:
        expr = parse_expr(request.expression, sp, engine)
        # Derivada analítica real
        deriv = sp.diff(expr, x_sym)
        
        x_arr = np.linspace(request.x_min, request.x_max, request.points)
        f_prime = sp.lambdify(x_sym, deriv, modules=['numpy', 'math'])
        
        try:
            y_arr = f_prime(x_arr)
            if np.isscalar(y_arr):
                y_arr = np.full_like(x_arr, float(y_arr))
            y_list = [float(val) if np.isfinite(val) else None for val in y_arr]
        except Exception:
            y_list = []
            for x_val in x_arr:
                try:
                    y = float(deriv.subs(x_sym, x_val))
                    y_list.append(y if np.isfinite(y) else None)
                except Exception:
                    y_list.append(None)
                    
        return {
            "x": x_arr.tolist(),
            "y": y_list,
            "derivative_expr": str(deriv)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/convolution", response_model=ConvolutionResponse)
def evaluate_convolution(req: ConvolutionRequest):
    np, sp, engine = _get_deps()
    x_sym = sp.Symbol('x') # Lo usamos como variable generica (tau)
    
    try:
        f_expr = parse_expr(req.f_expr, sp, engine)
        g_expr = parse_expr(req.g_expr, sp, engine)
        
        f_func = sp.lambdify(x_sym, f_expr, modules=['numpy', 'math'])
        g_func = sp.lambdify(x_sym, g_expr, modules=['numpy', 'math'])
        
        # Funcion helper para evaluar seguro
        def safe_eval(func, x_arr):
            try:
                y = func(x_arr)
                if np.isscalar(y): return np.full_like(x_arr, float(y))
                return y
            except:
                return np.zeros_like(x_arr)
                
        # 1. Calcular toda la curva de convolucion (f * g)(t) en el rango [x_min, x_max]
        t_arr = np.linspace(req.x_min, req.x_max, req.curve_points)
        curve_y = []
        
        # Integracion numerica rápida para la curva
        n_integration = 60
        tau_arr = np.linspace(req.x_min, req.x_max, n_integration + 1)
        f_tau = safe_eval(f_func, tau_arr)
        
        # Pesos de Simpson
        weights = np.ones(n_integration + 1)
        weights[1:-1:2] = 4
        weights[2:-2:2] = 2
        h = (req.x_max - req.x_min) / n_integration
        
        for t in t_arr:
            g_t_minus_tau = safe_eval(g_func, t - tau_arr)
            product = f_tau * g_t_minus_tau
            integral_val = (h / 3) * np.sum(product * weights)
            curve_y.append(float(integral_val) if np.isfinite(integral_val) else 0.0)
            
        # 2. Calcular el area sombreada específica para t = req.t_val
        area_x = np.linspace(req.x_min, req.x_max, 200)
        f_area = safe_eval(f_func, area_x)
        g_area = safe_eval(g_func, req.t_val - area_x)
        area_y = f_area * g_area
        
        # Current val (usando Simpson para este t específico con mas precision)
        n_exact = 100
        tau_exact = np.linspace(req.x_min, req.x_max, n_exact + 1)
        weights_exact = np.ones(n_exact + 1)
        weights_exact[1:-1:2] = 4
        weights_exact[2:-2:2] = 2
        h_exact = (req.x_max - req.x_min) / n_exact
        
        product_exact = safe_eval(f_func, tau_exact) * safe_eval(g_func, req.t_val - tau_exact)
        current_val = (h_exact / 3) * np.sum(product_exact * weights_exact)
        
        return {
            "curve_x": t_arr.tolist(),
            "curve_y": curve_y,
            "area_x": area_x.tolist(),
            "area_y": [float(y) if np.isfinite(y) else 0.0 for y in area_y.tolist()],
            "current_val": float(current_val) if np.isfinite(current_val) else 0.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en convolucion: {str(e)}")
