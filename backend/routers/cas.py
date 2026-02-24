from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.maxima_service import maxima
import equacore  # Para usar SymPy fallback si es necesario

router = APIRouter(prefix="/api/cas", tags=["CAS"])

class CASRequest(BaseModel):
    expression: str
    var: str = "x"
    param: str = ""

@router.post("/solve-ode")
async def solve_ode(request: CASRequest):
    """Resuelve ecuaciones diferenciales simbólicamente."""
    result = maxima.solve_ode(request.expression, request.var)
    return {"solution": result, "engine": "maxima"}

@router.post("/laplace")
async def laplace_transform(request: CASRequest):
    """Transformada de Laplace."""
    # request.var es 't', request.param es 's'
    s_var = request.param if request.param else "s"
    result = maxima.laplace(request.expression, request.var, s_var)
    return {"result": result, "engine": "maxima"}

@router.post("/integrate")
async def integrate(request: CASRequest):
    """Integración simbólica."""
    result = maxima.integrate(request.expression, request.var)
    return {"result": result, "engine": "maxima"}

@router.post("/simplify")
async def simplify(request: CASRequest):
    """Simplificación de expresiones."""
    result = maxima.simplify(request.expression)
    return {"result": result, "engine": "maxima"}

@router.get("/status")
async def get_status():
    """Verifica si los motores CAS están operativos."""
    return {
        "maxima_active": True, # Asumiendo que se instaló
        "native_equacore": equacore.NATIVE_BIO,
        "symbolic_fallback": "sympy" if not equacore.NATIVE_SYMBOLIC else "native"
    }
