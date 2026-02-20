from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Intento de importar el módulo nativo C++
# En desarrollo/local puede que no esté compilado, así que manejamos el fallback
try:
    # Agregamos la ruta donde cmake pone el módulo
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../engine/python'))
    import equacore as eq
    HAS_NATIVE_ENGINE = True
except ImportError:
    HAS_NATIVE_ENGINE = False
    print("WARNING: EquaCore C++ engine not found. Using fallback mock.")

router = APIRouter(prefix="/api/septima", tags=["Séptima Integration"])

# --- Modelos de Datos (DTOs) ---

class ODESimulationRequest(BaseModel):
    model: str  # "user_defined", "glucose_insulin", "compartment_pk"
    t_start: float
    t_end: float
    dt: float
    y0: List[float]
    params: dict = {}  # Parámetros del modelo
    method: str = "RungeKutta4"  # Euler, RungeKutta4

class SimulationResult(BaseModel):
    t: List[float]
    y: List[List[float]]
    model: str
    metadata: dict = {}

# --- Fallback Mock si no hay C++ ---
class MockResult:
    def __init__(self, t, y):
        self.t = t
        self.y = y

def mock_solver(f, t_span, y0, dt, method):
    # Implementación simple de Euler en Python puro para pruebas
    t = [t_span[0]]
    y = [y0]
    curr_t = t_span[0]
    curr_y = list(y0)
    
    steps = int((t_span[1] - t_span[0]) / dt)
    for _ in range(steps):
        # f devuelve dy/dt. Aquí simulamos dy/dt = -y (decaimiento exponencial simple)
        dy = [-val for val in curr_y] 
        curr_y = [val + dy_i * dt for val, dy_i in zip(curr_y, dy)]
        curr_t += dt
        t.append(curr_t)
        y.append(curr_y)
    return MockResult(t, y)

# --- Endpoints ---

@router.get("/status")
async def engine_status():
    """Verifica si el motor C++ está activo y listo para Séptima."""
    return {
        "engine_active": HAS_NATIVE_ENGINE,
        "engine_version": getattr(eq, "__version__", "mock") if HAS_NATIVE_ENGINE else "mock",
        "supported_solvers": ["Euler", "RungeKutta4"]
    }

@router.post("/simulate", response_model=SimulationResult)
async def simulate_ode(req: ODESimulationRequest):
    """
    Endpoint principal para simulaciones ODE de alta velocidad.
    Séptima envía la definición y Binary (C++) resuelve.
    """
    
    # 1. Definir la función del sistema (dy/dt)
    # En el futuro, esto podría parsearse de una string simbólica o seleccionar modelos predefinidos C++
    def system_func(t, y):
        # Placeholder: Aquí mapearíamos req.model a una función C++ real
        # Por ahora, simulamos un decaimiento simple si no es un modelo conocido
        return [-y_val for y_val in y]

    try:
        if HAS_NATIVE_ENGINE:
            # Mapear método string a Enum C++
            method_enum = eq.ODESolver.Method.RungeKutta4
            if req.method == "Euler":
                method_enum = eq.ODESolver.Method.Euler

            # Llamada al motor C++ (Rápido ⚡)
            # Nota: Necesitamos una forma de pasar la función "f" a C++. 
            # Los bindings actuales aceptan un callback de Python, lo cual tiene overhead.
            # La optimización futura será tener los modelos (Glucosa, PK) compilados en C++.
            
            # Por ahora, para "user_defined", usamos el callback (sigue siendo más rápido que Python puro para el loop)
            # Pero para modelos estándar ("glucose_insulin"), deberíamos llamar a un wrapper específico en C++.
            
            res = eq.ODESolver.solve(
                system_func, 
                [req.t_start, req.t_end], 
                req.y0, 
                req.dt, 
                method=method_enum
            )
        else:
            # Fallback Python puro (Lento 🐢)
            res = mock_solver(system_func, [req.t_start, req.t_end], req.y0, req.dt, req.method)

        return SimulationResult(
            t=res.t,
            y=res.y,
            model=req.model,
            metadata={"engine": "cpp" if HAS_NATIVE_ENGINE else "python_mock"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.post("/bio/glucose")
async def simulate_glucose(params: dict):
    """
    Endpoint específico para modelo Bergman (Glucosa-Insulina).
    Este debería mapear a una función C++ optimizada directamente, sin callbacks Python.
    """
    # TODO: Implementar llamada directa a modelo C++ compilado
    return {"status": "not_implemented_yet", "message": "Fase 2b: Implementar modelos hardcodeados en C++"}
