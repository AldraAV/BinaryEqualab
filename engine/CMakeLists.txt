# Binary EquaLab - High Performance Math Engine v3.0
# Powering: Binary EquaLab & Séptima (BioMedical)

cmake_minimum_required(VERSION 3.25)
project(EquaCore VERSION 3.0.0 LANGUAGES CXX C)

# ==========================================
# 🚀 PERFORMANCE OPTIMIZATIONS (Wolfram-level)
# ==========================================

# Use C++20 for concepts, ranges, and performance features
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Compiler-specific optimizations
if(MSVC)
    add_compile_options(/O2 /Oi /Ot /GL /fp:fast /arch:AVX2)
else()
    add_compile_options(
        -O3 
        -march=native 
        -mtune=native 
        -flto 
        -funroll-loops 
        -fvectorize 
        -DNDEBUG
        -ffast-math
    )
endif()

# Link Time Optimization (LTO) across all compilers
include(CheckIPOSupported)
check_ipo_supported(RESULT result OUTPUT output)
if(result)
    set(CMAKE_INTERPROCEDURAL_OPTIMIZATION_RELEASE ON)
    message(STATUS "LTO enabled for Release build")
endif()

# ==========================================
# 📦 DEPENDENCIES
# ==========================================

# 1. Eigen3 (Linear Algebra) - Header only, fast
find_package(Eigen3 3.4 REQUIRED NO_MODULE)

# 2. OpenBLAS (Optimized BLAS for dense matrix ops)
find_package(PkgConfig REQUIRED)
pkg_check_modules(OpenBLAS REQUIRED openblas)

# 3. FFTW3 (Fast Fourier Transform)
pkg_check_modules(FFTW3 fftw3)
if(FFTW3_FOUND)
    add_definitions(-DHAVE_FFTW3)
    include_directories(${FFTW3_INCLUDE_DIRS})
    message(STATUS "FFTW3 Found: High-performance FFT enabled")
else()
    message(WARNING "FFTW3 Not Found: Using fallback slow DFT")
endif()

# 4. SuiteSparse (Sparse Matrices)
find_package(SuiteSparse OPTIONAL_COMPONENTS CHOLMOD UMFPACK)
if(SuiteSparse_FOUND)
    add_definitions(-DHAVE_SUITESPARSE)
    include_directories(${SuiteSparse_INCLUDE_DIRS})
    message(STATUS "SuiteSparse Found: Fast sparse solvers enabled")
else()
    message(WARNING "SuiteSparse Not Found: Using Eigen sparse solvers")
endif()

# 5. Pybind11 (Python Interop)
find_package(pybind11 CONFIG REQUIRED)

# ==========================================
# 🛠️ BUILD TARGETS
# ==========================================

include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${OpenBLAS_INCLUDE_DIRS}
)

# --- Core Library (Static) ---
# Separating numeric/symbolic/ode engines
add_library(equacore_static STATIC
    src/symbolic.cpp    # Existing
    src/linear.cpp      # Existing
    src/ode.cpp         # NEW: BioODESolver & Advanced Integrators
    src/fft.cpp         # NEW: FFT wrappers
    src/sparse.cpp      # NEW: Sparse matrix wrappers
)

target_link_libraries(equacore_static
    PUBLIC
    Eigen3::Eigen
    ${OpenBLAS_LIBRARIES}
)

if(FFTW3_FOUND)
    target_link_libraries(equacore_static PUBLIC ${FFTW3_LIBRARIES})
endif()

if(SuiteSparse_FOUND)
    target_link_libraries(equacore_static PUBLIC ${SuiteSparse_LIBRARIES})
endif()

# --- Python Bindings ---
pybind11_add_module(_equacore src/bindings.cpp)

target_link_libraries(_equacore PRIVATE equacore_static)

# Output directory
set_target_properties(_equacore PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/python/equacore
)

# ==========================================
# 📢 STATUS REPORT
# ==========================================
message(STATUS "Binary EquaLab Engine v3.0 Configuration:")
message(STATUS "  - Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  - C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  - Eigen3: ${EIGEN3_FOUND}")
message(STATUS "  - OpenBLAS: ${OpenBLAS_FOUND}")
message(STATUS "  - FFTW3: ${FFTW3_FOUND}")
message(STATUS "  - SuiteSparse: ${SuiteSparse_FOUND}")
