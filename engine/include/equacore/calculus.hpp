#pragma once

/**
 * EquaCore — Calculus Module
 * 
 * Symbolic differentiation, numerical integration, limits,
 * Taylor series, and critical point analysis.
 */

#include "expression.hpp"
#include <vector>

namespace equacore::calculus {

/**
 * @brief Symbolic differentiation
 */
class Derivative {
public:
    static Expr compute(Expr expr, const std::string& var);
    static Expr nth_derivative(Expr expr, const std::string& var, int order);
};

/**
 * @brief Numerical limit computation
 */
class Limit {
public:
    static Real compute(Expr expr, const std::string& var, Real value, Real tolerance = 1e-10);
};

/**
 * @brief Symbolic and numerical integration
 */
class Integral {
public:
    static Expr indefinite(Expr expr, const std::string& var);
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
    static Expr taylor(Expr expr, const std::string& var, Real x0, int n);
    static Expr maclaurin(Expr expr, const std::string& var, int n) {
        return taylor(expr, var, 0.0, n);
    }
};

/**
 * @brief Critical point analysis
 */
class Analysis {
public:
    struct CriticalPoint {
        Real x;
        Real y;
        enum Type { MINIMUM, MAXIMUM, INFLECTION } type;
    };
    
    static std::vector<CriticalPoint> critical_points(Expr expr, const std::string& var,
                                                       Real a, Real b);
    static CriticalPoint::Type classify(Expr expr, const std::string& var, Real x);
};

} // namespace equacore::calculus
