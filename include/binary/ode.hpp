#pragma once

#include "expression.hpp"
#include <vector>
#include <functional>

namespace binary::ode {

/**
 * @brief Ordinary Differential Equations Solver
 * 
 * Supports:
 * - 1st order: separable, linear, Bernoulli
 * - 2nd order: homogeneous, non-homogeneous
 * - Systems of ODEs
 * - Laplace transform
 */
class ODESolver {
public:
    /**
     * Solve first-order ODE using various methods
     * @param equation ODE in form: y' = f(x, y)
     * @param y0 Initial condition: y(x0) = y0
     * @param method "separable", "linear", "bernoulli"
     * @return Symbolic solution (if possible) or numerical method
     */
    static Expr solve_first_order(
        std::function<Real(Real, Real)> f,
        Real x0, Real y0,
        const std::string& method = "rk4"
    );
    
    /**
     * Solve second-order ODE
     * y'' + p(x)*y' + q(x)*y = f(x)
     */
    static Expr solve_second_order(
        const std::string& type  // "homogeneous" or "non_homogeneous"
    );
};

/**
 * @brief Numerical ODE integration methods
 */
class NumericalODE {
public:
    struct Solution {
        std::vector<Real> x;
        std::vector<Real> y;
    };
    
    /**
     * Runge-Kutta 4th order method
     * Most common, good balance of accuracy and speed
     */
    static Solution rk4(
        std::function<Real(Real, Real)> f,  // dy/dx = f(x, y)
        Real x0, Real y0,                   // Initial values
        Real xf,                            // Final x
        Real h = 0.01                       // Step size
    );
    
    /**
     * Euler's method (simplest, less accurate)
     */
    static Solution euler(
        std::function<Real(Real, Real)> f,
        Real x0, Real y0,
        Real xf,
        Real h = 0.01
    );
    
    /**
     * Adaptive step-size RK4
     */
    static Solution adaptive_rk4(
        std::function<Real(Real, Real)> f,
        Real x0, Real y0,
        Real xf,
        Real tolerance = 1e-6,
        Real h_initial = 0.1
    );
};

/**
 * @brief Laplace Transform
 * Converts ODE to algebraic equation
 */
class LaplaceTrans {
public:
    /**
     * Laplace transform: L{f(t)} = F(s) = ∫₀^∞ f(t)e^(-st) dt
     * 
     * Standard transforms:
     * L{1} = 1/s
     * L{t^n} = n!/s^(n+1)
     * L{e^(at)} = 1/(s-a)
     * L{sin(ωt)} = ω/(s² + ω²)
     * L{cos(ωt)} = s/(s² + ω²)
     */
    static Expr transform(Expr f, const std::string& t_var, const std::string& s_var);
    
    /**
     * Inverse Laplace transform
     */
    static Expr inverse(Expr F, const std::string& s_var, const std::string& t_var);
};

/**
 * @brief System of ODEs solver
 * 
 * dy₁/dx = f₁(x, y₁, y₂, ...)
 * dy₂/dx = f₂(x, y₁, y₂, ...)
 * ...
 */
class SystemODE {
public:
    struct ODESystem {
        std::vector<std::function<Real(Real, const std::vector<Real>&)>> equations;
        std::vector<Real> initial_conditions;
    };
    
    /**
     * Solve system using RK4
     */
    static std::vector<NumericalODE::Solution> solve_rk4(
        const ODESystem& system,
        Real x0, Real xf,
        Real h = 0.01
    );
};

} // namespace binary::ode
