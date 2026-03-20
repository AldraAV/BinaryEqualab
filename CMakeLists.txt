cmake_minimum_required(VERSION 3.20)
project(BinaryEquaLab VERSION 3.0.0 LANGUAGES CXX)

# C++ Standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS_RELEASE "-O2 -funroll-loops -ffast-math -DNDEBUG")

# M_PI for MinGW/MSVC
add_definitions(-D_USE_MATH_DEFINES)

# ── Eigen3 via FetchContent (same as engine/) ──
include(FetchContent)
FetchContent_Declare(
    Eigen3
    URL https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.tar.gz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
set(EIGEN_BUILD_DOC OFF CACHE BOOL "" FORCE)
set(EIGEN_BUILD_TESTING OFF CACHE BOOL "" FORCE)
set(BUILD_TESTING OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(Eigen3)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Core source files (exclude main.cpp from library)
set(CORE_SOURCES
    src/expression.cpp
    src/calculus.cpp
    src/linear.cpp
    src/ode.cpp
)

# Main library
add_library(binary-core ${CORE_SOURCES})
target_link_libraries(binary-core PUBLIC Eigen3::Eigen)
target_include_directories(binary-core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

# Executable (CLI demo)
# add_executable(binary-cli src/main.cpp)
# target_link_libraries(binary-cli binary-core)

# Testing
# enable_testing()
# add_subdirectory(tests)

# Benchmarks (optional — only if dir has CMakeLists.txt)
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/benchmarks/CMakeLists.txt")
    add_subdirectory(benchmarks)
endif()

# Install
install(TARGETS binary-core
        RUNTIME DESTINATION bin
        LIBRARY DESTINATION lib
        ARCHIVE DESTINATION lib)
install(DIRECTORY include/ DESTINATION include)

