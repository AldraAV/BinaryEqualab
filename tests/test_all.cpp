/**
 * Binary EquaLab v3.0 — Test Suite
 * 
 * Tests for all 4 core modules:
 * 1. Expression Tree (derivatives, evaluate, toString)
 * 2. Calculus (integrals, limits, Taylor, critical points)
 * 3. Linear Algebra (det, inv, eigen, RREF)
 * 4. ODE (RK4, Euler, adaptive, systems)
 * 
 * Using a minimal assertion framework (no external deps).
 */

#include <iostream>
#include <iomanip>
#include <cmath>
#include <string>
#include <vector>
#include <functional>

#include "equacore/expression.hpp"
#include "equacore/calculus.hpp"
#include "equacore/linear.hpp"
#include "equacore/ode.hpp"
#include "equacore/stats.hpp"

using namespace equacore;
using namespace equacore::calculus;
using namespace equacore::linear;
using namespace equacore::ode;
using namespace equacore::stats;

// ============================================================================
// Minimal test framework
// ============================================================================

static int tests_passed = 0;
static int tests_failed = 0;
static int tests_total = 0;

#define ASSERT_NEAR(actual, expected, tol, msg) do { \
    tests_total++; \
    double _a = (actual), _e = (expected), _t = (tol); \
    if (std::abs(_a - _e) < _t) { \
        tests_passed++; \
    } else { \
        tests_failed++; \
        std::cerr << "  FAIL: " << msg << " | expected=" << _e << " got=" << _a \
                  << " (delta=" << std::abs(_a - _e) << ")" << std::endl; \
    } \
} while (0)

#define ASSERT_TRUE(cond, msg) do { \
    tests_total++; \
    if (cond) { \
        tests_passed++; \
    } else { \
        tests_failed++; \
        std::cerr << "  FAIL: " << msg << std::endl; \
    } \
} while (0)

#define SECTION(name) std::cout << "\n--- " << name << " ---" << std::endl;

// ============================================================================
// 1. EXPRESSION TREE TESTS
// ============================================================================

void test_expression() {
    SECTION("Expression Tree");
    
    auto x = sym("x");
    std::map<std::string, Real> vars = {{"x", 2.0}};
    
    // Test Number
    auto c = num(3.14);
    ASSERT_NEAR(c->evaluate(vars), 3.14, 1e-10, "num(3.14) evaluates to 3.14");
    
    // Test Symbol
    ASSERT_NEAR(x->evaluate(vars), 2.0, 1e-10, "sym(x) with x=2 evaluates to 2");
    
    // Test ADD
    auto sum = add(x, num(3.0));
    ASSERT_NEAR(sum->evaluate(vars), 5.0, 1e-10, "x + 3 with x=2 = 5");
    
    // Test SUBTRACT
    auto diff = sub(x, num(1.0));
    ASSERT_NEAR(diff->evaluate(vars), 1.0, 1e-10, "x - 1 with x=2 = 1");
    
    // Test MULTIPLY
    auto prod = mul(x, num(4.0));
    ASSERT_NEAR(prod->evaluate(vars), 8.0, 1e-10, "x * 4 with x=2 = 8");
    
    // Test DIVIDE
    auto quot = div(num(6.0), x);
    ASSERT_NEAR(quot->evaluate(vars), 3.0, 1e-10, "6 / x with x=2 = 3");
    
    // Test POWER
    auto pw = pow(x, num(3.0));
    ASSERT_NEAR(pw->evaluate(vars), 8.0, 1e-10, "x^3 with x=2 = 8");
    
    // Test neg
    auto nv = neg(x);
    ASSERT_NEAR(nv->evaluate(vars), -2.0, 1e-10, "neg(x) with x=2 = -2");
    
    // Test sin, cos, exp, log
    vars["x"] = 0.0;
    ASSERT_NEAR(sin(x)->evaluate(vars), 0.0, 1e-10, "sin(0) = 0");
    ASSERT_NEAR(cos(x)->evaluate(vars), 1.0, 1e-10, "cos(0) = 1");
    ASSERT_NEAR(exp(x)->evaluate(vars), 1.0, 1e-10, "exp(0) = 1");
    
    vars["x"] = 1.0;
    ASSERT_NEAR(log(x)->evaluate(vars), 0.0, 1e-10, "log(1) = 0");
    ASSERT_NEAR(sqrt(x)->evaluate(vars), 1.0, 1e-10, "sqrt(1) = 1");
    
    // Test toString
    auto f = add(pow(x, num(2.0)), mul(num(3.0), x));
    std::string s = f->toString();
    ASSERT_TRUE(s.length() > 0, "toString produces non-empty string");
}

