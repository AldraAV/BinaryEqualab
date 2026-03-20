#include "binary/ode.hpp"
#include <cmath>
#include <stdexcept>

namespace binary::ode {

// ============================================================================
// Numerical ODE Implementation - Runge-Kutta 4
// ============================================================================

NumericalODE::Solution NumericalODE::rk4(
    std::function<Real(Real, Real)> f,
    Real x0, Real y0,
    Real xf,
    Real h) {
    
    Solution sol;
    
    int steps = static_cast<int>((xf - x0) / h) + 1;
    sol.x.reserve(steps);
    sol.y.reserve(steps);
    
    Real x = x0;
    Real y = y0;
    
    while ((h > 0 && x < xf) || (h < 0 && x > xf)) {
        sol.x.push_back(x);
        sol.y.push_back(y);
        
        // RK4 stages
        Real k1 = f(x, y);
        Real k2 = f(x + h/2, y + (h/2)*k1);
        Real k3 = f(x + h/2, y + (h/2)*k2);
        Real k4 = f(x + h, y + h*k3);
        
        // Update
        y += (h/6.0) * (k1 + 2*k2 + 2*k3 + k4);
        x += h;
    }
    
    sol.x.push_back(xf);
    sol.y.push_back(y);
    
    return sol;
}

// ============================================================================
// Euler's Method (Simple)
// ============================================================================

NumericalODE::Solution NumericalODE::euler(
    std::function<Real(Real, Real)> f,
    Real x0, Real y0,
    Real xf,
    Real h) {
    
    Solution sol;
    
    int steps = static_cast<int>((xf - x0) / h) + 1;
    sol.x.reserve(steps);
    sol.y.reserve(steps);
    
    Real x = x0;
    Real y = y0;
    
    while ((h > 0 && x < xf) || (h < 0 && x > xf)) {
        sol.x.push_back(x);
        sol.y.push_back(y);
        
        // Euler step: y_{n+1} = y_n + h * f(x_n, y_n)
        y += h * f(x, y);
        x += h;
    }
    
    sol.x.push_back(xf);
    sol.y.push_back(y);
    
    return sol;
}

// ============================================================================
// Adaptive RK4 with Error Control
// ============================================================================

NumericalODE::Solution NumericalODE::adaptive_rk4(
    std::function<Real(Real, Real)> f,
    Real x0, Real y0,
    Real xf,
    Real tolerance,
    Real h_initial) {
    
    Solution sol;
    
    Real x = x0;
    Real y = y0;
    Real h = h_initial;
    
    sol.x.push_back(x);
    sol.y.push_back(y);
    
    int max_iterations = 100000;
    int iteration = 0;
    
    while ((h > 0 && x < xf) || (h < 0 && x > xf)) {
        if (iteration++ > max_iterations) {
            throw std::runtime_error("Adaptive RK4: max iterations exceeded");
        }
        
        // Compute with step h
        Real k1 = f(x, y);
        Real k2 = f(x + h/2, y + (h/2)*k1);
        Real k3 = f(x + h/2, y + (h/2)*k2);
        Real k4 = f(x + h, y + h*k3);
        
        Real y_full = y + (h/6.0) * (k1 + 2*k2 + 2*k3 + k4);
        
        // Compute with two half-steps for error estimation
        Real k1_half = f(x, y);
        Real k2_half = f(x + h/4, y + (h/4)*k1_half);
        Real k3_half = f(x + h/4, y + (h/4)*k2_half);
        Real k4_half = f(x + h/2, y + (h/2)*k3_half);
        
        Real y_half1 = y + (h/12.0) * (k1_half + 2*k2_half + 2*k3_half + k4_half);
        
        Real k1_h2 = f(x + h/2, y_half1);
        Real k2_h2 = f(x + 3*h/4, y_half1 + (h/4)*k1_h2);
        Real k3_h2 = f(x + 3*h/4, y_half1 + (h/4)*k2_h2);
        Real k4_h2 = f(x + h, y_half1 + (h/2)*k3_h2);
        
        Real y_half2 = y_half1 + (h/12.0) * (k1_h2 + 2*k2_h2 + 2*k3_h2 + k4_h2);
        
        // Estimate error
        Real error = std::abs(y_half2 - y_full);
        
        if (error < tolerance) {
            // Accept step
            y = y_half2;
            x += h;
            
            sol.x.push_back(x);
            sol.y.push_back(y);
            
            // Increase step size slightly
            h *= 1.1;
        } else {
            // Reject step and reduce h
            h *= 0.5;
        }
        
        // Limit step size
        if (h > 0 && x + h > xf) h = xf - x;
        if (h < 0 && x + h < xf) h = xf - x;
    }
    
    return sol;
}

// ============================================================================
// System of ODEs Solver
// ============================================================================

std::vector<NumericalODE::Solution> SystemODE::solve_rk4(
    const ODESystem& system,
    Real x0, Real xf,
    Real h) {
    
    std::vector<NumericalODE::Solution> solutions(system.equations.size());
    
    Real x = x0;
    std::vector<Real> y = system.initial_conditions;
    int n_equations = system.equations.size();
    
    int steps = static_cast<int>((xf - x0) / h) + 1;
    
    for (auto& sol : solutions) {
        sol.x.reserve(steps);
        sol.y.reserve(steps);
    }
    
    while ((h > 0 && x < xf) || (h < 0 && x > xf)) {
        // Store current values
        for (int i = 0; i < n_equations; ++i) {
            solutions[i].x.push_back(x);
            solutions[i].y.push_back(y[i]);
        }
        
        // RK4 for each equation
        std::vector<Real> k1(n_equations), k2(n_equations), 
                         k3(n_equations), k4(n_equations);
        
        // Stage 1
        for (int i = 0; i < n_equations; ++i) {
            k1[i] = system.equations[i](x, y);
        }
        
        // Stage 2
        std::vector<Real> y_temp = y;
        for (int i = 0; i < n_equations; ++i) {
            y_temp[i] = y[i] + (h/2) * k1[i];
        }
        for (int i = 0; i < n_equations; ++i) {
            k2[i] = system.equations[i](x + h/2, y_temp);
        }
        
        // Stage 3
        y_temp = y;
        for (int i = 0; i < n_equations; ++i) {
            y_temp[i] = y[i] + (h/2) * k2[i];
        }
        for (int i = 0; i < n_equations; ++i) {
            k3[i] = system.equations[i](x + h/2, y_temp);
        }
        
        // Stage 4
        y_temp = y;
        for (int i = 0; i < n_equations; ++i) {
            y_temp[i] = y[i] + h * k3[i];
        }
        for (int i = 0; i < n_equations; ++i) {
            k4[i] = system.equations[i](x + h, y_temp);
        }
        
        // Update
        for (int i = 0; i < n_equations; ++i) {
            y[i] += (h/6.0) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
        }
        
        x += h;
    }
    
    // Final values
    for (int i = 0; i < n_equations; ++i) {
        solutions[i].x.push_back(xf);
        solutions[i].y.push_back(y[i]);
    }
    
    return solutions;
}

// ============================================================================
// Placeholder implementations (TODO in future sprints)
// ============================================================================

Expr ODESolver::solve_first_order(
    std::function<Real(Real, Real)> f,
    Real x0, Real y0,
    const std::string& method) {
    
    // For now, just return a placeholder
    // In future: implement symbolic solvers for specific types
    throw std::runtime_error("Symbolic ODE solving not yet implemented. Use NumericalODE for numerical solutions.");
}

Expr LaplaceTrans::transform(Expr f, const std::string& t_var, const std::string& s_var) {
    throw std::runtime_error("Laplace transform not yet implemented");
}

Expr LaplaceTrans::inverse(Expr F, const std::string& s_var, const std::string& t_var) {
    throw std::runtime_error("Inverse Laplace transform not yet implemented");
}

} // namespace binary::ode
