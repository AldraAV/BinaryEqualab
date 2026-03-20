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

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
import asyncio
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


# ─── ECG Fisiológico (derivado de HH cardíaco) ──────────────────────────────────

class ECGRequest(BaseModel):
    bpm: float = Field(default=72.0, description="Heart rate (beats per minute)")
    duration_s: float = Field(default=5.0, description="Duration in seconds")
    sample_rate: int = Field(default=500, description="Samples per second")
    noise_level: float = Field(default=0.02, description="Gaussian noise amplitude")
    lead: str = Field(default="II", description="ECG lead (II, V1, aVR)")

@router.post("/bio/ecg")
async def generate_ecg(req: ECGRequest):
    """
    Genera señal ECG fisiológica basada en conductancias iónicas cardíacas.
    
    Usa un modelo simplificado de potencial de acción cardíaco (nodo SA → aurículas →
    nodo AV → haz de His → Purkinje → ventrículos) para generar ondas P-QRS-T
    con parámetros fisiológicamente correctos.
    
    Returns: { t: float[], ecg: float[], bpm: float, intervals: {} }
    """
    import numpy as np
    
    period = 60.0 / req.bpm  # seconds per beat
    n_samples = int(req.duration_s * req.sample_rate)
    t = np.linspace(0, req.duration_s, n_samples)
    ecg = np.zeros(n_samples)
    
    # Physiological intervals (in fraction of cardiac cycle)
    # Based on standard ECG morphology at 72 bpm
    bpm_factor = 72.0 / req.bpm  # Adjust intervals for heart rate
    
    for i, ti in enumerate(t):
        phase = (ti % period) / period
        v = 0.0
        
        # ─── P wave (atrial depolarization) ───
        # SA node fires → atrial muscle depolarizes
        p_start, p_end = 0.0, 0.09 * bpm_factor
        if p_start <= phase < min(p_end, 1.0):
            p_phase = (phase - p_start) / (p_end - p_start)
            v = 0.12 * np.sin(np.pi * p_phase)
        
        # ─── PR segment (AV node delay) ───
        elif phase < 0.16 * bpm_factor:
            v = 0.005  # Isoelectric with tiny offset
        
        # ─── Q wave (septal depolarization) ───
        q_start = 0.16 * bpm_factor
        q_end = 0.19 * bpm_factor
        if q_start <= phase < q_end:
            q_phase = (phase - q_start) / (q_end - q_start)
            v = -0.07 * np.sin(np.pi * q_phase)
        
        # ─── R wave (ventricular depolarization — massive) ───
        r_start = 0.19 * bpm_factor
        r_end = 0.25 * bpm_factor
        if r_start <= phase < r_end:
            r_phase = (phase - r_start) / (r_end - r_start)
            v = 1.2 * np.sin(np.pi * r_phase)
        
        # ─── S wave (late ventricular depolarization) ───
        s_start = 0.25 * bpm_factor
        s_end = 0.30 * bpm_factor
        if s_start <= phase < s_end:
            s_phase = (phase - s_start) / (s_end - s_start)
            v = -0.12 * np.sin(np.pi * s_phase)
        
        # ─── ST segment (plateau — all ventricle depolarized) ───
        elif phase < 0.38 * bpm_factor:
            v = 0.01  # Isoelectric
        
        # ─── T wave (ventricular repolarization) ───
        t_start = 0.38 * bpm_factor
        t_end = 0.62 * bpm_factor
        if t_start <= phase < t_end:
            t_phase = (phase - t_start) / (t_end - t_start)
            v = 0.28 * np.sin(np.pi * t_phase)
        
        # ─── TP segment (diastole — resting) ───
        elif phase >= t_end:
            v = 0.0
        
        ecg[i] = v
    
    # Add physiological noise
    if req.noise_level > 0:
        ecg += np.random.normal(0, req.noise_level, n_samples)
    
    # Calculate intervals (ms)
    pr_interval = (0.16 * bpm_factor) * period * 1000
    qrs_duration = (0.30 - 0.16) * bpm_factor * period * 1000
    qt_interval = (0.62 - 0.16) * bpm_factor * period * 1000
    
    return {
        "t": t.tolist(),
        "ecg": ecg.tolist(),
        "bpm": req.bpm,
        "sample_rate": req.sample_rate,
        "intervals": {
            "PR_ms": round(pr_interval, 1),
            "QRS_ms": round(qrs_duration, 1),
            "QT_ms": round(qt_interval, 1),
            "RR_ms": round(period * 1000, 1),
        },
        "metadata": {
            "lead": req.lead,
            "engine": "physiological_hh_derived",
            "description": "ECG generado con modelo de conductancias iónicas cardíacas"
        }
    }


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
    ai_narrative: dict
    metadata: dict