// ============================================================================
// 2. DERIVATIVE TESTS
// ============================================================================

void test_derivatives() {
    SECTION("Derivatives");
    
    auto x = sym("x");
    std::map<std::string, Real> vars;
    
    // d/dx(5) = 0
    vars["x"] = 1.0;
    auto d1 = Derivative::compute(num(5.0), "x");
    ASSERT_NEAR(d1->evaluate(vars), 0.0, 1e-10, "d/dx(5) = 0");
    
    // d/dx(x) = 1
    auto d2 = Derivative::compute(x, "x");
    ASSERT_NEAR(d2->evaluate(vars), 1.0, 1e-10, "d/dx(x) = 1");
    
    // d/dx(x^2) = 2x => at x=3 => 6
    vars["x"] = 3.0;
    auto d3 = Derivative::compute(pow(x, num(2.0)), "x");
    ASSERT_NEAR(d3->evaluate(vars), 6.0, 1e-10, "d/dx(x^2) at x=3 = 6");
    
    // d/dx(x^3) = 3x^2 => at x=2 => 12
    vars["x"] = 2.0;
    auto d4 = Derivative::compute(pow(x, num(3.0)), "x");
    ASSERT_NEAR(d4->evaluate(vars), 12.0, 1e-10, "d/dx(x^3) at x=2 = 12");
    
    // d/dx(sin(x)) = cos(x) => at x=0 => 1
    vars["x"] = 0.0;
    auto d5 = Derivative::compute(sin(x), "x");
    ASSERT_NEAR(d5->evaluate(vars), 1.0, 1e-10, "d/dx(sin(x)) at x=0 = cos(0) = 1");
    
    // d/dx(cos(x)) = -sin(x) => at x=pi/2 => -1
    vars["x"] = M_PI / 2.0;
    auto d6 = Derivative::compute(cos(x), "x");
    ASSERT_NEAR(d6->evaluate(vars), -1.0, 1e-10, "d/dx(cos(x)) at x=pi/2 = -1");
    
    // d/dx(e^x) = e^x => at x=1 => e
    vars["x"] = 1.0;
    auto d7 = Derivative::compute(exp(x), "x");
    ASSERT_NEAR(d7->evaluate(vars), std::exp(1.0), 1e-10, "d/dx(e^x) at x=1 = e");
    
    // d/dx(ln(x)) = 1/x => at x=2 => 0.5
    vars["x"] = 2.0;
    auto d8 = Derivative::compute(log(x), "x");
    ASSERT_NEAR(d8->evaluate(vars), 0.5, 1e-10, "d/dx(ln(x)) at x=2 = 0.5");
    
    // Product rule: d/dx(x * sin(x)) = sin(x) + x*cos(x) => at x=0 => 0+0=0
    vars["x"] = 0.0;
    auto d9 = Derivative::compute(mul(x, sin(x)), "x");
    ASSERT_NEAR(d9->evaluate(vars), 0.0, 1e-10, "d/dx(x*sin(x)) at x=0 = 0");
    
    // Quotient rule: d/dx(x / (x+1)) at x=1 => 1/(x+1)^2 = 1/4
    vars["x"] = 1.0;
    auto d10 = Derivative::compute(div(x, add(x, num(1.0))), "x");
    ASSERT_NEAR(d10->evaluate(vars), 0.25, 1e-6, "d/dx(x/(x+1)) at x=1 = 0.25");
    
    // Subtraction: d/dx(x^2 - 3x) = 2x - 3 => at x=5 => 7
    vars["x"] = 5.0;
    auto d11 = Derivative::compute(sub(pow(x, num(2.0)), mul(num(3.0), x)), "x");
    ASSERT_NEAR(d11->evaluate(vars), 7.0, 1e-10, "d/dx(x^2 - 3x) at x=5 = 7");
    
    // Second derivative: d²/dx²(x^3) = 6x => at x=4 => 24
    vars["x"] = 4.0;
    auto d12 = Derivative::nth_derivative(pow(x, num(3.0)), "x", 2);
    ASSERT_NEAR(d12->evaluate(vars), 24.0, 1e-8, "d2/dx2(x^3) at x=4 = 24");
    
    // Chain rule: d/dx(sin(x^2)) = 2x*cos(x^2) => at x=0 => 0
    vars["x"] = 0.0;
    auto d13 = Derivative::compute(sin(pow(x, num(2.0))), "x");
    ASSERT_NEAR(d13->evaluate(vars), 0.0, 1e-10, "d/dx(sin(x^2)) at x=0 = 0");
}

