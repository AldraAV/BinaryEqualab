#pragma once

#include "expression.hpp"
#include <vector>

namespace binary::calculus {

/**
 * @brief Compute derivative of expression with respect to variable
 * 
 * Implements:
 * - Power rule: d/dx(x^n) = n*x^(n-1)
 * - Product rule: d/dx(f*g) = f'*g + f*g'
 * - Quotient rule: d/dx(f/g) = (f'*g - f*g')/g^2
 * - Chain rule: d/dx(f(g(x))) = f'(g(x)) * g'(x)
 * - Function rules: d/dx(sin(x)) = cos(x), etc.
 */
class Derivative {
public:
    /**
     * Compute first derivative
     * @param expr Expression to differentiate
     * @param var Variable of differentiation
     * @return Derivative expression
     */
    static Expr compute(Expr expr, const std::string& var);
    
    /**
     * Compute n-th order derivative
     * @param expr Expression
     * @param var Variable
     * @param order Order of derivative
     * @return n-th derivative
     */
    static Expr nth_derivative(Expr expr, const std::string& var, int order);
};

/**
 * @brief Compute limit of expression as variable approaches value
 * 
 * Techniques:
 * - Direct substitution
 * - L'Hôpital's rule for 0/0 or ∞/∞
 * - Series expansion (Taylor)
 */
class Limit {
public:
    /**
     * Compute limit
     * @param expr Expression
     * @param var Variable
     * @param value Value approaching
     * @param tolerance Numerical tolerance
     * @return Limit value
     */
    static Real compute(Expr expr, const std::string& var, Real value, Real tolerance = 1e-10);
};

/**
 * @brief Symbolic integration (indefinite and definite)
 * 
 * Implements:
 * - Table of integrals (30+ standard forms)
 * - Integration by substitution
 * - Integration by parts
 * - Partial fraction decomposition
 * - Numerical integration (Simpson, Trapezoid)
 */
class Integral {
public:
    /**
     * Compute indefinite integral
     * @param expr Expression to integrate
     * @param var Variable of integration
     * @return Antiderivative (+ C implied)
     */
    static Expr indefinite(Expr expr, const std::string& var);
    
    /**
     * Compute definite integral numerically
     * @param expr Expression
     * @param var Variable
     * @param a Lower limit
     * @param b Upper limit
     * @param method "simpson" or "trapezoid"
     * @param samples Number of samples
     * @return Integral value
     */
    static Real definite(Expr expr, const std::string& var, 
                        Real a, Real b, 
                        const std::string& method = "simpson",
                        int samples = 1000);
};

/**
 * @brief Series expansions (Taylor, Maclaurin)
 */
class Series {
public:
    /**
     * Taylor series around point x0
     * @param expr Expression
     * @param var Variable
     * @param x0 Expansion point
     * @param n Number of terms
     * @return Polynomial approximation
     */
    static Expr taylor(Expr expr, const std::string& var, Real x0, int n);
    
    /**
     * Maclaurin series (Taylor around 0)
     */
    static Expr maclaurin(Expr expr, const std::string& var, int n) {
        return taylor(expr, var, 0.0, n);
    }
};

/**
 * @brief Critical point analysis and optimization
 */
class Analysis {
public:
    struct CriticalPoint {
        Real x;
        Real y;
        enum Type { MINIMUM, MAXIMUM, INFLECTION } type;
    };
    
    /**
     * Find critical points where f'(x) = 0
     * @param expr Expression
     * @param var Variable
     * @param a Lower bound
     * @param b Upper bound
     * @return Vector of critical points
     */
    static std::vector<CriticalPoint> critical_points(Expr expr, const std::string& var,
                                                       Real a, Real b);
    
    /**
     * Classify critical point (min, max, inflection)
     */
    static CriticalPoint::Type classify(Expr expr, const std::string& var, Real x);
};

} // namespace binary::calculus
