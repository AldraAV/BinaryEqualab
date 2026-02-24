# EquaCore - C++ Math Engine

High-performance symbolic and numerical computation engine for Binary EquaLab.

## Dependencies

- **GiNaC** - Symbolic algebra (~100-250x faster than SymPy)
- **CLN** - Arbitrary precision numbers (GiNaC dependency)
- **Eigen3** - Linear algebra (~10-50x faster than NumPy)
- **pybind11** - Python bindings with NumPy interop
- **Bio-Engine Extension:** Native ODE models for Bergman, Windkessel, Hodgkin-Huxley and PTI (Hermatology).

## Quick Start

### 1. Install vcpkg (if not installed)
```bash
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg && ./bootstrap-vcpkg.sh  # Linux/Mac
# or: .\bootstrap-vcpkg.bat       # Windows
```

### 2. Install Dependencies
```bash
./vcpkg install cln ginac eigen3 pybind11
```

### 3. Build
```bash
# Configure
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=/path/to/vcpkg/scripts/buildsystems/vcpkg.cmake

# Build
cmake --build build --config Release
```

### 4. Use in Python
```python
from equacore import Expr, symbol, matrix

# Symbolic computation
x = symbol("x")
expr = Expr("(x + 1)^10")
expanded = expr.expand()
print(expanded.to_latex())

# Differentiation
derivative = expr.diff("x")
print(derivative)

# Linear algebra (with NumPy interop)
import numpy as np
A = matrix([[1, 2], [3, 4]])
inv_A = inverse(A)
print(inv_A)  # Returns NumPy array
```

## Project Structure

```
engine/
├── CMakeLists.txt           # Build configuration
├── vcpkg.json               # Dependencies manifest
├── include/equacore/        # C++ headers
│   ├── symbolic.hpp         # GiNaC wrapper
│   └── linear.hpp           # Eigen wrapper
├── src/                     # C++ source
│   ├── symbolic.cpp
│   ├── linear.cpp
│   └── bindings.cpp         # pybind11 module
└── python/equacore/         # Python package
    └── __init__.py          # With SymPy fallback
```

## Fallback Mode

If the C++ engine is not compiled, the Python package falls back to SymPy/NumPy:

```python
from equacore import NATIVE_ENGINE
print(NATIVE_ENGINE)  # True if C++ engine, False if fallback
```

## WASM Build (for Web)

```bash
# Configure with Emscripten
emcmake cmake -B build_wasm -S . -DBUILD_WASM=ON

# Build
cmake --build build_wasm
```

Output: `wasm/equacore.js` + `wasm/equacore.wasm`