// ============================================================================
// 3. INTEGRATION TESTS
// ============================================================================

void test_integrals() {
    SECTION("Definite Integrals");
    
    auto x = sym("x");
    
    // ∫₀¹ x² dx = 1/3
    Real r1 = Integral::definite(pow(x, num(2.0)), "x", 0, 1, "simpson", 1000);
    ASSERT_NEAR(r1, 1.0/3.0, 1e-8, "∫₀¹ x² dx = 1/3");
    
    // ∫₀¹ x³ dx = 1/4
    Real r2 = Integral::definite(pow(x, num(3.0)), "x", 0, 1, "simpson", 1000);
    ASSERT_NEAR(r2, 0.25, 1e-8, "∫₀¹ x³ dx = 1/4");
    
    // ∫₀^π sin(x) dx = 2
    Real r3 = Integral::definite(sin(x), "x", 0, M_PI, "simpson", 1000);
    ASSERT_NEAR(r3, 2.0, 1e-6, "∫₀^π sin(x) dx = 2");
    
    // ∫₀¹ e^x dx = e - 1
    Real r4 = Integral::definite(exp(x), "x", 0, 1, "simpson", 1000);
    ASSERT_NEAR(r4, std::exp(1.0) - 1.0, 1e-6, "∫₀¹ e^x dx = e-1");
    
    // ∫₁² 1/x dx = ln(2)
    Real r5 = Integral::definite(pow(x, num(-1.0)), "x", 1, 2, "simpson", 1000);
    ASSERT_NEAR(r5, std::log(2.0), 1e-6, "∫₁² 1/x dx = ln(2)");
    
    // Trapezoid: ∫₀¹ x² dx = 1/3
    Real r6 = Integral::definite(pow(x, num(2.0)), "x", 0, 1, "trapezoid", 10000);
    ASSERT_NEAR(r6, 1.0/3.0, 1e-4, "∫₀¹ x² dx (trapezoid) ≈ 1/3");
}

// ============================================================================
// 4. LIMIT TESTS
// ============================================================================

void test_limits() {
    SECTION("Limits");
    
    auto x = sym("x");
    
    // lim(x→2) x² = 4
    Real l1 = Limit::compute(pow(x, num(2.0)), "x", 2.0);
    ASSERT_NEAR(l1, 4.0, 1e-6, "lim(x→2) x² = 4");
    
    // lim(x→0) sin(x)/x = 1 (indeterminate 0/0)
    Real l2 = Limit::compute(div(sin(x), x), "x", 0.0);
    ASSERT_NEAR(l2, 1.0, 1e-4, "lim(x→0) sin(x)/x = 1");
    
    // lim(x→0) (e^x - 1)/x = 1
    Real l3 = Limit::compute(div(sub(exp(x), num(1.0)), x), "x", 0.0);
    ASSERT_NEAR(l3, 1.0, 1e-4, "lim(x→0) (e^x-1)/x = 1");
}

