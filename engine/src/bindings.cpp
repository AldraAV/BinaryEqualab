#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/eigen.h> 

#include "ode_solvers.hpp" // OLD generics
#include "ode.hpp"         // NEW BioODESolver

namespace py = pybind11;
using namespace equacore;

// --- Primitives placeholders ---
bool is_prime(long long n) { return false; } // Stub for now

PYBIND11_MODULE(_equacore, m) {
    m.doc() = "EquaCore v3.0 - High-performance BioMedical Engine";
    m.attr("__version__") = "3.0.0";

    // --- Params Structs Bindings ---
    py::class_<BergmanParams>(m, "BergmanParams")
        .def(py::init<double, double, double, double, double, double>(),
             py::arg("p1"), py::arg("p2"), py::arg("p3"), 
             py::arg("Gb"), py::arg("Ib"), py::arg("n"));

    py::class_<PKParams>(m, "PKParams")
        .def(py::init<double, double, double, double, bool>(),
             py::arg("ka"), py::arg("ke"), py::arg("Vd"), py::arg("D"), py::arg("oral"));

    py::class_<WindkesselParams>(m, "WindkesselParams")
        .def(py::init<double, double, double>(),
             py::arg("R"), py::arg("C"), py::arg("P_venous"));
             
    py::class_<HHParams>(m, "HHParams")
        .def(py::init<double, double, double, double, double, double, double, double>(),
             py::arg("C_m"), py::arg("g_Na"), py::arg("g_K"), py::arg("g_L"),
             py::arg("E_Na"), py::arg("E_K"), py::arg("E_L"), py::arg("I_ext"));


    // --- BioODESolver ---
    py::class_<BioODESolver> solver(m, "BioODESolver");

    // Result struct
    py::class_<BioODESolver::SimulationResult>(solver, "Result")
        .def_readonly("t", &BioODESolver::SimulationResult::t)
        .def_readonly("y", &BioODESolver::SimulationResult::y);

    // Methods
    solver.def_static("simulate_glucose_insulin", &BioODESolver::simulate_glucose_insulin,
        "Simulate Bergman Minimal Model",
        py::arg("t_start"), py::arg("t_end"), py::arg("dt"),
        py::arg("y0"), py::arg("params")
    );

    solver.def_static("simulate_pk_1cmt", &BioODESolver::simulate_pk_1cmt,
        "Simulate 1-Compartment PK Model",
        py::arg("t_start"), py::arg("t_end"), py::arg("dt"),
        py::arg("y0"), py::arg("params")
    );

    solver.def_static("simulate_windkessel", &BioODESolver::simulate_windkessel,
        "Simulate 2-Element Windkessel Cardiovascular Model",
        py::arg("t_start"), py::arg("t_end"), py::arg("dt"),
        py::arg("y0"), py::arg("params"), py::arg("heart_rate")
    );
    
    solver.def_static("simulate_hodgkin_huxley", &BioODESolver::simulate_hodgkin_huxley,
        "Simulate Hodgkin-Huxley Neuron Model",
        py::arg("t_start"), py::arg("t_end"), py::arg("dt"),
        py::arg("y0"), py::arg("params")
    );
    
    // --- Legacy / Generic ODESolver support ---
    py::class_<ODESolver> generic_solver(m, "ODESolver");
    py::enum_<ODESolver::Method>(generic_solver, "Method")
        .value("Euler", ODESolver::Method::Euler)
        .value("RungeKutta4", ODESolver::Method::RungeKutta4)
        .export_values();
    py::class_<ODESolver::Result>(generic_solver, "Result")
        .def_readonly("t", &ODESolver::Result::t)
        .def_readonly("y", &ODESolver::Result::y);
    generic_solver.def_static("solve", &ODESolver::solve);
    
    // --- Utils ---
    m.def("is_prime", &is_prime);
}
