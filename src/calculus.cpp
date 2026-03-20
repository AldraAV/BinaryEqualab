#include "binary/calculus.hpp"
#include <cmath>
#include <algorithm>
#include <numeric>

namespace binary::calculus {

// ============================================================================
// Derivative Implementation
// ============================================================================

Expr Derivative::compute(Expr expr, const std::string& var) {
    // Simply use Expression's built-in derivative
    return expr->derivative(var);
}

Expr Derivative::nth_derivative(Expr expr, const std::string& var, int order) {
    Expr result = expr;
    for (int i = 0; i < order; ++i) {
        result = result->derivative(var);
    }
    return result;
}

// ============================================================================
// Limit Implementation (Numerical approximation)
// ============================================================================

Real Limit::compute(Expr expr, const std::string& var, Real value, Real tolerance) {
    // Strategy: evaluate expression at points approaching value from both sides
    // If they converge, that's the limit
    
    std::map<std::string, Real> vars;
    
    // Try direct substitution first
    vars[var] = value;
    try {
        Real result = expr->evaluate(vars);
        // Check if it's a valid number (not NaN or Inf)
        if (std::isfinite(result)) {
            return result;
        }
    } catch (...) {
        // Direct substitution failed, use numerical approach
    }
    
    // Numerical approach: squeeze from left and right
    Real eps = 1e-6;
    Real left_val = 0, right_val = 0;
    
    for (int i = 1; i <= 10; ++i) {
        try {
            vars[var] = value - eps / (1 << i);
            left_val = expr->evaluate(vars);
            
            vars[var] = value + eps / (1 << i);
            right_val = expr->evaluate(vars);
            
            if (std::abs(left_val - right_val) < tolerance) {
                return (left_val + right_val) / 2.0;
            }
        } catch (...) {
            continue;
        }
    }
    
    // If we can't compute, return NaN
    return std::numeric_limits<Real>::quiet_NaN();
}

// ============================================================================
// Integral Implementation (Numerical)
// ============================================================================

Real Integral::definite(Expr expr, const std::string& var, 
                        Real a, Real b, 
                        const std::string& method,
                        int samples) {
    if (method == "simpson") {
        // Simpson's rule: ∫ f(x)dx ≈ (h/3)[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + f(xₙ)]
        // where h = (b - a) / n
        
        Real h = (b - a) / samples;
        Real sum = 0.0;
        
        std::map<std::string, Real> vars;
        
        // f(a) + f(b)
        vars[var] = a;
        sum += expr->evaluate(vars);
        vars[var] = b;
        sum += expr->evaluate(vars);
        
        // 4 * odd indexed terms
        for (int i = 1; i < samples; i += 2) {
            vars[var] = a + i * h;
            sum += 4.0 * expr->evaluate(vars);
        }
        
        // 2 * even indexed terms  
        for (int i = 2; i < samples; i += 2) {
            vars[var] = a + i * h;
            sum += 2.0 * expr->evaluate(vars);
        }
        
        return (h / 3.0) * sum;
    }
    
    else if (method == "trapezoid") {
        // Trapezoid rule: ∫ f(x)dx ≈ (h/2)[f(x₀) + 2f(x₁) + 2f(x₂) + ... + f(xₙ)]
        
        Real h = (b - a) / samples;
        Real sum = 0.0;
        
        std::map<std::string, Real> vars;
        
        for (int i = 0; i <= samples; ++i) {
            vars[var] = a + i * h;
            Real y = expr->evaluate(vars);
            
            if (i == 0 || i == samples) {
                sum += y;
            } else {
                sum += 2.0 * y;
            }
        }
        
        return (h / 2.0) * sum;
    }
    
    throw std::runtime_error("Unknown integration method: " + method);
}

Expr Integral::indefinite(Expr expr, const std::string& var) {
    // Symbolic integration is complex - placeholder for now
    // In practice, would use techniques like:
    // - Table lookup
    // - u-substitution
    // - Integration by parts
    // - Partial fractions
    
    // For now, return a symbolic representation
    throw std::runtime_error("Symbolic integration not yet implemented. Use definite() for numerical integration.");
}

// ============================================================================
// Series Implementation
// ============================================================================

Expr Series::taylor(Expr expr, const std::string& var, Real x0, int n) {
    // Taylor series: f(x) = Σ f⁽ⁿ⁾(x₀)/n! * (x - x₀)ⁿ
    
    Expr result = num(0.0);
    Expr f = expr;
    
    std::map<std::string, Real> vars;
    vars[var] = x0;
    
    Real coeff_factorial = 1.0;
    
    for (int k = 0; k <= n; ++k) {
        // Evaluate k-th derivative at x0
        Real f_k_x0 = f->evaluate(vars);
        
        // Add term: (f^(k)(x₀) / k!) * (x - x₀)^k
        Real coeff = f_k_x0 / coeff_factorial;
        
        Expr x_minus_x0 = sub(sym(var), num(x0)); // Would need sub() helper
        Expr term = mul(num(coeff), pow(x_minus_x0, num(k)));
        result = add(result, term);
        
        // Compute next derivative
        if (k < n) {
            f = f->derivative(var);
            coeff_factorial *= (k + 1.0);
        }
    }
    
    return result;
}

// ============================================================================
// Analysis Implementation
// ============================================================================

std::vector<Analysis::CriticalPoint> Analysis::critical_points(
    Expr expr, const std::string& var,
    Real a, Real b) {
    
    std::vector<CriticalPoint> points;
    
    // Compute f'(x) symbolically
    auto f_prime = expr->derivative(var);
    
    // Scan the interval [a, b] looking for sign changes in f'(x)
    const int scan_samples = 500;
    Real step = (b - a) / scan_samples;
    
    std::map<std::string, Real> vars;
    
    Real prev_val = 0;
    bool prev_valid = false;
    
    for (int i = 0; i <= scan_samples; ++i) {
        Real x_i = a + i * step;
        vars[var] = x_i;
        
        try {
            Real val = f_prime->evaluate(vars);
            
            // Check if f'(x) ≈ 0 directly
            if (std::abs(val) < 1e-10) {
                CriticalPoint cp;
                cp.x = x_i;
                cp.y = expr->evaluate(vars);
                cp.type = classify(expr, var, x_i);
                points.push_back(cp);
                prev_valid = false;
                continue;
            }
            
            // Check sign change → root of f'(x) in (x_{i-1}, x_i)
            if (prev_valid && prev_val * val < 0) {
                // Bisection to refine
                Real lo = x_i - step;
                Real hi = x_i;
                
                for (int iter = 0; iter < 60; ++iter) {
                    Real mid = (lo + hi) / 2.0;
                    vars[var] = mid;
                    Real mid_val = f_prime->evaluate(vars);
                    
                    if (std::abs(mid_val) < 1e-12) {
                        lo = hi = mid;
                        break;
                    }
                    
                    vars[var] = lo;
                    Real lo_val = f_prime->evaluate(vars);
                    
                    if (lo_val * mid_val < 0) {
                        hi = mid;
                    } else {
                        lo = mid;
                    }
                }
                
                Real root_x = (lo + hi) / 2.0;
                vars[var] = root_x;
                
                CriticalPoint cp;
                cp.x = root_x;
                cp.y = expr->evaluate(vars);
                cp.type = classify(expr, var, root_x);
                points.push_back(cp);
            }
            
            prev_val = val;
            prev_valid = true;
        } catch (...) {
            prev_valid = false;
        }
    }
    
    return points;
}

Analysis::CriticalPoint::Type Analysis::classify(Expr expr, const std::string& var, Real x) {
    // Use second derivative test
    // f''(x) > 0 → local minimum
    // f''(x) < 0 → local maximum
    // f''(x) = 0 → possible inflection point
    
    auto f_double_prime = expr->derivative(var)->derivative(var);
    
    std::map<std::string, Real> vars;
    vars[var] = x;
    Real second_deriv = f_double_prime->evaluate(vars);
    
    if (second_deriv > 1e-9) return CriticalPoint::MINIMUM;
    if (second_deriv < -1e-9) return CriticalPoint::MAXIMUM;
    return CriticalPoint::INFLECTION;
}

} // namespace binary::calculus