// ============================================================================
// 5. CRITICAL POINTS TESTS
// ============================================================================

void test_critical_points() {
    SECTION("Critical Points");
    
    auto x = sym("x");
    
    // f(x) = x² has minimum at x=0
    auto pts1 = Analysis::critical_points(pow(x, num(2.0)), "x", -5.0, 5.0);
    ASSERT_TRUE(pts1.size() >= 1, "x² has at least 1 critical point");
    if (pts1.size() >= 1) {
        ASSERT_NEAR(pts1[0].x, 0.0, 0.05, "x² minimum at x≈0");
        ASSERT_TRUE(pts1[0].type == Analysis::CriticalPoint::MINIMUM, "x² critical point is MIN");
    }
    
    // f(x) = -x² has maximum at x=0
    auto pts2 = Analysis::critical_points(neg(pow(x, num(2.0))), "x", -5.0, 5.0);
    ASSERT_TRUE(pts2.size() >= 1, "-x² has at least 1 critical point");
    if (pts2.size() >= 1) {
        ASSERT_NEAR(pts2[0].x, 0.0, 0.05, "-x² maximum at x≈0");
        ASSERT_TRUE(pts2[0].type == Analysis::CriticalPoint::MAXIMUM, "-x² critical point is MAX");
    }
    
    // f(x) = x³ - 3x has critical points at x = ±1
    auto f3 = sub(pow(x, num(3.0)), mul(num(3.0), x));
    auto pts3 = Analysis::critical_points(f3, "x", -5.0, 5.0);
    ASSERT_TRUE(pts3.size() >= 2, "x³-3x has 2 critical points");
}

// ============================================================================
// 6. LINEAR ALGEBRA TESTS
// ============================================================================

void test_linear_algebra() {
    SECTION("Linear Algebra");
    
    // 2x2 determinant
    Matrix A(2, 2);
    A << 1, 2, 3, 4;
    ASSERT_NEAR(LinearAlgebra::determinant(A), -2.0, 1e-10, "det([1 2; 3 4]) = -2");
    
    // 2x2 inverse
    Matrix A_inv = LinearAlgebra::inverse(A);
    Matrix identity = A * A_inv;
    ASSERT_NEAR(identity(0,0), 1.0, 1e-10, "A * A^-1 = I (0,0)");
    ASSERT_NEAR(identity(0,1), 0.0, 1e-10, "A * A^-1 = I (0,1)");
    ASSERT_NEAR(identity(1,0), 0.0, 1e-10, "A * A^-1 = I (1,0)");
    ASSERT_NEAR(identity(1,1), 1.0, 1e-10, "A * A^-1 = I (1,1)");
    
    // 3x3 rank
    Matrix B(3, 3);
    B << 1, 2, 3, 4, 5, 6, 7, 8, 9;
    ASSERT_TRUE(LinearAlgebra::rank(B) == 2, "rank([1..9] 3x3) = 2");
    
    // Solve Ax = b
    Matrix C(2, 2);
    C << 3, 2, 1, 4;
    Vector b(2);
    b << 8, 6;
    Vector x_sol = LinearSystem::solve(C, b);
    ASSERT_NEAR(x_sol(0), 2.0, 1e-10, "Solve: x = 2");
    ASSERT_NEAR(x_sol(1), 1.0, 1e-10, "Solve: y = 1");
    
    // Dot product
    Vector u(3), v(3);
    u << 1, 2, 3;
    v << 4, 5, 6;
    ASSERT_NEAR(VectorOps::dot(u, v), 32.0, 1e-10, "dot([1,2,3], [4,5,6]) = 32");
    
    // Cross product
    Vector cross_result = VectorOps::cross(u, v);
    ASSERT_NEAR(cross_result(0), -3.0, 1e-10, "cross x = -3");
    ASSERT_NEAR(cross_result(1), 6.0, 1e-10, "cross y = 6");
    ASSERT_NEAR(cross_result(2), -3.0, 1e-10, "cross z = -3");
    
    // RREF
    Matrix aug(2, 3);
    aug << 1, 2, 5, 3, 4, 11;
    Matrix rref_result = LinearSystem::rref(aug);
    ASSERT_NEAR(rref_result(0, 2), 1.0, 1e-10, "RREF: x = 1");
    ASSERT_NEAR(rref_result(1, 2), 2.0, 1e-10, "RREF: y = 2");
}