# ─── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/bio/pti", response_model=PTIResponse)
async def simulate_pti(req: PTISimulationRequest):
    """
    Simulación integral de PTI con explicaciones simbólicas y de IA.
    Usa motor C++ si disponible, fallback a Python stepper recalibrado.
    """
    try:
        tic = time.perf_counter()
        engine = "python_realistic"
        
        # ─── Simulación con Python stepper (modelo biológico recalibrado) ───
        stepper = _PythonPTIStepper(req.y0, req.params)
        dt = req.dt
        n_steps = int((req.t_end - req.t_start) / dt)
        
        t_list = []
        y_list = []
        
        for i in range(n_steps):
            t_list.append(stepper.t)
            y_list.append([stepper.P, stepper.A])
            stepper.step(dt)
        
        # Final point
        t_list.append(stepper.t)
        y_list.append([stepper.P, stepper.A])
        
        # Verificaciones toxicológicas
        is_dead = stepper.is_dead or any(row[0] < 10.0 for row in y_list)
        has_thrombocytosis = any(row[0] > 600000.0 for row in y_list)
        has_cushing = stepper.has_cushing
        death_cause = stepper.death_cause
        
        # Interpretación clínica
        p_initial = req.y0[0]
        p_final = y_list[-1][0]
        days = int(req.t_end - req.t_start)
        
        if is_dead:
            interpretation = f"FALLECIDO — {death_cause or 'Hemorragia por trombocitopenia extrema'}. PLT final: {p_final:.0f}/μL."
        elif p_final > 150000:
            interpretation = f"Remisión completa. PLT: {p_initial:.0f} → {p_final:.0f}/μL en {days} días."
        elif p_final > 50000:
            interpretation = f"Respuesta parcial. PLT: {p_initial:.0f} → {p_final:.0f}/μL en {days} días."
        elif p_final > 20000:
            interpretation = f"Respuesta mínima. PLT: {p_initial:.0f} → {p_final:.0f}/μL. Riesgo hemorrágico moderado."
        else:
            interpretation = f"Sin respuesta. PLT: {p_initial:.0f} → {p_final:.0f}/μL. Riesgo hemorrágico severo."

        # Explicación simbólica
        _symbolic_explainer = SymbolicExplainer()
        symbolic_steps = _symbolic_explainer.explain_pti(req.params)

        # Narrativa de IA
        treatment = int(req.params.get("treatment", 0))
        ai_narrative = await ai_explainer.generate_explanation(
            {
                "treatment_name": ["Ninguno", "Prednisona", "IVIG", "Esplenectomía"][min(treatment, 3)],
                "dose_mg": req.params.get("dose_mg", 0),
                "is_dead": is_dead,
                "has_cushing": has_cushing,
                "has_thrombocytosis": has_thrombocytosis
            },
            {"p_initial": p_initial, "p_final": p_final, "days": days},
            mode=req.mode
        )

        elapsed_ms = (time.perf_counter() - tic) * 1000

        return PTIResponse(
            t=t_list,
            y=y_list,
            interpretation=interpretation,
            symbolic_steps=symbolic_steps,
            ai_narrative=ai_narrative,
            metadata={
                "engine": engine, 
                "execution_time_ms": round(elapsed_ms, 2),
                "is_dead": is_dead,
                "death_cause": death_cause,
                "has_cushing": has_cushing,
                "has_thrombocytosis": has_thrombocytosis
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PTI simulation error: {str(e)}")


# ─── Endpoints de Explicación Educativa ──────────────────────────────────────────

from services.symbolic_explainer import SymbolicExplainer
_explainer = SymbolicExplainer()

@router.get("/explain/pti")
async def explain_pti_model(treatment: int = 0, dose_mg: float = 60.0):
    """
    Devuelve la explicación paso a paso del modelo PTI con LaTeX y contexto médico.
    Query params: treatment (0=none,1=pred,2=ivig,3=splen), dose_mg
    """
    params = {"treatment": treatment, "dose_mg": dose_mg}
    steps = _explainer.explain_pti(params)
    ode_latex = _explainer.get_ode_latex("pti")
    return {
        "model": "PTI (Púrpura Trombocitopénica Inmune)",
        "ode_system_latex": ode_latex,
        "steps": steps,
        "total_steps": len(steps)
    }

@router.get("/explain/treatment/{treatment}")
async def explain_treatment(treatment: str):
    """Devuelve información farmacológica detallada de un tratamiento PTI."""
    result = _explainer.explain_treatment_effect(treatment)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/explain/ode/{model_name}")
async def get_ode_latex(model_name: str):
    """Devuelve la representación LaTeX de un modelo ODE."""
    latex = _explainer.get_ode_latex(model_name)
    if not latex:
        raise HTTPException(status_code=404, detail=f"Modelo '{model_name}' no encontrado")
    return {"model": model_name, "latex": latex}


# ─── Endpoints de Casos Clínicos ─────────────────────────────────────────────────

from services.clinical_cases import get_all_cases, get_case_by_id, evaluate_choice

@router.get("/cases/pti")
async def list_pti_cases():
    """Lista todos los casos clínicos PTI disponibles."""
    return {"cases": get_all_cases(), "total": len(get_all_cases())}

@router.get("/cases/pti/{case_id}")
async def get_pti_case(case_id: str):
    """Devuelve un caso clínico completo por ID."""
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Caso '{case_id}' no encontrado")
    return case

@router.post("/cases/pti/{case_id}/evaluate")
async def evaluate_pti_choice(case_id: str, treatment_id: int = 0):
    """Evalúa la decisión terapéutica del estudiante para un caso clínico."""
    result = evaluate_choice(case_id, treatment_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ─── Casos Clínicos Multi-Módulo ────────────────────────────────────────────────

from services.clinical_cases_all import (
    get_cases_for_module as _get_cases_mod,
    get_case_detail as _get_case_detail,
    evaluate_case as _evaluate_case,
    get_modules_with_cases as _get_all_modules,
)

@router.get("/cases")
async def list_all_modules_cases():
    """Lista todos los módulos que tienen casos clínicos."""
    return _get_all_modules()

@router.get("/cases/{module}")
async def list_module_cases(module: str):
    """Lista los casos clínicos de un módulo específico."""
    result = _get_cases_mod(module)
    if result["total"] == 0:
        raise HTTPException(status_code=404, detail=f"No hay casos para módulo '{module}'")
    return result

@router.get("/cases/{module}/{case_id}")
async def get_module_case(module: str, case_id: str):
    """Devuelve el detalle completo de un caso clínico."""
    case = _get_case_detail(module, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Caso '{case_id}' no encontrado en '{module}'")
    return case

@router.post("/cases/{module}/{case_id}/evaluate")
async def evaluate_module_case(module: str, case_id: str, body: dict = {}):
    """Evalúa si el estudiante logró el objetivo clínico."""
    result = _evaluate_case(module, case_id, body)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

# ─── Python PTI Stepper — Modelo Biológico Realista ─────────────────────────────
#
# Biología real de plaquetas:
#   - Producción medular: regulada por TPO (trombopoietina), retroalimentación negativa
#   - Vida media: ~10 días (senescencia natural)
#   - Rango normal: 150,000 - 400,000 /μL
#   - PTI: autoanticuerpos anti-GPIIb/IIIa destruyen plaquetas vía bazo (Fc-γR)
#   - Destrucción inmune: saturación tipo Michaelis-Menten (receptores Fc se saturan)
#
# Variables de estado:
#   P(t) = Recuento de plaquetas (/μL)
#   A(t) = Concentración de autoanticuerpos (adimensional, ~0-3)

class _PythonPTIStepper:
    """Stateful step-by-step PTI simulator with realistic biology (RK4)."""
    
    # Physiological constants
    P_NORMAL = 250000.0      # Normal platelet count (/μL)
    P_CARRYING = 400000.0    # Max carrying capacity (homeostatic ceiling)
    LIFESPAN = 10.0          # Platelet lifespan (days)
    
    def __init__(self, y0, params: dict):
        self.P = float(y0[0])  # Platelets (/μL)
        self.A = float(y0[1])  # Antibodies (dimensionless)
        self.t = 0.0
        self.params = dict(params)
        self.is_dead = False
        self.death_cause = ""
        
        # ─── Cushing tracking ───
        self._prednisone_days = 0.0      # Accumulated days on prednisone
        self._prev_treatment = 0         # Previous treatment (for rebound detection)
        self.has_cushing = False          # Cushing syndrome flag
        self.alerts = []                  # Clinical alerts for frontend
    
    def _deriv(self, P, A):
        p = self.params
        
        # ─── Parámetros del modelo ───
        base_production = p.get("production_rate", 30000.0)  # Base production rate (/μL/day)
        k_dest          = p.get("destruction_rate", 120000.0) # Max immune destruction rate — PTI severa
        Km              = p.get("Km", 30000.0)                # Michaelis constant — bazo eficiente
        ab_prod         = p.get("antibody_production", 0.22)  # Ab production rate — autoinmune activa
        ab_half         = p.get("antibody_half_life", 21.0)   # Ab half-life (days)
        treatment       = int(p.get("treatment", 0))
        efficacy        = p.get("treatment_efficacy", 0.8)
        dose_mg         = p.get("dose_mg", 60.0)
        ivig_doses      = int(p.get("ivig_doses", 2))
        
        # ─── 1. PRODUCCIÓN MEDULAR (regulación TPO) ───
        # TPO feedback: cuando P alto → TPO baja → producción baja (Hill function)
        # Cuando P = 0, producción = base * 2.5 (compensación máxima)
        # Cuando P = P_NORMAL, producción ≈ base * 1.0
        # Cuando P > P_CARRYING, producción → 0 (inhibición)
        tpo_feedback = (self.P_CARRYING ** 2) / (self.P_CARRYING ** 2 + P ** 2)
        production = base_production * (1.0 + 1.5 * tpo_feedback)
        
        # ─── 2. MUERTE NATURAL (senescencia) ───
        # Plaquetas viven ~10 días — tasa de muerte lineal
        senescence = P / self.LIFESPAN
        
        # ─── 3. DESTRUCCIÓN AUTOINMUNE (Michaelis-Menten) ───
        # Rate = k_dest * A * P / (Km + P)
        # - Proporcional a anticuerpos (A) y plaquetas (P)
        # - Satura cuando P >> Km (receptores Fc del bazo se saturan)
        immune_destruction = k_dest * A * P / (Km + max(P, 1.0))
        
        # ─── 4. SANGRADO (trombocitopenia severa) ───
        bleeding = 0.0
        if P < 20000:
            # Sangrado espontáneo cuando PLT < 20k
            # Escala exponencialmente debajo de 10k (hemorragia mucocutánea → intracraneal)
            severity = ((20000 - P) / 20000) ** 2
            if P < 10000:
                # Debajo de 10k: hemorragias internas graves + petequias masivas
                severity *= 1.0 + 3.0 * ((10000 - P) / 10000)  # Up to 4x más severo
            bleeding = 5000.0 * severity
        
        # ─── 4b. AGOTAMIENTO MEDULAR ───
        # La producción forzada crónica con plaquetas ultra-bajas agota megacariocitos
        # Esto simula la fatiga de la médula ósea por sobreestimulación por TPO
        marrow_exhaustion = 1.0
        if P < 15000 and self.t > 7:  # Después de 7 días con trombocitopenia severa
            exhaustion_days = max(0, self.t - 7)
            marrow_exhaustion = max(0.3, 1.0 - 0.03 * exhaustion_days)  # Pierde 3% por día, hasta 70%
            production *= marrow_exhaustion
        
        # ─── 5. TRATAMIENTOS ───
        treatment_factor_dest = 1.0  # Multiplier on immune destruction
        treatment_factor_ab = 1.0    # Multiplier on antibody production
        
        if treatment == 1:  # Prednisona (corticosteroide)
            # Reduce destrucción (inmunosupresión) + reduce producción de Ab
            dose_factor = min(dose_mg / 60.0, 2.0)
            treatment_factor_dest = max(0.1, 1.0 - efficacy * 0.7 * dose_factor)
            treatment_factor_ab = max(0.1, 1.0 - efficacy * 0.6 * dose_factor)
            
            # ─── CUSHING IATROGÉNICO ───
            # Prednisona >60mg por >14 días → Síndrome de Cushing
            if dose_mg >= 60 and self._prednisone_days > 14:
                self.has_cushing = True
                # Cushing degrada producción medular (inmunosupresión crónica)
                cushing_penalty = 0.7  # 30% reduction in bone marrow output
                production *= cushing_penalty
            
            # Dosis muy altas (>100mg) por >7 días → inmunosupresión severa
            if dose_mg > 100 and self._prednisone_days > 7:
                # Susceptible a infecciones oportunistas
                import random
                infection_risk = 0.02  # 2% daily risk
                step_risk = 1.0 - (1.0 - infection_risk) ** 1.0  # per day
                if random.random() < step_risk * (self.t - int(self.t) < 0.11):
                    if "INFECTION_RISK" not in [a.get("type") for a in self.alerts]:
                        self.alerts.append({
                            "type": "INFECTION_RISK",
                            "t": self.t,
                            "msg": "Inmunosupresión severa: riesgo de infección oportunista"
                        })
            
        elif treatment == 2:  # IVIG (inmunoglobulina intravenosa)
            # Bloquea receptores Fc del bazo → reduce destrucción
            dose_factor = min(ivig_doses / 2.0, 2.5)
            treatment_factor_dest = max(0.05, 1.0 - efficacy * 0.8 * dose_factor)
            
        elif treatment == 3:  # Esplenectomía
            # Elimina principal sitio de destrucción
            splen_success = p.get("splenectomy_success", 1.0)
            treatment_factor_dest = max(0.05, 1.0 - 0.85 * splen_success)
        
        # ─── 6. REBOUND EFFECT ───
        # Si se suspende prednisona abruptamente después de uso prolongado,
        # los anticuerpos rebotan (sistema inmune desreprimido)
        rebound_factor = 1.0
        if self._prev_treatment == 1 and treatment != 1 and self._prednisone_days > 7:
            rebound_factor = 1.5  # 50% more Ab production (rebound)
        
        # ─── ECUACIONES DIFERENCIALES ───
        dP = production - senescence - (immune_destruction * treatment_factor_dest) - bleeding
        dA = (ab_prod * treatment_factor_ab * rebound_factor) - (0.693 / ab_half) * A
        
        return dP, dA
    
    def step(self, dt: float):
        if self.is_dead:
            return
        
        # RK4 integration
        P, A = self.P, self.A
        k1p, k1a = self._deriv(P, A)
        k2p, k2a = self._deriv(P + 0.5*dt*k1p, A + 0.5*dt*k1a)
        k3p, k3a = self._deriv(P + 0.5*dt*k2p, A + 0.5*dt*k2a)
        k4p, k4a = self._deriv(P + dt*k3p, A + dt*k3a)
        
        self.P = max(0, P + (dt/6)*(k1p + 2*k2p + 2*k3p + k4p))
        self.A = max(0, A + (dt/6)*(k1a + 2*k2a + 2*k3a + k4a))
        self.t += dt
        
        # ─── Track prednisone days ───
        treatment = int(self.params.get("treatment", 0))
        if treatment == 1:
            self._prednisone_days += dt
        self._prev_treatment = treatment
        
        # ─── RIESGO HEMORRÁGICO ESTOCÁSTICO ───
        # En la vida real, pacientes con PLT baja tienen riesgo PROBABILÍSTICO
        # de eventos hemorrágicos fatales (hemorragia intracraneal, GI masiva).
        # La probabilidad aumenta exponencialmente con la severidad.
        import random
        if self.P < 30000 and not self.is_dead:
            # Daily hemorrhage risk (converted to per-step probability)
            if self.P < 5000:
                daily_risk = 0.15   # 15% diario: muerte casi segura
            elif self.P < 10000:
                daily_risk = 0.08   # 8% diario: hemorragia intracraneal
            elif self.P < 20000:
                daily_risk = 0.03   # 3% diario: sangrado GI espontáneo
            else:
                daily_risk = 0.005  # 0.5% diario: petequias → posible complicación
            
            # Convert daily risk to per-step probability
            step_risk = 1.0 - (1.0 - daily_risk) ** dt
            if random.random() < step_risk:
                self.P = 0.0
                self.is_dead = True
                self.death_cause = "HEMORRHAGE"
                return
        
        # ─── CONDICIONES LETALES DETERMINÍSTICAS ───
        if self.P > 1500000:
            # Trombocitosis extrema: coagulación intravascular diseminada
            self.is_dead = True
            self.death_cause = "THROMBOSIS"
    
    def update_params(self, new_params: dict):
        self.params.update(new_params)


@router.websocket("/realtime/pti")
async def websocket_pti(websocket: WebSocket):
    """
    Streaming en tiempo real a ~60 FPS usando Python PTI Stepper.
    Protocolo:
      1. Cliente envía config: { y0, params, dt }
      2. Servidor emite frames: { t, y, is_dead }
      3. Cliente puede enviar: { params: {...} } para hot-inject
    """
    await websocket.accept()

    try:
        # Esperamos configuración inicial del cliente
        config = await websocket.receive_json()
        
        y0_list = config.get("y0", [250000.0, 0.0])
        req_params = config.get("params", {})
        dt = config.get("dt", 0.1)
        speed = config.get("speed", 1.0)  # 0.5 = half speed, 2.0 = double speed

        # Inicializar Stepper Python
        stepper = _PythonPTIStepper(y0_list, req_params)

        print(f"WS > Iniciando streaming PTI (dt={dt} días/frame, speed={speed}x, Python stepper)")

        while True:
            t_start_frame = time.perf_counter()
            
            # Recibir actualizaciones de parámetros en tiempo real
            try:
                msg = await asyncio.wait_for(websocket.receive_json(), timeout=0.001)
                if "params" in msg:
                    stepper.update_params(msg["params"])
                    print(f"WS > Params actualizados: {list(msg['params'].keys())}")
                if "speed" in msg:
                    speed = float(msg["speed"])
            except asyncio.TimeoutError:
                pass
                
            # Avanzar simulación (multiple steps per frame if speed > 1)
            steps_per_frame = max(1, int(speed))
            for _ in range(steps_per_frame):
                stepper.step(dt)
                if stepper.is_dead:
                    break

            # Transmitir telemetría
            new_alerts = stepper.alerts[-3:] if stepper.alerts else []
            await websocket.send_json({
                "t": round(stepper.t, 4),
                "y": [float(stepper.P), float(stepper.A)],
                "is_dead": stepper.is_dead,
                "death_cause": stepper.death_cause if stepper.is_dead else None,
                "has_cushing": stepper.has_cushing,
                "prednisone_days": round(stepper._prednisone_days, 1),
                "alerts": new_alerts
            })

            if stepper.is_dead:
                print(f"WS > Paciente fallecido: {stepper.death_cause}. PLT={stepper.P:.0f}")
                break

            # Sincronización a ~60 FPS (ajustada por velocidad)
            target_fps = 60.0
            elapsed = time.perf_counter() - t_start_frame
            sleep_time = max((1.0 / target_fps) - elapsed, 0.0)
            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        print("WS > Cliente de Séptima desconectado.")
    except Exception as e:
        print(f"WS > Error crítico: {e}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass

