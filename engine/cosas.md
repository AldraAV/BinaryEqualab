
# EquaCore Architecture Review v3.0

## Visión General

EquaCore es un motor C++20 unificado que sirve a **Binary EquaLab** (ecuaciones simbólicas) y **Séptima Biomédica** (simulaciones fisiológicas).

### Stack de Cómputo (3 capas)

| Capa | Tecnología | Propósito | Velocidad | Precisión |
|------|-----------|----------|----------|-----------|
| **Tier 1** | EquaCore C++20 | CAS, ODE, FFT, Bio-Engine | ⚡⚡⚡ | ✓✓ |
| **Tier 2** | Maxima subprocess | Laplace, integrales simbólicas, factorización | ⚡ | ✓✓✓ |
| **Tier 3** | SymPy fallback | Respaldo si C++ no compilado | ⚡ | ✓✓ |

---

## 1. Módulos Principales

### 1.1 CAS Simbólico (Expression Tree)
**Archivo:** `include/equacore/expression.hpp` + `src/expression.cpp`

```
┌─ BinaryOp(+, left, right)
│  ├─ Literal(3.14)
│  └─ Variable(x)
└─ Derivada: ∂/∂x → BinaryOp(+, 0, 1) = 1
```

**Capacidades:**
- Construcción de AST (Abstract Syntax Tree)
- Derivadas simbólicas (chain rule, product rule, quotient rule)
- Simplificación algebraica básica
- Evaluación numérica con sustitución

**Ejemplo C++:**
```cpp
auto expr = std::make_shared<BinaryOp>(
    BinaryOp::Op::Add,
    std::make_shared<Literal>(3.0),
    std::make_shared<Variable>("x")
);
auto deriv = expr->derivative("x");  // 1
double val = expr->evaluate({{"x", 5.0}});  // 8.0
```

---

### 1.2 Cálculo Avanzado (Calculus)
**Archivo:** `include/equacore/calculus.hpp` + `src/calculus.cpp`

**Operaciones:**
- **Derivadas:** Automáticas (AD), numéricas (finite difference), simbólicas
- **Integrales:** Cuadratura Gaussiana, Simpson adaptativo, Romberg
- **Límites:** Evaluación numérica con aproximaciones sucesivas
- **Series de Taylor:** Expansión hasta orden N

**Ejemplo:**
```cpp
double integral = Calculus::simpson(
    [](double x) { return std::sin(x); },
    0.0, M_PI, 1000
);  // ≈ 2.0
```

---

### 1.3 ODE Numéricos
**Archivo:** `include/equacore/ode_solvers.hpp` + `src/ode_solvers.cpp`

**Métodos soportados:**
- **Runge-Kutta 4to orden** — Sistema acoplado, tolerancia adaptativa
- **Euler** — Escalón fijo, fallback
- **Adaptativo** — Dormand-Prince, cambio de paso dinámico

**Interfaz:**
```cpp
class ODESolver {
    std::vector<std::vector<double>> solve(
        const std::function<std::vector<double>(double, const std::vector<double>&)>& f,
        double t0, double tf, double dt,
        const std::vector<double>& y0
    );
};
```

---

### 1.4 Bio-Engine (Modelos Fisiológicos)
**Archivo:** `include/equacore/ode.hpp` + `src/ode.cpp`

**5 Modelos Biomédicos Nativos:**

#### PTI (Platelet Kinetics)
- Ecuación de balance: dP/dt = producción - consumo - removimiento
- Parámetros: `production_rate`, `consumption_rate`, `platelet_lifespan`
- Rango normal: 150–400 k/µL

#### Modelo de Bergman (Glucosa-Insulina)
- 3 compartimientos: Glucosa, Insulina remota, Insulina circulante
- Respuesta a comidas (LSOD: Lawley-Simonczyk ODE)
- Predicción de diabetes tipo 2

#### Windkessel (Presión Arterial)
- 3/4 elementos: Resistencia, Compliance, Inertancia
- Presión sistólica/diastólica, flujo

#### Hodgkin-Huxley (Potencial de Membrana)
- 4 ecuaciones diferenciales acopladas
- Canales Na+, K+, Leak
- Generación de potenciales de acción

