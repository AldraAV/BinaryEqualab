# Binary EquaLab - High Performance Math Engine v3.0
# Séptima Biomédica Bio-Engine
cmake_minimum_required(VERSION 3.20)
project(EquaCore VERSION 3.0.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

if(MSVC)
    add_compile_options(/O2 /fp:fast)
else()
    add_compile_options(-O2 -funroll-loops -DNDEBUG -ffast-math)
endif()

# ==========================================
# Eigen3 — siempre vía FetchContent
# ==========================================
include(FetchContent)
FetchContent_Declare(
    Eigen3
    URL https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.tar.gz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)

# ==========================================
# CLN & GiNaC — Auto-Build (Suite Élite)
# ==========================================
# Se descargan y compilan automáticamente si no están en el sistema
FetchContent_Declare(
    cln
    GIT_REPOSITORY https://github.com/gmp-mpfr-sys/cln.git
    GIT_TAG        cln_1_3_6
)
FetchContent_Declare(
    ginac
    GIT_REPOSITORY https://github.com/ginac/ginac.git
    GIT_TAG        release_1_8_6
)

set(EIGEN_BUILD_DOC OFF CACHE BOOL "" FORCE)
set(EIGEN_BUILD_TESTING OFF CACHE BOOL "" FORCE)
set(BUILD_TESTING OFF CACHE BOOL "" FORCE)

FetchContent_MakeAvailable(Eigen3 cln ginac)
message(STATUS "Dependencias CAS listas (Eigen3, CLN, GiNaC)")

# ==========================================
# pybind11 — REQUIRED (pip install pybind11)
# ==========================================
set(PYBIND11_FINDPYTHON ON)
find_package(pybind11 CONFIG REQUIRED)
message(STATUS "pybind11 ${pybind11_VERSION} encontrado")

# ==========================================
# OpenBLAS, FFTW3, SuiteSparse — opcionales
# ==========================================
find_package(PkgConfig QUIET)
if(PkgConfig_FOUND)
    pkg_check_modules(OpenBLAS QUIET openblas)
    pkg_check_modules(FFTW3    QUIET fftw3)
endif()
find_package(SuiteSparse QUIET OPTIONAL_COMPONENTS CHOLMOD UMFPACK)

if(OpenBLAS_FOUND)
    add_definitions(-DHAVE_OPENBLAS)
    message(STATUS "OpenBLAS: SI")
else()
    message(STATUS "OpenBLAS: NO (usando Eigen)")
endif()
if(FFTW3_FOUND)
    add_definitions(-DHAVE_FFTW3)
    message(STATUS "FFTW3: SI")
else()
    message(STATUS "FFTW3: NO (DFT fallback)")
endif()

# ==========================================
# Build
# ==========================================
include_directories(${CMAKE_SOURCE_DIR}/include)

add_library(equacore_static STATIC
    src/ode.cpp
    src/ode_solvers.cpp
    src/fft.cpp
    src/sparse.cpp
    src/symbolic.cpp
    src/linear.cpp
)

target_link_libraries(equacore_static PUBLIC Eigen3::Eigen cln GiNaC)

if(OpenBLAS_FOUND)
    target_link_libraries(equacore_static PUBLIC ${OpenBLAS_LIBRARIES})
endif()
if(FFTW3_FOUND)
    target_link_libraries(equacore_static PUBLIC ${FFTW3_LIBRARIES})
endif()
if(SuiteSparse_FOUND)
    target_link_libraries(equacore_static PUBLIC ${SuiteSparse_LIBRARIES})
endif()

# Módulo Python
pybind11_add_module(_equacore src/bindings.cpp)
target_link_libraries(_equacore PRIVATE equacore_static cln GiNaC)

set_target_properties(_equacore PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/python/equacore
)

message(STATUS "=== EquaCore v3.0 listo para compilar ===")
message(STATUS "  Target: _equacore → python/equacore/_equacore.pyd")
