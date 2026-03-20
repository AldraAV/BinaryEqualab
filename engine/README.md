# EquaCore — C++ Math & Bio Engine v3.0

> El motor unificado de Binary EquaLab y Séptima Biomédica.
> *"De 3,000 plaquetas nació el código que salva vidas."*

## Qué es

EquaCore es un motor C++20 de alto rendimiento que integra:
- **CAS simbólico** — Expression Tree con derivadas, integrales, límites, series de Taylor
- **Álgebra lineal** — Eigen3 (det, inv, LU, QR, SVD, Eigen decomposition, RREF)
- **ODE numéricos** — RK4, Euler, adaptativo, sistemas acoplados
- **Bio-Engine** — Modelos biomédicos nativos (Bergman, Windkessel, Hodgkin-Huxley, PK-1cmt, PTI)
- **FFT** — Con fallback DFT si FFTW3 no disponible
- **Python bindings** — via pybind11 con NumPy interop

### Capas de Cómputo

```
1. EquaCore C++ (RÁPIDO)     → Derivadas, eval, integrales numéricas, ODE, Bio, FFT
2. Maxima subprocess (PRECISO) → Laplace, integrales simbólicas, solve, factorización
3. SymPy fallback (RESPALDO)  → Si EquaCore no compilado + Maxima no instalado
```

> Maxima vive en `backend/services/maxima_service.py` — no es parte del build C++.

## Dependencias

- **Eigen3** — Álgebra lineal (descargado automáticamente via FetchContent)
- **pybind11** — Python bindings (`pip install pybind11`)
- **Opcionales:** OpenBLAS, FFTW3, SuiteSparse

## Build

```powershell
# Usar workflow /build-engine (CLion MinGW + Ninja)
# O manualmente:
cmake -DCMAKE_BUILD_TYPE=Release -G Ninja -S . -B cmake-build-release
cmake --build cmake-build-release --target _equacore --parallel
```

## Uso en Python

```python
from equacore import BioODESolver, PTIParams, PTIStepper
import numpy as np

# Simular PTI
params = PTIParams()
params.production_rate = 1e11
params.initial_platelets = 150000
y0 = np.array([150000.0, 0.0])
result = BioODESolver.simulate_pti(0, 30, 0.1, y0, params)
```

## Estructura

```
engine/
├── CMakeLists.txt
├── include/equacore/
│   ├── expression.hpp     # Expression Tree (CAS simbólico)
│   ├── calculus.hpp        # Derivadas, integrales, límites, Taylor
│   ├── ode.hpp             # Bio-Engine (PTI, Bergman, HH, etc.)
│   ├── ode_solvers.hpp     # RK4, Euler genéricos
│   └── symbolic.hpp        # SymEngine wrapper (legacy)
├── src/
│   ├── expression.cpp      # CAS: Expression Tree implementation
│   ├── calculus.cpp         # CAS: Calculus operations
│   ├── ode.cpp              # Bio models (5 simulaciones)
│   ├── ode_solvers.cpp      # ODE métodos numéricos
│   ├── fft.cpp              # FFT/IFFT (FFTW3 or DFT fallback)
│   ├── linear.cpp           # Eigen3 wrappers
│   ├── numeric.cpp          # Métodos numéricos
│   ├── sparse.cpp           # Matrices dispersas
│   └── bindings.cpp         # pybind11 → Python
└── python/equacore/
    └── __init__.py          # Python package (SymPy fallback)
```

## Fallback Mode

Si el motor C++ no está compilado, Python cae a SymPy/NumPy:

```python
from equacore import NATIVE_ENGINE
print(NATIVE_ENGINE)  # True = C++, False = SymPy fallback
```

## WASM Build (futuro)

```bash
emcmake cmake -B build_wasm -S . -DBUILD_WASM=ON
cmake --build build_wasm
```
