from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Union
import math
import statistics as py_stats

import numpy as np

router = APIRouter(prefix="/api/statistics", tags=["Statistics"])

# --- Modelos de Petición ---

class DescriptiveRequest(BaseModel):
    data: List[float]

class DataPoint(BaseModel):
    x: float
    y: float

class RegressionRequest(BaseModel):
    points: List[DataPoint]

class NormalRequest(BaseModel):
    mean: float
    std: float
    x: Optional[float] = None
    prob: Optional[float] = None  # Para la Inversa (PPF)

class BinomialRequest(BaseModel):
    n: int
    p: float
    x: int

class PoissonRequest(BaseModel):
    lam: float  # lambda es reservada en Python
    x: int

# --- Endpoints ---

@router.post("/descriptive")
async def calculate_descriptive(request: DescriptiveRequest):
    data = request.data
    if not data:
        raise HTTPException(status_code=400, detail="No hay datos para calcular.")
    
    arr = np.array(data)
    n = len(arr)
    mean = float(np.mean(arr))
    median = float(np.median(arr))
    
    # Calcular moda (puede haber múltiples)
    vals, counts = np.unique(arr, return_counts=True)
    max_count = np.max(counts)
    modes = vals[counts == max_count]
    mode_list = [float(m) for m in modes]
    
    variance = float(np.var(arr, ddof=0))  # Poblacional
    std = float(np.std(arr, ddof=0))
    q1 = float(np.percentile(arr, 25))
    q3 = float(np.percentile(arr, 75))
    
    return {
        "count": n,
        "sum": float(np.sum(arr)),
        "mean": mean,
        "median": median,
        "mode": mode_list,
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "range": float(np.ptp(arr)),
        "variance": variance,
        "std": std,
        "q1": q1,
        "q3": q3,
        "iqr": q3 - q1
    }

@router.post("/regression")
async def calculate_regression(request: RegressionRequest):
    points = request.points
    if len(points) < 2:
        raise HTTPException(status_code=400, detail="Se requieren al menos 2 puntos.")
    
    x = np.array([p.x for p in points])
    y = np.array([p.y for p in points])
    
    slope, intercept = np.polyfit(x, y, 1)
    correlation_matrix = np.corrcoef(x, y)
    r_value = correlation_matrix[0, 1]
    
    sign = "+" if intercept >= 0 else "-"
    equation = f"y = {slope:.4f}x {sign} {abs(intercept):.4f}"
    
    return {
        "slope": float(slope),
        "intercept": float(intercept),
        "r2": float(r_value**2),
        "equation": equation
    }

@router.post("/normal")
async def calculate_normal(request: NormalRequest):
    if request.std <= 0:
        raise HTTPException(status_code=400, detail="La desviación estándar debe ser > 0.")
    
    ndist = py_stats.NormalDist(mu=request.mean, sigma=request.std)
    
    if request.prob is not None:
        # Inversa (Percent Point Function)
        if request.prob <= 0 or request.prob >= 1:
            raise HTTPException(status_code=400, detail="La probabilidad debe estar entre (0, 1).")
        x_val = float(ndist.inv_cdf(request.prob))
        return {"type": "inverse", "x": x_val, "prob": request.prob}
        
    elif request.x is not None:
        # Directa
        z = (request.x - request.mean) / request.std
        cdf = float(ndist.cdf(request.x))
        pdf = float(ndist.pdf(request.x))
        return {
            "type": "direct",
            "z_score": float(z),
            "cdf": cdf,       # P(X <= x)
            "pdf": pdf,
            "greater_than": 1.0 - cdf  # P(X > x)
        }
    else:
        raise HTTPException(status_code=400, detail="Proporciona 'x' o 'prob'.")

@router.post("/binomial")
async def calculate_binomial(request: BinomialRequest):
    if request.n < 0:
        raise HTTPException(status_code=400, detail="n no puede ser negativo.")
    if not (0 <= request.p <= 1):
        raise HTTPException(status_code=400, detail="p debe estar entre 0 y 1.")
    
    n = request.n
    p = request.p
    x = request.x
    
    if x < 0 or x > n:
        pd = 0.0
        cd = 0.0 if x < 0 else 1.0
    else:
        pd = float(math.comb(n, x) * (p**x) * ((1-p)**(n-x)))
        cd = float(sum(math.comb(n, k) * (p**k) * ((1-p)**(n-k)) for k in range(x + 1)))
    
    return {
        "x": x,
        "pd": pd, # P(X = x)
        "cd": cd, # P(X <= x)
        "greater_than": 1.0 - cd # P(X > x)
    }

@router.post("/poisson")
async def calculate_poisson(request: PoissonRequest):
    if request.lam <= 0:
        raise HTTPException(status_code=400, detail="Lambda (media) debe ser > 0.")
    
    lam = request.lam
    x = request.x
    
    if x < 0:
        pd = 0.0
        cd = 0.0
    else:
        pd = float(math.exp(-lam) * (lam**x) / math.factorial(x))
        cd = float(sum(math.exp(-lam) * (lam**k) / math.factorial(k) for k in range(x + 1)))
    
    return {
        "x": x,
        "pd": pd, # P(X = x)
        "cd": cd, # P(X <= x)
        "greater_than": 1.0 - cd # P(X > x)
    }
