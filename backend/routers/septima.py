"""
backend/routers/septima.py
Router de integración Séptima ↔ Bio-Engine de Binary

Endpoints:
  GET  /api/septima/status           — Estado del motor C++
  POST /api/septima/simulate         — ODE genérico (Euler / RK4)
  POST /api/septima/bio/glucose      — Modelo Bergman (Glucosa-Insulina)
  POST /api/septima/bio/windkessel   — Modelo Windkessel 2-Elementos
  POST /api/septima/bio/neuron       — Hodgkin-Huxley (próximo sprint)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import time
import sys
import os

# ─── Carga del Motor C++ ────────────────────────────────────────────────────────
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../engine/python'))
    import equacore as eq
    HAS_NATIVE_ENGINE = True
except ImportError:
    HAS_NATIVE_ENGINE = False
    print("WARNING: EquaCore C++ engine not found. Using Python fallback.")

# ─── Router ─────────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/septima", tags=["Séptima Integration"])

# ─── DTOs ───────────────────────────────────────────────────────────────────────

class ODESimulationRequest(BaseModel):
    model: str = "user_defined"
    t_start: float
    t_end: float
    dt: float
    y0: List[float]
    params: Dict[str, Any] = {}
    method: str = "RungeKutta4"

class SimulationResult(BaseModel):
    t: List[float]
    y: List[List[float]]
    model: str
    metadata: dict = {}

class BergmanParams(BaseModel):
    """Parámetros del Minimal Model de Bergman (Glucosa-Insulina)."""
    p1: float = Field(default=0.028, description="Captación de glucosa insulin-independiente")
    p2: float = Field(default=0.025, description="Tasa de desaparición de la acción remota")
    p3: float = Field(default=0.000013, description="Ganancia insulínica")
    Gb: float = Field(default=80.0, description="Glucosa basal (mg/dL)")
    Ib: float = Field(default=7.0, description="Insulina basal (µU/mL)")
    n:  float = Field(default=0.142, description="Tasa de degradación de insulina")

class GlucoseSimulationRequest(BaseModel):
    t_start: float = 0.0
    t_end:   float = 240.0  # 4 horas en minutos
    dt:      float = 0.5
    y0:      List[float] = Field(default=[300.0, 0.0, 50.0],
                                  description="[G0 mg/dL, X0, I0 µU/mL]")
    params:  BergmanParams = BergmanParams()

class GlucoseSimulationResult(BaseModel):
    t: List[float]
    G: List[float]
    X: List[float]
    I: List[float]
    engine: str

class WindkesselParams(BaseModel):
    R:        float = Field(default=1.0,  description="Resistencia periférica (PRU)")
    C:        float = Field(default=1.2,  description="Compliance arterial (mL/mmHg)")
    P_venous: float = Field(default=5.0,  description="Presión venosa central (mmHg)")

class WindkesselRequest(BaseModel):
    t_start:    float = 0.0
    t_end:      float = 10.0  # segundos
    dt:         float = 0.01
    y0:         List[float] = Field(default=[80.0], description="[P0 mmHg]")
    params:     WindkesselParams = WindkesselParams()
    heart_rate: float = 75.0  # bpm

# ─── Fallbacks Python puro ──────────────────────────────────────────────────────

def _rk4_step(f, t, y, dt):
    """Paso RK4 estándar en Python puro."""
    k1 = f(t, y)
    k2 = f(t + 0.5*dt, [yi + 0.5*dt*ki for yi, ki in zip(y, k1)])
    k3 = f(t + 0.5*dt, [yi + 0.5*dt*ki for yi, ki in zip(y, k2)])
    k4 = f(t + dt,     [yi + dt*ki      for yi, ki in zip(y, k3)])
    return [yi + (dt/6)*(k1i + 2*k2i + 2*k3i + k4i)
            for yi, k1i, k2i, k3i, k4i in zip(y, k1, k2, k3, k4)]


def _solve_python(f, t_start, t_end, y0, dt):
    """Solver RK4 en Python puro — fallback cuando C++ no está compilado."""
    import math
    steps = int(math.ceil((t_end - t_start) / dt))
    t_vals = [t_start + i * dt for i in range(steps + 1)]
    y_vals = [list(y0)]
    y = list(y0)
    t = t_start
    for _ in range(steps):
        y = _rk4_step(f, t, y, dt)
        t += dt
        y_vals.append(list(y))
    return t_vals, y_vals


# ─── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/status")
async def engine_status():
    """Estado del motor C++ de Binary."""
    return {
        "engine_active": HAS_NATIVE_ENGINE,
        "engine_version": getattr(eq, "__version__", "1.0") if HAS_NATIVE_ENGINE else "mock",
        "supported_solvers": ["Euler", "RungeKutta4"],
    }


@router.post("/simulate", response_model=SimulationResult)
async def simulate_ode(req: ODESimulationRequest):
    """Simulación ODE genérica — Euler o RK4."""
    def system_func(t, y):
        return [-v for v in y]  # Decaimiento exponencial simple por defecto

    try:
        tic = time.perf_counter()

        if HAS_NATIVE_ENGINE:
            method_enum = eq.ODESolver.Method.RungeKutta4
            if req.method == "Euler":
                method_enum = eq.ODESolver.Method.Euler
            res = eq.ODESolver.solve(system_func, [req.t_start, req.t_end],
                                     req.y0, req.dt, method=method_enum)
            t_list = list(res.t)
            y_list = [list(row) for row in res.y]
            engine = "cpp"
        else:
            t_list, y_vals = _solve_python(system_func, req.t_start, req.t_end, req.y0, req.dt)
            # Transponer: y[estado][tiempo] → y[tiempo][estado]
            n_states = len(req.y0)
            y_list = [[row[s] for row in y_vals] for s in range(n_states)]
            engine = "python_mock"

        elapsed_ms = (time.perf_counter() - tic) * 1000

        return SimulationResult(
            t=t_list,
            y=y_list,
            model=req.model,
            metadata={"engine": engine, "execution_time_ms": round(elapsed_ms, 2)},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {e}")


@router.post("/bio/glucose", response_model=GlucoseSimulationResult)
async def simulate_glucose(req: GlucoseSimulationRequest):
    """
    Simulación Glucosa-Insulina usando el Minimal Model de Bergman.
    
    Variables de estado:
        y[0] = G  — Glucosa plasmática (mg/dL)
        y[1] = X  — Acción remota de insulina (1/min)
        y[2] = I  — Insulina plasmática (µU/mL)
    """
    p = req.params

    def bergman(t, y):
        G, X, I = y[0], y[1], y[2]
        # Ecuaciones del Minimal Model de Bergman
        dG = -(p.p1 + X) * G + p.p1 * p.Gb
        dX = -p.p2 * X + p.p3 * (I - p.Ib)
        dI = -p.n * (I - p.Ib)
        return [dG, dX, dI]

    try:
        tic = time.perf_counter()

        if HAS_NATIVE_ENGINE:
            # Llamar al modelo C++ nativo (BioODESolver::simulate_glucose_insulin)
            import numpy as np
            y0_np = np.array(req.y0)
            bp = eq.BergmanParams()
            bp.p1 = p.p1
            bp.p2 = p.p2
            bp.p3 = p.p3
            bp.Gb = p.Gb
            bp.Ib = p.Ib
            bp.n  = p.n
            res = eq.BioODESolver.simulate_glucose_insulin(
                req.t_start, req.t_end, req.dt, y0_np, bp
            )
            t_list = list(res.t)
            G_list = [row[0] for row in res.y]
            X_list = [row[1] for row in res.y]
            I_list = [row[2] for row in res.y]
            engine = "cpp"
        else:
            # Fallback Python puro
            t_list, y_vals = _solve_python(bergman, req.t_start, req.t_end, req.y0, req.dt)
            G_list = [row[0] for row in y_vals]
            X_list = [row[1] for row in y_vals]
            I_list = [row[2] for row in y_vals]
            engine = "python_mock"

        return GlucoseSimulationResult(
            t=t_list, G=G_list, X=X_list, I=I_list, engine=engine
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Glucose simulation error: {e}")


@router.post("/bio/windkessel", response_model=SimulationResult)
async def simulate_windkessel(req: WindkesselRequest):
    """
    Modelo Windkessel de 2 elementos para la presión aórtica.
    
    Ecuación: C·dP/dt = Q(t) - (P - P_venous)/R
    Variable de estado: y[0] = P (mmHg)
    """
    import math
    p = req.params
    cycle = 60.0 / req.heart_rate  # duración del ciclo en segundos

    def get_flow(t: float) -> float:
        local_t = math.fmod(t, cycle)
        systole = 0.3 * math.sqrt(cycle)
        if local_t < systole:
            return math.sin(math.pi * local_t / systole) * 500.0
        return 0.0

    def windkessel(t, y):
        P = y[0]
        Q = get_flow(t)
        dP = (Q - (P - p.P_venous) / p.R) / p.C
        return [dP]

    try:
        tic = time.perf_counter()

        if HAS_NATIVE_ENGINE:
            import numpy as np
            y0_np = np.array(req.y0)
            wp = eq.WindkesselParams()
            wp.R = p.R
            wp.C = p.C
            wp.P_venous = p.P_venous
            res = eq.BioODESolver.simulate_windkessel(
                req.t_start, req.t_end, req.dt, y0_np, wp, req.heart_rate
            )
            t_list = list(res.t)
            y_list = [[row[0] for row in res.y]]
            engine = "cpp"
        else:
            t_list, y_vals = _solve_python(windkessel, req.t_start, req.t_end, req.y0, req.dt)
            y_list = [[row[0] for row in y_vals]]
            engine = "python_mock"

        elapsed_ms = (time.perf_counter() - tic) * 1000
        return SimulationResult(
            t=t_list, y=y_list, model="windkessel",
            metadata={"engine": engine, "execution_time_ms": round(elapsed_ms, 2)},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Windkessel simulation error: {e}")


# ─── Hodgkin-Huxley (Neuronal) ──────────────────────────────────────────────────

class HHParams(BaseModel):
    C_m:  float = Field(default=1.0,    description="Capacitancia de membrana (µF/cm²)")
    g_Na: float = Field(default=120.0,  description="Conductancia máx Na⁺ (mS/cm²)")
    g_K:  float = Field(default=36.0,   description="Conductancia máx K⁺ (mS/cm²)")
    g_L:  float = Field(default=0.3,    description="Conductancia de fuga (mS/cm²)")
    E_Na: float = Field(default=50.0,   description="Potencial de equilibrio Na⁺ (mV)")
    E_K:  float = Field(default=-77.0,  description="Potencial de equilibrio K⁺ (mV)")
    E_L:  float = Field(default=-54.4,  description="Potencial de fuga (mV)")
    I_ext: float = Field(default=10.0,  description="Corriente externa aplicada (µA/cm²)")

class NeuronSimulationRequest(BaseModel):
    t_start: float = 0.0
    t_end:   float = 100.0   # ms
    dt:      float = 0.025   # ms (paso HH recomendado)
    y0:      List[float] = Field(
        default=[-65.0, 0.05, 0.6, 0.32],
        description="[V (mV), m, h, n] — valores de reposo de Squid Giant Axon"
    )
    params: HHParams = HHParams()


@router.post("/bio/neuron", response_model=SimulationResult)
async def simulate_neuron(req: NeuronSimulationRequest):
    """
    Modelo de Hodgkin-Huxley para el potencial de acción neuronal.

    Variables de estado:
        y[0] = V   — Voltaje de membrana (mV)
        y[1] = m   — Variable de activación Na⁺
        y[2] = h   — Variable de inactivación Na⁺
        y[3] = n   — Variable de activación K⁺
    """
    p = req.params

    def alpha_m(V): return 0.1 * (V + 40) / (1 - (1e-7 + math.exp(-(V + 40) / 10))) if abs(V + 40) > 1e-4 else 1.0
    def beta_m(V):  return 4.0 * math.exp(-(V + 65) / 18)
    def alpha_h(V): return 0.07 * math.exp(-(V + 65) / 20)
    def beta_h(V):  return 1.0 / (1 + math.exp(-(V + 35) / 10))
    def alpha_n(V): return 0.01 * (V + 55) / (1 - (1e-7 + math.exp(-(V + 55) / 10))) if abs(V + 55) > 1e-4 else 0.1
    def beta_n(V):  return 0.125 * math.exp(-(V + 65) / 80)

    def hodgkin_huxley(t, y):
        V, m, h, n = y[0], y[1], y[2], y[3]
        I_Na = p.g_Na * m**3 * h * (V - p.E_Na)
        I_K  = p.g_K  * n**4     * (V - p.E_K)
        I_L  = p.g_L             * (V - p.E_L)
        dV = (p.I_ext - I_Na - I_K - I_L) / p.C_m
        dm = alpha_m(V) * (1 - m) - beta_m(V) * m
        dh = alpha_h(V) * (1 - h) - beta_h(V) * h
        dn = alpha_n(V) * (1 - n) - beta_n(V) * n
        return [dV, dm, dh, dn]

    try:
        tic = time.perf_counter()

        if HAS_NATIVE_ENGINE:
            import numpy as np
            y0_np = np.array(req.y0)
            hhp = eq.HHParams()
            hhp.C_m = p.C_m; hhp.g_Na = p.g_Na; hhp.g_K = p.g_K; hhp.g_L = p.g_L
            hhp.E_Na = p.E_Na; hhp.E_K = p.E_K; hhp.E_L = p.E_L; hhp.I_ext = p.I_ext
            res = eq.BioODESolver.simulate_hodgkin_huxley(
                req.t_start, req.t_end, req.dt, y0_np, hhp
            )
            t_list = list(res.t)
            y_list = [[row[i] for row in res.y] for i in range(4)]
            engine = "cpp"
        else:
            t_list, y_vals = _solve_python(hodgkin_huxley, req.t_start, req.t_end, req.y0, req.dt)
            y_list = [[row[i] for row in y_vals] for i in range(4)]
            engine = "python_mock"

        elapsed_ms = (time.perf_counter() - tic) * 1000
        return SimulationResult(
            t=t_list, y=y_list, model="hodgkin_huxley",
            metadata={"engine": engine, "execution_time_ms": round(elapsed_ms, 2)},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hodgkin-Huxley simulation error: {e}")


# ─── Farmacocinética PK-1cmt ────────────────────────────────────────────────────

class PKParams(BaseModel):
    ka:  float = Field(default=1.0,    description="Tasa de absorción (1/h)")
    ke:  float = Field(default=0.15,   description="Tasa de eliminación (1/h)")
    Vd:  float = Field(default=10.0,   description="Volumen de distribución (L)")
    F:   float = Field(default=1.0,    description="Biodisponibilidad oral (0–1)")

class PKSimulationRequest(BaseModel):
    t_start:    float = 0.0
    t_end:      float = 24.0   # horas
    dt:         float = 0.05
    dose_mg:    float = 500.0  # dosis en mg
    params:     PKParams = PKParams()
    regimen:    str = "single"  # "single" | "multiple"
    interval_h: float = 8.0    # horas entre dosis (si regimen="multiple")
    n_doses:    int = 3


@router.post("/bio/pharmacokinetics", response_model=SimulationResult)
async def simulate_pk(req: PKSimulationRequest):
    """
    Farmacocinética de 2 compartimentos: depósito oral → plasma.

    Variables de estado:
        y[0] = A_gut   — Cantidad de fármaco en GI (mg)
        y[1] = C_plasma — Concentración plasmática (mg/L)
    """
    p = req.params
    dose0 = req.dose_mg * p.F  # Dosis accesible sistémicamente

    # Calcular tiempos de dosis adicionales para régimen múltiple
    dose_times: List[float] = [req.t_start]
    if req.regimen == "multiple":
        for i in range(1, req.n_doses):
            dose_times.append(req.t_start + i * req.interval_h)

    def pk_odes(t, y):
        A_gut, C_plasma = y[0], y[1]
        dA_gut    = -p.ka * A_gut
        dC_plasma = (p.ka * A_gut) / p.Vd - p.ke * C_plasma
        return [dA_gut, dC_plasma]

    try:
        tic = time.perf_counter()
        # Simulamos en tramos entre dosis
        import math as _math
        t_full: List[float] = []
        y_full: List[List[float]] = []
        y_cur = [dose0, 0.0]
        t_cur = req.t_start

        sorted_doses = sorted(dose_times)
        segments = sorted_doses[1:] + [req.t_end]

        for seg_end in segments:
            t_seg, y_seg = _solve_python(pk_odes, t_cur, seg_end, y_cur, req.dt)
            t_full.extend(t_seg[:-1])
            y_full.extend(y_seg[:-1])
            # Añadir dosis si corresponde
            if seg_end in sorted_doses[1:]:
                y_cur = [y_seg[-1][0] + dose0, y_seg[-1][1]]
            else:
                y_cur = list(y_seg[-1])
            t_cur = seg_end

        t_full.append(req.t_end)
        y_full.append(y_cur)

        y_list = [[row[0] for row in y_full], [row[1] for row in y_full]]
        elapsed_ms = (time.perf_counter() - tic) * 1000
        return SimulationResult(
            t=t_full, y=y_list, model="compartment_pk",
            metadata={"engine": "python_mock", "execution_time_ms": round(elapsed_ms, 2)},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PK simulation error: {e}")
# ─── Servicios de Explicación (Séptima Pro) ──────────────────────────────────────
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from services.symbolic_explainer import SymbolicExplainer
from services.ai_explainer import AIExplainer

symbolic_explainer = SymbolicExplainer()
ai_explainer = AIExplainer()

# ─── DTOs PTI ──────────────────────────────────────────────────────────────────

class PTISimulationRequest(BaseModel):
    t_start: float = 0.0
    t_end: float = 30.0  # días
    dt: float = 0.1
    y0: List[float] = Field(default=[150000.0, 1.0], description="[Plaquetas, Anticuerpos]")
    params: Dict[str, Any] = {}
    mode: str = "student" # student | family | research

class PTIResponse(BaseModel):
    t: List[float]
    y: List[List[float]]
    interpretation: str
    symbolic_steps: List[dict]
    ai_narrative: str
    metadata: dict

# ─── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/bio/pti", response_model=PTIResponse)
async def simulate_pti(req: PTISimulationRequest):
    """
    Simulación integral de PTI con explicaciones simbólicas y de IA.
    """
    try:
        tic = time.perf_counter()
        
        if not HAS_NATIVE_ENGINE:
            raise HTTPException(status_code=503, detail="Motor nativo C++ no disponible para PTI.")

        # 1. Configurar parámetros del motor C++
        p = eq.PTIParams()
        p.production_rate = req.params.get("production_rate", 50000.0)
        p.destruction_rate = req.params.get("destruction_rate", 0.1)
        p.antibody_half_life = req.params.get("antibody_half_life", 5.0)
        p.antibody_production = req.params.get("antibody_production", 0.05)
        p.treatment = req.params.get("treatment", 0)
        p.treatment_efficacy = req.params.get("treatment_efficacy", 0.8)
        p.initial_platelets = req.y0[0]

        # 2. Ejecutar simulación en el motor nativo
        import numpy as np
        y0_np = np.array(req.y0)
        res = eq.BioODESolver.simulate_pti(req.t_start, req.t_end, req.dt, y0_np, p)
        
        # 3. Interpretación clínica (Nativa)
        interpretation = eq.BioODESolver.pti_clinical_interpretation(
            req.y0[0], res.y[-1][0], int(req.t_end - req.t_start)
        )

        # 4. Generar Explicación Simbólica (KaTeX)
        symbolic_steps = symbolic_explainer.explain_pti(req.params, req.y0, res)

        # 5. Generar Narrativa de IA
        ai_narrative = await ai_explainer.generate_explanation(
            {"treatment_name": ["Ninguno", "Prednisona", "IVIG", "Esplenectomía"][p.treatment]},
            {"p_initial": req.y0[0], "p_final": res.y[-1][0], "days": int(req.t_end - req.t_start)},
            mode=req.mode
        )

        elapsed_ms = (time.perf_counter() - tic) * 1000

        return PTIResponse(
            t=list(res.t),
            y=[list(row) for row in res.y],
            interpretation=interpretation,
            symbolic_steps=symbolic_steps,
            ai_narrative=ai_narrative,
            metadata={"engine": "cpp", "execution_time_ms": round(elapsed_ms, 2)}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PTI simulation error: {str(e)}")

# (Resto de endpoints anteriores se mantienen antes de este bloque...)