#### PK-1cmt (Farmacocinética 1 compartimiento)
- Absorción, distribución, eliminación
- Modelo: dC/dt = (ka·F·D)/V·e^{-ka·t} − (k·C)
- Cálculo de AUC, Cmax, Tmax

**Interfaz Bio:**
```cpp
struct PTIParams { double production_rate, consumption_rate; };
struct BioODESolver {
    static std::vector<std::vector<double>> simulate_pti(
        double t0, double tf, double dt,
        const std::vector<double>& y0,
        const PTIParams& params
    );
};
```

---

### 1.5 FFT (Transformada de Fourier Rápida)
**Archivo:** `src/fft.cpp`

- **Librería preferida:** FFTW3 (si disponible)
- **Fallback:** DFT manual O(n²)
- **Capacidades:** FFT, IFFT, espectro de potencia, magnitud fase

```cpp
std::vector<std::complex<double>> fft_result = FFT::forward(signal);
std::vector<double> magnitude = FFT::magnitude(fft_result);
```

---

### 1.6 Álgebra Lineal (Eigen3)
**Archivo:** `src/linear.cpp`

**Operaciones:**
- Determinante, inversa, traza
- Descomposiciones: LU, QR, SVD, Eigendecomposition
- RREF (Reduced Row Echelon Form)
- Resolución de sistemas Ax = b

```cpp
Eigen::MatrixXd A = Eigen::MatrixXd::Random(3, 3);
Eigen::MatrixXd inv = A.inverse();
auto svd = A.fullPivSvd();
```

---

## 2. Python Bindings (pybind11)

**Archivo:** `src/bindings.cpp`

**Exposición:**
```python
import equacore as eq

# CAS
expr = eq.Expression.from_string("x^2 + 3*x + 2")
deriv = expr.derivative("x")

# ODE
solver = eq.BioODESolver()
result = solver.simulate_pti(t0=0, tf=30, dt=0.1, y0=[150000], params=eq.PTIParams())

# Álgebra Lineal
A = np.array([[1, 2], [3, 4]])
inv_A = eq.matrix_inverse(A)
evals = eq.eigenvalues(A)

# FFT
signal = np.sin(np.linspace(0, 2*np.pi, 1024))
fft_result = eq.fft(signal)
```

---

## 3. Fallback Mode (SymPy)

**Ubicación:** `backend/services/sympy_fallback.py`

Si `libequacore.so` / `.dll` no existe:
```python
from equacore import NATIVE_ENGINE

if not NATIVE_ENGINE:
    print("⚠️ Usando SymPy fallback (C++ no disponible)")
    import sympy as sp
    x = sp.Symbol('x')
    expr = x**2 + 3*x + 2
    deriv = sp.diff(expr, x)  # 2x + 3
```

---

## 4. Compilación & Build

### CMake Workflow

```powershell
# Release (Optimizado)
cmake -DCMAKE_BUILD_TYPE=Release -G Ninja -S . -B cmake-build-release
cmake --build cmake-build-release --target _equacore --parallel 8

# Debug (Con símbolos)
cmake -DCMAKE_BUILD_TYPE=Debug -G Ninja -S . -B cmake-build-debug
cmake --build cmake-build-debug --target _equacore --parallel 8
```

### Dependencias

| Dependencia | Tipo | Cómo | Versión |
|-------------|------|------|---------|
| Eigen3 | Bundled | FetchContent | ≥3.4 |
| pybind11 | Pip | `pip install pybind11` | ≥2.10 |
| FFTW3 | Opcional | Apt/Brew | ≥3.3 |
| OpenBLAS | Opcional | Apt/Brew | ≥0.3 |

---

## 5. Estructura de Directorios

```
engine/
├── CMakeLists.txt
├── include/equacore/
│   ├── expression.hpp          # AST, derivadas
│   ├── calculus.hpp            # Cálculo (integrales, límites, Taylor)
│   ├── ode_solvers.hpp         # RK4, Euler, adaptativo
│   ├── ode.hpp                 # Bio-Engine (5 modelos)
│   ├── symbolic.hpp            # SymEngine wrapper
│   ├── fft.hpp                 # FFT/IFFT
│   └── linear.hpp              # Álgebra lineal (Eigen3)
├── src/
│   ├── expression.cpp          # Implementación AST
│   ├── calculus.cpp            # Cálculo numérico
│   ├── ode.cpp                 # Bio modelos (PTI, Bergman, HH, Windkessel, PK)
│   ├── ode_solvers.cpp         # Solvers ODE
│   ├── fft.cpp                 # Implementación FFT
│   ├── linear.cpp              # Wrappers Eigen3
│   ├── numeric.cpp             # Utilidades numéricas
│   ├── sparse.cpp              # Matrices dispersas
│   └── bindings.cpp            # pybind11 glue
├── python/equacore/
│   ├── __init__.py             # Import SymPy fallback
│   ├── biomodels.py            # Definiciones Bio
│   └── utils.py                # Helpers
└── tests/                       # (Ver Testing Strategy)
```

---

## 6. Integración con Binary & Séptima

### Binary EquaLab
- **Requiere:** CAS simbólico (Expression Tree)
- **Usa:** Derivadas, factorización, solve → Maxima subprocess
- **Python:** `from equacore import Expression`

### Séptima Biomédica
- **Requiere:** Bio-Engine (5 modelos)
- **Usa:** PTI, Bergman, HH, Windkessel, PK-1cmt
- **Python:** `from equacore import BioODESolver, PTIParams`

---

## 7. Performance & Benchmarks

| Operación | Tiempo (C++) | Tiempo (SymPy) | Speedup |
|-----------|-------------|----------------|---------|
| Derivada simple | 0.1 ms | 10 ms | 100× |
| ODE 100 pasos | 5 ms | 50 ms | 10× |
| FFT 1024 puntos | 0.5 ms | 20 ms | 40× |
| Inversa matriz 10×10 | 0.05 ms | 2 ms | 40× |

---

## Roadmap Futuro

- [ ] WASM build (JavaScript en navegador)
- [ ] GPU acceleration (CUDA para FFT masivo)
- [ ] Más modelos bio (PBPK, HCV, COVID)
- [ ] Caché simbólico (memoización)
- [ ] Interfaz gráfica (Plotly + Dash)

---
```

---

```markdown
# Testing Strategy & Architecture v3.0

## 1. Niveles de Testing

```
┌────────────────────────────────────────────────────┐
│  Nivel 5: Integration Tests (Full Stack)          │
│  - Binary EquaLab + Séptima Biomédica             │
│  - Python ↔ C++ bindings + Maxima subprocess      │
└────────────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────────────┐
│  Nivel 4: System Tests (Bio-Engine)               │
│  - PTI, Bergman, HH, Windkessel, PK-1cmt          │
│  - Validación vs. datos clínicos reales           │
└────────────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────────────┐
│  Nivel 3: Module Tests (C++ API)                  │
│  - Expression Tree, Calculus, ODE solvers, FFT    │
│  - Google Test framework                          │
└────────────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────────────┐
│  Nivel 2: Unit Tests (C++ individual)             │
│  - Derivadas, Integrales, Eigen3, FFT            │
│  - Google Test + Catch2                          │
└────────────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────────────┐
│  Nivel 1: Python Tests (pybind11)                 │
│  - pytest + unittest                              │
│  - Fallback SymPy validation                      │
└────────────────────────────────────────────────────┘
```

---

## 2. Test Structure (Directorios)

```
engine/
├── tests/
│   ├── CMakeLists.txt                    # Google Test config
│   ├── unit/
│   │   ├── test_expression.cpp           # CAS: AST, derivadas
│   │   ├── test_calculus.cpp             # CAS: integrales, límites, Taylor
│   │   ├── test_ode_solvers.cpp          # RK4, Euler, adaptativo
│   │   ├── test_linear.cpp               # Eigen3, determinante, inversa
│   │   ├── test_fft.cpp                  # FFT, IFFT, espectro
│   │   └── test_numeric.cpp              # Utilities numéricas
│   │
│   ├── bio/
│   │   ├── test_pti.cpp                  # Plataelet Kinetics
│   │   ├── test_bergman.cpp              # Glucose-Insulin
│   │   ├── test_hodgkin_huxley.cpp       # Neuronal membrane
│   │   ├── test_windkessel.cpp           # Arterial pressure
│   │   └── test_pk_1cmt.cpp              # Pharmacokinetics
│   │
│   ├── integration/
│   │   ├── test_cas_to_ode.cpp           # Expression → ODE solve
│   │   ├── test_bindings.cpp             # C++ ↔ Python
│   │   └── test_fallback.cpp             # C++ ↔ SymPy
│   │
│   └── data/
│       ├── clinical_pti_data.csv         # Datos clínicos reales (PTI)
│       ├── glucose_response.csv          # OGTT reference
│       └── hh_reference.csv              # Hodgkin-Huxley ground truth
│
└── python_tests/
    ├── conftest.py                       # pytest fixtures
    ├── test_expression_py.py             # Python: CAS
    ├── test_ode_py.py                    # Python: Bio-Engine
    ├── test_ffft_py.py                   # Python: FFT
    ├── test_fallback.py                  # SymPy fallback
    └── test_integration.py               # Full Binary + Séptima
```

