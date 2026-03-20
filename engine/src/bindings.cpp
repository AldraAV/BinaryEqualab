#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/eigen.h> 

#include "equacore/expression.hpp"
#include "equacore/calculus.hpp"
#include "equacore/stats.hpp"

#include "equacore/linear.hpp"
#include "ode_solvers.hpp" // OLD generics
#include "ode.hpp"         // NEW BioODESolver

namespace py = pybind11;
using namespace equacore;

// --- Primitives placeholders ---
bool is_prime(long long n) { return false; } // Stub for now

PYBIND11_MODULE(_equacore, m) {
    m.doc() = "EquaCore v3.0 - High-performance BioMedical & Math Engine";
    m.attr("__version__") = "3.0.0";

    // ========================================================================
    // --- CAS: Symbolic Expression Tree Bindings ---
    // ========================================================================
    
    // Abstract base class binding
    py::class_<Expression, std::shared_ptr<Expression>>(m, "Expression")
        .def("toString", &Expression::toString, "Convert Expression to string")
        .def("evaluate", [](const std::shared_ptr<Expression>& expr, py::dict py_vars) {
            std::map<std::string, double> cpp_vars;
            for (auto item : py_vars) {
                cpp_vars[py::str(item.first)] = py::cast<double>(item.second);
            }
            return expr->evaluate(cpp_vars);
        }, "Evaluate the expression given a dictionary of variables", py::arg("vars") = py::dict())
        .def("derivative", &Expression::derivative, "Compute derivative with respect to a variable", py::arg("var"))
        .def("__str__", &Expression::toString)
        .def("__repr__", &Expression::toString);

    // Factory methods as a submodule for a clean namespace (equacore.sym.xxx)
    auto m_sym = m.def_submodule("sym", "Symbolic expression factory functions");
    
    m_sym.def("num", &equacore::num, "Create a number literal", py::arg("value"));
    m_sym.def("sym", &equacore::sym, "Create a symbol (variable)", py::arg("name"));
    
    m_sym.def("add", &equacore::add, py::arg("a"), py::arg("b"));
    m_sym.def("sub", &equacore::sub, py::arg("a"), py::arg("b"));
    m_sym.def("mul", &equacore::mul, py::arg("a"), py::arg("b"));
    m_sym.def("div", &equacore::div, py::arg("a"), py::arg("b"));
    m_sym.def("pow", &equacore::pow, py::arg("base"), py::arg("exp"));
    m_sym.def("neg", &equacore::neg, py::arg("a"));
    
    m_sym.def("sin", &equacore::sin, py::arg("x"));
    m_sym.def("cos", &equacore::cos, py::arg("x"));
    m_sym.def("tan", &equacore::tan, py::arg("x"));
    m_sym.def("exp", &equacore::exp, py::arg("x"));
    m_sym.def("log", &equacore::log, py::arg("x"));
    m_sym.def("sqrt", &equacore::sqrt, py::arg("x"));
    m_sym.def("abs", &equacore::abs, py::arg("x"));

    // Calculus functions
    auto m_calc = m.def_submodule("calculus", "Calculus operations");
    
    m_calc.def("Derivative", &equacore::calculus::Derivative::compute, 
        "Compute first derivative", py::arg("expr"), py::arg("var"));
    
    m_calc.def("nth_derivative", &equacore::calculus::Derivative::nth_derivative, 
        "Compute nth derivative", py::arg("expr"), py::arg("var"), py::arg("order"));
        
    m_calc.def("Limit", &equacore::calculus::Limit::compute,
        "Compute numerical limit at a point", py::arg("expr"), py::arg("var"), py::arg("value"), py::arg("tolerance") = 1e-10);
        
    m_calc.def("Integral_definite", &equacore::calculus::Integral::definite,
        "Compute numerical definite integral", 
        py::arg("expr"), py::arg("var"), py::arg("a"), py::arg("b"), 
        py::arg("method") = "simpson", py::arg("samples") = 1000);
        
    m_calc.def("Integral_indefinite", &equacore::calculus::Integral::indefinite,
        "Compute symbolic indefinite integral", 
        py::arg("expr"), py::arg("var"));
        
    m_calc.def("Taylor", &equacore::calculus::Series::taylor,
        "Compute Taylor series expansion", py::arg("expr"), py::arg("var"), py::arg("x0"), py::arg("n"));

    // Critical Point Struct
    py::class_<equacore::calculus::Analysis::CriticalPoint>(m_calc, "CriticalPoint")
        .def_readonly("x", &equacore::calculus::Analysis::CriticalPoint::x)
        .def_readonly("y", &equacore::calculus::Analysis::CriticalPoint::y)
        .def_property_readonly("type", [](const equacore::calculus::Analysis::CriticalPoint& cp) {
            switch(cp.type) {
                case equacore::calculus::Analysis::CriticalPoint::MINIMUM: return "Minimum";
                case equacore::calculus::Analysis::CriticalPoint::MAXIMUM: return "Maximum";
                case equacore::calculus::Analysis::CriticalPoint::INFLECTION: return "Inflection";
                default: return "Unknown";
            }
        });

    m_calc.def("critical_points", &equacore::calculus::Analysis::critical_points,
        "Find critical points in interval [a, b]", py::arg("expr"), py::arg("var"), py::arg("a"), py::arg("b"));


    // ========================================================================
    // --- Linear Algebra (Eigen) Bindings ---
    // ========================================================================
    
    auto m_linalg = m.def_submodule("linalg", "Eigen-powered linear algebra");
    
    m_linalg.def("matrix", &equacore::create_matrix,
        "Create matrix from nested list", py::arg("data"));
    
    m_linalg.def("vector", &equacore::create_vector,
        "Create vector from list", py::arg("data"));
    
    m_linalg.def("determinant", &equacore::determinant,
        "Compute determinant", py::arg("m"));
    
    m_linalg.def("inverse", &equacore::inverse,
        "Compute matrix inverse", py::arg("m"));
    
    m_linalg.def("transpose", py::overload_cast<const MatrixXd&>(&equacore::transpose),
        "Compute matrix transpose", py::arg("m"));
    
    m_linalg.def("rank", &equacore::rank,
        "Compute matrix rank", py::arg("m"));
    
    m_linalg.def("rref", &equacore::rref,
        "Reduced row echelon form", py::arg("m"));
    
    m_linalg.def("solve", &equacore::solve_linear,
        "Solve linear system Ax = b", py::arg("a"), py::arg("b"));

    // ========================================================================
    // --- Statistics Bindings ---
    // ========================================================================
    
    auto m_stats = m.def_submodule("stats", "Statistical operations");
    
    m_stats.def("mean", &equacore::stats::Statistics::mean,
        "Compute the arithmetic mean of a dataset", py::arg("data"));
        
    m_stats.def("median", &equacore::stats::Statistics::median,
        "Compute the median of a dataset", py::arg("data"));
        
    m_stats.def("variance", &equacore::stats::Statistics::variance,
        "Compute the sample variance of a dataset", py::arg("data"));
        
    m_stats.def("population_variance", &equacore::stats::Statistics::population_variance,
        "Compute the population variance of a dataset", py::arg("data"));
        
    m_stats.def("standard_deviation", &equacore::stats::Statistics::standard_deviation,
        "Compute the sample standard deviation of a dataset", py::arg("data"));
        
    m_stats.def("population_standard_deviation", &equacore::stats::Statistics::population_standard_deviation,
        "Compute the population standard deviation of a dataset", py::arg("data"));

    // ========================================================================
    // --- Bio-Engine Bindings ---
    // ========================================================================

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

    // --- PTI (Púrpura Trombocitopénica Idiopática) ---
    py::class_<PTIParams>(m, "PTIParams")
        .def(py::init<>())
        .def_readwrite("production_rate", &PTIParams::production_rate)
        .def_readwrite("destruction_rate", &PTIParams::destruction_rate)
        .def_readwrite("antibody_half_life", &PTIParams::antibody_half_life)
        .def_readwrite("antibody_production", &PTIParams::antibody_production)
        .def_readwrite("treatment", &PTIParams::treatment)
        .def_readwrite("treatment_efficacy", &PTIParams::treatment_efficacy)
        .def_readwrite("dose_mg", &PTIParams::dose_mg)
        .def_readwrite("ivig_doses", &PTIParams::ivig_doses)
        .def_readwrite("splenectomy_success", &PTIParams::splenectomy_success)
        .def_readwrite("initial_platelets", &PTIParams::initial_platelets);

    solver.def_static("simulate_pti", &BioODESolver::simulate_pti,
        "Simula tratamiento de PTI (Púrpura Trombocitopénica Idiopática)",
        py::arg("t_start"), py::arg("t_end"), py::arg("dt"),
        py::arg("y0"), py::arg("params")
    );

    solver.def_static("pti_clinical_interpretation", &BioODESolver::pti_clinical_interpretation,
        "Genera interpretación clínica del resultado de simulación PTI",
        py::arg("initial_count"), py::arg("final_count"), py::arg("days")
    );

    // --- Stateful Steppers (WebSockets) ---
    py::class_<BioODESolver::PTIStepper>(m, "PTIStepper")
        .def(py::init<const VectorXd&, const PTIParams&>(), py::arg("y0"), py::arg("params"))
        .def("step", &BioODESolver::PTIStepper::step, "Avanzar un delta de tiempo (dt)", py::arg("dt"))
        .def("get_state", &BioODESolver::PTIStepper::get_state, "Obtener tensor de estado actual")
        .def("set_params", &BioODESolver::PTIStepper::set_params, "Mutar parámetros biomédicos en vivo", py::arg("params"))
        .def_property_readonly("P", &BioODESolver::PTIStepper::P, "Leer nivel de plaquetas")
        .def_property_readonly("A", &BioODESolver::PTIStepper::A, "Leer nivel de anticuerpos");
    
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
 