// ============================================================================
// 7. ODE TESTS
// ============================================================================

void test_ode() {
    SECTION("ODE Solvers");
    
    // dy/dx = -2xy, y(0) = 1 => exact: y = e^(-x²)
    auto f = [](Real x, Real y) { return -2.0 * x * y; };
    
    // RK4
    auto sol_rk4 = NumericalODE::rk4(f, 0.0, 1.0, 1.0, 0.01);
    Real y_rk4_final = sol_rk4.y.back();
    Real y_exact = std::exp(-1.0);
    ASSERT_NEAR(y_rk4_final, y_exact, 1e-6, "RK4: dy/dx=-2xy at x=1 ≈ e^-1");
    
    // Euler (less precise)
    auto sol_euler = NumericalODE::euler(f, 0.0, 1.0, 1.0, 0.001);
    Real y_euler_final = sol_euler.y.back();
    ASSERT_NEAR(y_euler_final, y_exact, 1e-2, "Euler: dy/dx=-2xy at x=1 ≈ e^-1");
    
    // Adaptive RK4
    auto sol_adapt = NumericalODE::adaptive_rk4(f, 0.0, 1.0, 1.0, 1e-8);
    Real y_adapt_final = sol_adapt.y.back();
    ASSERT_NEAR(y_adapt_final, y_exact, 1e-6, "Adaptive RK4: dy/dx=-2xy at x=1 ≈ e^-1");
    
    // Simple exponential: dy/dx = y, y(0)=1 => y=e^x
    auto f2 = [](Real x, Real y) { return y; };
    auto sol2 = NumericalODE::rk4(f2, 0.0, 1.0, 1.0, 0.01);
    ASSERT_NEAR(sol2.y.back(), std::exp(1.0), 1e-6, "RK4: dy/dx=y at x=1 ≈ e");
    
    // System of ODEs: dy1/dx = y2, dy2/dx = -y1
    // y1(0)=1, y2(0)=0 => y1=cos(x), y2=sin(x) (wrong sign but close)
    // Actually: y1=cos(x), y2=-sin(x) for this system
    SystemODE::ODESystem system;
    system.equations = {
        [](Real x, const std::vector<Real>& y) { return y[1]; },
        [](Real x, const std::vector<Real>& y) { return -y[0]; }
    };
    system.initial_conditions = {1.0, 0.0};
    
    auto sys_sol = SystemODE::solve_rk4(system, 0.0, M_PI, 0.01);
    // At x=π: y1=cos(π)=-1, y2=-sin(π)=0
    ASSERT_NEAR(sys_sol[0].y.back(), -1.0, 1e-4, "System: y1(π)=cos(π)=-1");
    ASSERT_NEAR(sys_sol[1].y.back(), 0.0, 1e-3, "System: y2(π)=-sin(π)≈0");
}

// ============================================================================
// MAIN
// ============================================================================

int main() {
    std::cout << "╔══════════════════════════════════════════════╗" << std::endl;
    std::cout << "║    Binary EquaLab v3.0 — Test Suite         ║" << std::endl;
    std::cout << "╚══════════════════════════════════════════════╝" << std::endl;
    
    test_expression();
    test_derivatives();
    test_integrals();
    test_limits();
    test_critical_points();
    test_linear_algebra();
    test_ode();
    
    std::cout << "\n════════════════════════════════════════════════" << std::endl;
    std::cout << "Results: " << tests_passed << "/" << tests_total << " passed";
    if (tests_failed > 0) {
        std::cout << " (" << tests_failed << " FAILED)";
    }
    std::cout << std::endl;
    std::cout << "════════════════════════════════════════════════" << std::endl;
    
    return tests_failed > 0 ? 1 : 0;
}