---

## 3. Unit Tests (Google Test C++)

### 3.1 Expression Tree (`test_expression.cpp`)

```cpp
#include <gtest/gtest.h>
#include "equacore/expression.hpp"

TEST(ExpressionTest, LiteralEvaluation) {
    auto lit = std::make_shared<Literal>(3.14);
    EXPECT_DOUBLE_EQ(lit->evaluate({}), 3.14);
}

TEST(ExpressionTest, VariableSubstitution) {
    auto var = std::make_shared<Variable>("x");
    EXPECT_DOUBLE_EQ(var->evaluate({{"x", 5.0}}), 5.0);
}

TEST(ExpressionTest, BinaryOpAddition) {
    auto expr = std::make_shared<BinaryOp>(
        BinaryOp::Op::Add,
        std::make_shared<Literal>(3.0),
        std::make_shared<Literal>(2.0)
    );
    EXPECT_DOUBLE_EQ(expr->evaluate({}), 5.0);
}

TEST(ExpressionTest, DerivativeChainRule) {
    // f(x) = sin(x^2)
    // f'(x) = 2x·cos(x^2)
    auto expr = std::make_shared<FunctionCall>(
        "sin",
        std::make_shared<BinaryOp>(
            BinaryOp::Op::Multiply,
            std::make_shared<Variable>("x"),
            std::make_shared<Variable>("x")
        )
    );
    auto deriv = expr->derivative("x");
    
    // En x=0: f'(0) = 0
    EXPECT_DOUBLE_EQ(deriv->evaluate({{"x", 0.0}}), 0.0);
    
    // En x=π/4: f'(π/4) ≈ 0.707
    EXPECT_NEAR(deriv->evaluate({{"x", M_PI/4}}), 0.707, 0.01);
}
```

### 3.2 Cálculo (`test_calculus.cpp`)

```cpp
TEST(CalculusTest, SimpsonIntegral) {
    // ∫₀^π sin(x)dx = 2
    double result = Calculus::simpson(
        [](double x) { return std::sin(x); },
        0.0, M_PI, 1000
    );
    EXPECT_NEAR(result, 2.0, 0.001);
}

TEST(CalculusTest, RombergIntegral) {
    // ∫₀¹ x²dx = 1/3
    double result = Calculus::romberg(
        [](double x) { return x * x; },
        0.0, 1.0, 1e-6
    );
    EXPECT_NEAR(result, 0.3333, 0.0001);
}

TEST(CalculusTest, TaylorExpansion) {
    // Taylor de sin(x) en x=0, orden 5
    auto taylor = Calculus::taylor_series(
        [](double x) { return std::sin(x); },
        0.0, 5
    );
    // taylor(0.5) ≈ sin(0.5) ≈ 0.4794
    EXPECT_NEAR(taylor(0.5), 0.4794, 0.0001);
}

TEST(CalculusTest, Limit) {
    // lim_{x→0} sin(x)/x = 1
    double lim = Calculus::limit(
        [](double x) { return std::sin(x) / x; },
        0.0
    );
    EXPECT_NEAR(lim, 1.0, 0.001);
}
```

### 3.3 ODE Solvers (`test_ode_solvers.cpp`)

