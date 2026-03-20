#include <iostream>
#include <iomanip>
#include "binary/expression.hpp"
#include "binary/calculus.hpp"
#include "binary/linear.hpp"
#include "binary/ode.hpp"

using namespace binary;
using namespace binary::calculus;
using namespace binary::linear;
using namespace binary::ode;

int main() {
    std::cout << "╔════════════════════════════════════════════════════════╗" << std::endl;
    std::cout << "║      Binary EquaLab v3.0 - Symbolic Math Engine       ║" << std::endl;
    std::cout << "║         Democratizing Advanced Mathematics            ║" << std::endl;
    std::cout << "╚════════════════════════════════════════════════════════╝" << std::endl << std::endl;

    // =======================================================================
    // DEMONSTRATION: CALCULUS
    // =======================================================================
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "1. CALCULUS - Derivatives" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    
    // Create expression: f(x) = x³ + 2*sin(x)
    auto x = sym("x");
    auto f = add(pow(x, num(3.0)), mul(num(2.0), sin(x)));
    
    std::cout << "\nFunction: f(x) = " << f->toString() << std::endl;
    
    // Compute derivative
    auto f_prime = Derivative::compute(f, "x");
    std::cout << "f'(x) = " << f_prime->toString() << std::endl;
    
    // Evaluate at x = 1
    std::map<std::string, Real> vars = {{"x", 1.0}};
    Real value_at_1 = f_prime->evaluate(vars);
    std::cout << "f'(1) = " << std::fixed << std::setprecision(6) << value_at_1 << std::endl;
    
    // =======================================================================
    // DEMONSTRATION: CALCULUS - Definite Integral
    // =======================================================================
    std::cout << "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "2. CALCULUS - Definite Integration" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    
    // Integrate x² from 0 to 1
    auto g = pow(x, num(2.0)); // g(x) = x²
    std::cout << "\nFunction: g(x) = " << g->toString() << std::endl;
    
    Real integral_result = Integral::definite(g, "x", 0.0, 1.0, "simpson", 1000);
    std::cout << "∫₀¹ x² dx (Simpson) = " << std::fixed << std::setprecision(10) << integral_result << std::endl;
    std::cout << "Exact value: 1/3 = " << (1.0/3.0) << std::endl;
    std::cout << "Error: " << std::abs(integral_result - 1.0/3.0) << std::endl;
    
    // =======================================================================
    // DEMONSTRATION: LINEAR ALGEBRA
    // =======================================================================
    std::cout << "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "3. LINEAR ALGEBRA - Matrix Operations" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    
    // Create a sample matrix
    Matrix A(2, 2);
    A << 1, 2,
         3, 4;
    
    std::cout << "\nMatrix A:\n" << A << std::endl;
    
    // Determinant
    double det_A = LinearAlgebra::determinant(A);
    std::cout << "\nDeterminant(A) = " << det_A << std::endl;
    
    // Inverse
    Matrix A_inv = LinearAlgebra::inverse(A);
    std::cout << "\nInverse(A):\n" << A_inv << std::endl;
    
    // Eigenvalues
    auto eigen_decomp = Decomposition::eigen(A);
    std::cout << "\nEigenvalues:\n" << eigen_decomp.eigenvalues << std::endl;
    
    // =======================================================================
    // DEMONSTRATION: ODE SOLVING
    // =======================================================================
    std::cout << "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "4. ODE - Numerical Solution" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    
    // Solve: dy/dx = -2xy, y(0) = 1
    // Exact solution: y = e^(-x²)
    auto f_ode = [](Real x, Real y) { return -2.0 * x * y; };
    
    auto solution = NumericalODE::rk4(f_ode, 0.0, 1.0, 1.0, 0.1);
    
    std::cout << "\nSolving: dy/dx = -2xy, y(0) = 1" << std::endl;
    std::cout << "Method: Runge-Kutta 4" << std::endl;
    std::cout << "\n    x        y(x)      y_exact    error" << std::endl;
    std::cout << "────────────────────────────────────────────" << std::endl;
    
    for (size_t i = 0; i < solution.x.size(); i += std::max(size_t(1), solution.x.size()/10)) {
        Real x_val = solution.x[i];
        Real y_val = solution.y[i];
        Real y_exact = std::exp(-x_val * x_val);
        Real error = std::abs(y_val - y_exact);
        
        std::cout << std::fixed << std::setprecision(4)
                  << std::setw(7) << x_val << "  "
                  << std::setw(9) << y_val << "  "
                  << std::setw(9) << y_exact << "  "
                  << std::setprecision(2) << std::setw(9) << error << std::endl;
    }
    
    // =======================================================================
    // SUMMARY
    // =======================================================================
    std::cout << "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    std::cout << "✓ Binary EquaLab v3.0 Engine Operational" << std::endl;
    std::cout << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" << std::endl;
    
    return 0;
}
