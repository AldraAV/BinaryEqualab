from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import math
import os
import sys

router = APIRouter(prefix="/api/epicycles", tags=["Epicycles"])

# Lazy globals
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
        current_dir = os.path.dirname(os.path.abspath(__file__))
        engine_path = os.path.abspath(os.path.join(current_dir, '..', '..', 'engine', 'python'))
        if engine_path not in sys.path:
            sys.path.insert(0, engine_path)
        try:
            from equacore import MathEngine
            _engine = MathEngine()
        except ImportError:
            _engine = None
    return _np, _sp, _engine

def parse_expr(expr_str: str, sp, engine):
    """Convierte un string a una expresión de SymPy de forma segura"""
    expr_str = str(expr_str).replace('seno', 'sin')
    if engine:
        try:
            parsed = engine.parse_expression(expr_str)
            if not isinstance(parsed, str):
                return parsed
        except Exception:
            pass
    # Fallback
    from sympy.parsing.sympy_parser import parse_expr as sp_parse, standard_transformations, implicit_multiplication_application, convert_xor
    transformations = standard_transformations + (implicit_multiplication_application, convert_xor)
    return sp_parse(expr_str, transformations=transformations)

# --- Modelos ---

class Point(BaseModel):
    x: float
    y: float

class FFTRequest(BaseModel):
    points: List[Point]

class Coefficient(BaseModel):
    freq: int
    amplitude: float
    phase: float

class FFTResponse(BaseModel):
    coefficients: List[Coefficient]

class SmoothRequest(BaseModel):
    points: List[Point]
    iterations: int = 3

class SmoothResponse(BaseModel):
    points: List[Point]

class ParseParametricRequest(BaseModel):
    expression: str
    samples: int = 200

class ParseParametricResponse(BaseModel):
    points: List[Point]

# --- Endpoints ---

@router.post("/fft", response_model=FFTResponse)
def compute_fft(request: FFTRequest):
    np, sp, engine = _get_deps()
    
    n = len(request.points)
    if n == 0:
        return {"coefficients": []}
        
    # Convertir a complejo x + iy
    # Pero notar el formato de computeDFTLocal en frontend:
    # re += x * cos(angle) + y * sin(angle)
    # im += y * cos(angle) - x * sin(angle)
    # Esto es exactamente la transformacion de Fourier DFT estandar (x + iy) * e^(-i * angle)
    
    complex_pts = np.array([pt.x + 1j * pt.y for pt in request.points], dtype=np.complex128)
    
    # Calcular FFT (O(N log N))
    fft_vals = np.fft.fft(complex_pts) / n
    
    coeffs = []
    for k in range(n):
        val = fft_vals[k]
        amp = float(np.abs(val))
        phase = float(np.angle(val))
        coeffs.append(Coefficient(freq=k, amplitude=amp, phase=phase))
        
    # Ordenar por amplitud descendente (mayor círculo primero)
    coeffs.sort(key=lambda c: c.amplitude, reverse=True)
    
    return {"coefficients": coeffs}

@router.post("/smooth", response_model=SmoothResponse)
def smooth_path(request: SmoothRequest):
    pts = request.points
    if len(pts) < 3:
        return {"points": pts}
        
    current = pts
    for _ in range(request.iterations):
        new_pts = [current[0]]
        for i in range(1, len(current) - 1):
            prev = current[i - 1]
            curr = current[i]
            nxt = current[i + 1]
            
            x = 0.25 * prev.x + 0.5 * curr.x + 0.25 * nxt.x
            y = 0.25 * prev.y + 0.5 * curr.y + 0.25 * nxt.y
            new_pts.append(Point(x=x, y=y))
            
        new_pts.append(current[-1])
        current = new_pts
        
    return {"points": current}

@router.post("/parse_parametric", response_model=ParseParametricResponse)
def parse_parametric(request: ParseParametricRequest):
    np, sp, engine = _get_deps()
    
    expr_str = request.expression
    samples = request.samples
    t_sym = sp.Symbol('t')
    points_out = []
    
    try:
        if ';' in expr_str:
            parts = expr_str.split(';')
            # Extraer lo de despues de '=' si existe
            x_str = parts[0].split('=')[-1].strip() if '=' in parts[0] else parts[0].strip()
            y_str = parts[1].split('=')[-1].strip() if '=' in parts[1] else parts[1].strip()
            
            x_expr = parse_expr(x_str, sp, engine)
            y_expr = parse_expr(y_str, sp, engine)
            
            f_x = sp.lambdify(t_sym, x_expr, modules=['numpy', 'math'])
            f_y = sp.lambdify(t_sym, y_expr, modules=['numpy', 'math'])
            
            t_arr = np.linspace(0, 2 * np.pi, samples + 1)
            
            # Evaluar y escalar (* 100 como hacia el frontend original)
            x_arr = f_x(t_arr)
            y_arr = f_y(t_arr)
            
            if np.isscalar(x_arr): x_arr = np.full_like(t_arr, float(x_arr))
            if np.isscalar(y_arr): y_arr = np.full_like(t_arr, float(y_arr))
            
            for i in range(len(t_arr)):
                if np.isfinite(x_arr[i]) and np.isfinite(y_arr[i]):
                    points_out.append(Point(x=float(x_arr[i] * 100), y=float(y_arr[i] * 100)))
                    
        else:
            # Polar r = f(t)
            r_str = expr_str.split('=')[-1].strip() if '=' in expr_str else expr_str.strip()
            r_expr = parse_expr(r_str, sp, engine)
            f_r = sp.lambdify(t_sym, r_expr, modules=['numpy', 'math'])
            
            t_arr = np.linspace(0, 4 * np.pi, samples + 1)
            r_arr = f_r(t_arr)
            
            if np.isscalar(r_arr): r_arr = np.full_like(t_arr, float(r_arr))
            
            for i in range(len(t_arr)):
                if np.isfinite(r_arr[i]):
                    r_val = float(r_arr[i] * 100)
                    t_val = float(t_arr[i])
                    x_val = r_val * math.cos(t_val)
                    y_val = r_val * math.sin(t_val)
                    points_out.append(Point(x=x_val, y=y_val))
                    
        if len(points_out) < 5:
            raise HTTPException(status_code=400, detail="No se pudieron generar suficientes puntos válidos.")
            
        return {"points": points_out}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PresetWaveRequest(BaseModel):
    wave_type: str
    num_circles: int
    base_amplitude: float = 100.0

@router.post("/preset_wave", response_model=FFTResponse)
def preset_wave(request: PresetWaveRequest):
    coeffs = []
    base_amp = request.base_amplitude
    
    for i in range(request.num_circles):
        freq = 0
        amp = 0.0
        phase = 0.0
        
        if request.wave_type == 'square':
            n = i * 2 + 1
            freq = n
            amp = base_amp * (4 / (n * math.pi))
        elif request.wave_type == 'triangle':
            n = i * 2 + 1
            freq = n
            sign = 1 if (i % 2 == 0) else -1
            amp = base_amp * sign * (8 / (math.pi * math.pi * n * n))
            # amplitude goes negative, so we can adjust phase if we want, or keep amp negative
        elif request.wave_type == 'sawtooth':
            n = i + 1
            freq = n
            sign = -1 if (n % 2 == 0) else 1
            amp = base_amp * (2 / (n * math.pi)) * sign
        else:
            n = i * 2 + 1
            freq = n
            amp = base_amp * (4 / (n * math.pi))
            
        coeffs.append(Coefficient(freq=freq, amplitude=amp, phase=phase))
        
    return {"coefficients": coeffs}