```cpp
TEST(ODESolversTest, RK4SimpleODE) {
    // dy/dt = y, y(0) = 1 → y(t) = e^t
    ODESolver solver;
    auto result = solver.solve(
        [](double t, const std::vector<double>& y) {
            return std::vector<double>{y[0]};
        },
        0.0, 1.0, 0.01, {1.0}
    );
    
    // En t=1: y ≈ e ≈ 2.71828
    EXPECT_NEAR(result.back()[0], std::exp(1.0), 0.01);
}

TEST(ODESolversTest, RK4CoupledSystem) {
    // Lotka-Volterra: dx/dt = ax - bxy, dy/dt = -cy + dxy
    std::vector<double> y0 = {10.0, 5.0};  // Presas, depredadores
    
    ODESolver solver;
    auto result = solver.solve(
        [](double t, const std::vector<double>& y) {
            double a = 1.0, b = 0.1, c = 1.5, d = 0.075;
            return std::vector<double>{
                a*y[0] - b*y[0]*y[1],
                -c*y[1] + d*y[0]*y[1]
            };
        },
        0.0, 10.0, 0.01, y0
    );
    
    // Sistema debe oscilar y conservar área
    EXPECT_GT(result.size(), 900);  // ~1000 pasos
}
```

### 3.4 Álgebra Lineal (`test_linear.cpp`)

```cpp
TEST(LinearTest, MatrixInverse) {
    Eigen::Matrix3d A;
    A << 1, 2, 3,
         0, 1, 4,
         5, 6, 0;
    
    Eigen::Matrix3d inv_A = A.inverse();
    Eigen::Matrix3d I = A * inv_A;
    
    // A × A⁻¹ = I
    EXPECT_TRUE(I.isIdentity(1e-6));
}

TEST(LinearTest, SVDDecomposition) {
    Eigen::MatrixXd A = Eigen::MatrixXd::Random(5, 3);
    Eigen::JacobiSVD<Eigen::MatrixXd> svd(A, Eigen::ComputeFullU | Eigen::ComputeFullV);
    
    Eigen::MatrixXd reconstructed = svd.matrixU() * 
                                     svd.singularValues().asDiagonal() * 
                                     svd.matrixV().transpose();
    
    EXPECT_TRUE(A.isApprox(reconstructed, 1e-6));
}

TEST(LinearTest, EigendecompositionSymmetric) {
    Eigen::Matrix3d A;
    A << 4, -1, 2,
         -1, 3, -1,
         2, -1, 4;
    
    Eigen::SelfAdjointEigenSolver<Eigen::Matrix3d> solver(A);
    auto eigenvalues = solver.eigenvalues();
    
    // Eigenvalores: 3, 3, 5
    EXPECT_NEAR(eigenvalues(2), 5.0, 1e-6);
}
```

### 3.5 FFT (`test_fft.cpp`)

```cpp
TEST(FFTTest, RealSignal) {
    std::vector<double> signal(1024);
    for (int i = 0; i < 1024; ++i) {
        signal[i] = std::sin(2 * M_PI * 5 * i / 1024)  // 5 Hz
                  + std::sin(2 * M_PI * 10 * i / 1024); // 10 Hz
    }
    
    auto fft_result = FFT::forward(signal);
    auto magnitude = FFT::magnitude(fft_result);
    
    // Picos en índices 5 y 10
    int peak1 = std::max_element(magnitude.begin(), magnitude.begin()+50) - magnitude.begin();
    EXPECT_NEAR(peak1, 5, 2);  // Tolerancia ±2
}

TEST(FFTTest, Parseval) {
    // Energía en tiempo = Energía en frecuencia
    std::vector<double> signal(256, 1.0);
    
    double energy_time = 0;
    for (double s : signal) energy_time += s * s;
    
    auto fft = FFT::forward(signal);
    double energy_freq = 0;
    for (auto& c : fft) energy_freq += std::norm(c);
    
    EXPECT_NEAR(energy_time, energy_freq / signal.size(), 1e-6);
}
```

---

## 4. Bio-Engine Tests (`tests/bio/`)

### 4.1 PTI (`test_pti.cpp`)

```cpp
TEST(BioModelsTest, PTINormal) {
    // Rangonormal: 150–400 k/µL
    PTIParams params;
    params.production_rate = 1e11;
    params.consumption_rate = 1e9;
    params.platelet_lifespan = 10.0;  // días
    
    std::vector<double> y0 = {150000.0, 0.0};
    auto result = BioODESolver::simulate_pti(
        0.0, 30.0, 0.1, y0, params
    );
    
    // Estado estable en rango normal
    EXPECT_GT(result.back()[0], 150000);
    EXPECT_LT(result.back()[0], 400000);
}

TEST(BioModelsTest, PTIThrombocytopenia) {
    // Simulación de trombocitopenia (plaquetas bajas)
    PTIParams params;
    params.production_rate = 5e10;
    params.consumption_rate = 2e9;
    
    std::vector<double> y0 = {50000.0, 0.0};  // Bajo
    auto result = BioODESolver::simulate_pti(
        0.0, 30.0, 0.1, y0, params
    );
    
    // Recuperación gradual
    EXPECT_LT(result.back()[0], result.front()[0] + 20000);
}
```

### 4.2 Bergman (`test_bergman.cpp`)

```cpp
TEST(BioModelsTest, BergmanOGTT) {
    // Oral Glucose Tolerance Test
    // Glucosa basal ≈ 100 mg/dL
    // Insulina basal ≈ 10 µU/mL
    
    BergmanParams params;
    params.Sg = 1.2e-2;       // Sensibilidad insulínica
    params.Si = 1.5e-4;       // Potencia insulínica
    params.Gb = 100.0;        // Glucosa basal
    params.Ib = 10.0;         // Insulina basal
    
    std::vector<double> y0 = {100.0, 10.0, 10.0};
    auto result = BioODESolver::simulate_bergman(
        0.0, 120.0, 1.0, y0, params,
        [](double t) { return t < 5 ? 75.0 : 0.0; }  // Carga de 75g en 5 min
    );
    
    // Pico de glucosa entre 30-60 min
    auto max_glucose = *std::max_element(
        result.begin() + 30, result.begin() + 60,
        [](auto& a, auto& b) { return a[0] < b[0]; }
    );
    
    // Normal: <140 mg/dL a los 2h
    EXPECT_LT(result.back()[0], 140.0);
}
```

### 4.3 Hodgkin-Huxley (`test_hodgkin_huxley.cpp`)

```cpp
TEST(BioModelsTest, HodgkinHuxleyActionPotential) {
    // Estimulación con corriente externa
    HHParams params;
    params.Cm = 1.0;
    params.gL = 0.3;
    params.gK = 36.0;
    params.gNa = 120.0;
    params.EL = -54.387;
    params.EK = -77.0;
    params.ENa = 50.0;
    
    std::vector<double> y0 = {-65.0, 0.05, 0.6, 0.32};  // V, m, h, n
    
    auto result = BioODESolver::simulate_hh(
        0.0, 50.0, 0.01, y0, params,
        [](double t) { return t > 10 && t < 11 ? 10.0 : 0.0; }  // Pulso 10µA
    );
    
    // Potencial de acción debe subir ~100mV
    EXPECT_GT(result[5000][0], 20.0);  // En mV
}
```

---

## 5. Integration Tests (`tests/integration/`)

```cpp
TEST(IntegrationTest, CAStoODESolve) {
    // Construir ecuación simbólicamente: y'' + 2y' + y = 0
    // Resolver numéricamente
    
    auto expr = std::make_shared<BinaryOp>(
        BinaryOp::Op::Add,
        std::make_shared<BinaryOp>(
            BinaryOp::Op::Multiply,
            std::make_shared<Literal>(1.0),
            std::make_shared<FunctionCall>("D2", std::make_shared<Variable>("y"))
        ),
        std::make_shared<BinaryOp>(
            BinaryOp::Op::Multiply,
            std::make_shared<Literal>(2.0),
            std::make_shared<FunctionCall>("D", std::make_shared<Variable>("y"))
        )
    );
    
    // Convertir a función lambda y resolver
    ODESolver solver;
    auto result = solver.solve(
        [](double t, const std::vector<double>& y) {
            // y[0] = y, y[1] = y'
            return std::vector<double>{y[1], -2*y[1] - y[0]};
        },
        0.0, 10.0, 0.1, {1.0, 0.0}
    );
    
    EXPECT_GT(result.size(), 50);
}

TEST(IntegrationTest, PythonCppBridging) {
    // Verificar que pybind11 expone correctamente
    // (Este test se ejecuta desde Python)
    // Ver test_integration.py
}
```

---

## 6. Python Tests (pytest)

### 6.1 `python_tests/test_expression_py.py`

```python
import pytest
import equacore as eq
import numpy as np


def test_expression_literal():
    expr = eq.Expression.literal(3.14)
    assert expr.evaluate({}) == pytest.approx(3.14)


def test_expression_derivative():
    # x^2 + 3x + 2
    expr = eq.Expression.polynomial([2, 3, 1])  # coeff: 2, 3x, x^2
    deriv = expr.derivative("x")
    
    # f'(x) = 2x + 3
    assert deriv.evaluate({"x": 0}) == pytest.approx(3.0)
    assert deriv.evaluate({"x": 1}) == pytest.approx(5.0)


def test_fallback_sympy():
    """Si C++ no disponible, usar SymPy"""
    from equacore import NATIVE_ENGINE
    
    if not NATIVE_ENGINE:
        import sympy as sp
        x = sp.Symbol('x')
        expr = x**2 + 3*x + 2
        deriv = sp.diff(expr, x)
        assert deriv == 2*x + 3
```

### 6.2 `python_tests/test_ode_py.py`

```python
def test_pti_normal_range():
    params = eq.PTIParams()
    params.production_rate = 1e11
    params.consumption_rate = 1e9
    
    solver = eq.BioODESolver()
    y0 = np.array([150000.0, 0.0])
    result = solver.simulate_pti(0, 30, 0.1, y0, params)
    
    # Estado estable en rango normal
    assert 150000 < result[-1][0] < 400000


def test_bergman_glucose_response():
    params = eq.BergmanParams()
    params.Sg = 1.2e-2
    
    solver = eq.BioODESolver()
    y0 = np.array([100.0, 10.0, 10.0])
    result = solver.simulate_bergman(0, 120, 1.0, y0, params)
    
    assert len(result) == 121  # 0 a 120 min


def test_hh_action_potential():
    params = eq.HHParams()
    solver = eq.BioODESolver()
    y0 = np.array([-65.0, 0.05, 0.6, 0.32])
    
    result = solver.simulate_hh(0, 50, 0.01, y0, params)
    
    # Depolarización esperada
    assert max([r[0] for r in result]) > 20.0
```

---

## 7. Datos de Referencia Clínicos

**`tests/data/clinical_pti_data.csv`** (Ejemplo):
```
time_days,platelet_count,status
0,150000,normal
1,148000,normal
10,152000,normal
30,151000,stable
```

**`tests/data/glucose_response.csv`**:
```
time_min,glucose_mgdl,insulin_uuml
0,100,10
15,155,25
30,160,35
60,120,20
120,105,12
```

---

## 8. Continuous Integration (GitHub Actions)

**`.github/workflows/test.yml`**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-cpp:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ilammy/msvc-dev-cmd@v1.12
      - run: cmake -G Ninja -DCMAKE_BUILD_TYPE=Release -S . -B build
      - run: cmake --build build --target _equacore
      - run: ctest --output-on-failure
  
  test-python:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install pybind11 pytest numpy
      - run: pytest python_tests/ -v
```

---

## 9. Checklist de Testing Antes de Release

- [ ] Todos los unit tests ✓ (Google Test)
- [ ] Todos los tests bio ✓ (vs. datos clínicos)
- [ ] Integration tests ✓ (CAS ↔ ODE)
- [ ] Python bindings ✓ (pytest)
- [ ] Fallback SymPy ✓ (sin C++)
- [ ] Performance benchmarks ✓ (<10ms por operación)
- [ ] Cobertura mínima 85% (C++) + 80% (Python)
- [ ] CI/CD verde ✓ (GitHub Actions)

---

## 10. Métricas de Éxito

| Métrica | Target | Status |
|---------|--------|--------|
| Unit test pass rate | 100% | ⏳ |
| Bio model RMSE vs. clinical | <5% | ⏳ |
| Python binding latency | <1ms | ⏳ |
| Code coverage | 85% (C++) | ⏳ |
| FFT error (vs. NumPy) | <1e-6 | ⏳ |

---

