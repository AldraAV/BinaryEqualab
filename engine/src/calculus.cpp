#include "equacore/calculus.hpp"
#include <cmath>
#include <algorithm>
#include <numeric>

namespace equacore::calculus {

// ============================================================================
// Derivative
// ============================================================================

Expr Derivative::compute(Expr expr, const std::string& var) {
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
// Limit (Numerical approximation)
// ============================================================================

Real Limit::compute(Expr expr, const std::string& var, Real value, Real tolerance) {
    std::map<std::string, Real> vars;
    
    // Direct substitution first
    vars[var] = value;
    try {
        Real result = expr->evaluate(vars);
        if (std::isfinite(result)) {
            return result;
        }
    } catch (...) {}
    
    // Numerical squeeze from left and right
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
    
    return std::numeric_limits<Real>::quiet_NaN();
}

// ============================================================================
// Integral (Numerical)
// ============================================================================

Real Integral::definite(Expr expr, const std::string& var, 
                        Real a, Real b, 
                        const std::string& method,
                        int samples) {
    if (method == "simpson") {
        Real h = (b - a) / samples;
        Real sum = 0.0;
        std::map<std::string, Real> vars;
        
        vars[var] = a;
        sum += expr->evaluate(vars);
        vars[var] = b;
        sum += expr->evaluate(vars);
        
        for (int i = 1; i < samples; i += 2) {
            vars[var] = a + i * h;
            sum += 4.0 * expr->evaluate(vars);
        }
        for (int i = 2; i < samples; i += 2) {
            vars[var] = a + i * h;
            sum += 2.0 * expr->evaluate(vars);
        }
        
        return (h / 3.0) * sum;
    }
    
    else if (method == "trapezoid") {
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
    // Basic Pattern Matching Integrator (Sprint 1 Table)
    
    // 1. Integral of a constant: c -> c*x
    if (expr->type() == Expression::Type::NUMBER) {
        return mul(expr, sym(var));
    }
    
    // 2. Integral of the variable: var -> (var^2)/2
    if (expr->type() == Expression::Type::SYMBOL) {
        auto symb = std::dynamic_pointer_cast<Symbol>(expr);
        if (symb->name() == var) {
            return div(pow(expr, num(2.0)), num(2.0));
        } else {
            // It's a different variable (treated as constant)
            return mul(expr, sym(var));
        }
    }
    
    // 3. Linearity: Integral of f + g = Integral of f + Integral of g
    if (expr->type() == Expression::Type::ADD) {
        auto op = std::dynamic_pointer_cast<BinaryOp>(expr);
        return add(indefinite(op->left(), var), indefinite(op->right(), var));
    }
    
    if (expr->type() == Expression::Type::SUBTRACT) {
        auto op = std::dynamic_pointer_cast<BinaryOp>(expr);
        return sub(indefinite(op->left(), var), indefinite(op->right(), var));
    }
    
    // 4. Constant multiple rule: Integral of c * f(x) = c * Integral of f(x)
    if (expr->type() == Expression::Type::MULTIPLY) {
        auto op = std::dynamic_pointer_cast<BinaryOp>(expr);
        bool left_is_c = (op->left()->derivative(var)->type() == Expression::Type::NUMBER && 
                         op->left()->derivative(var)->evaluate() == 0.0);
        bool right_is_c = (op->right()->derivative(var)->type() == Expression::Type::NUMBER && 
                          op->right()->derivative(var)->evaluate() == 0.0);
                          
        if (left_is_c) {
            return mul(op->left(), indefinite(op->right(), var));
        } else if (right_is_c) {
            return mul(op->right(), indefinite(op->left(), var));
        }
    }
    
    // 5. Power Rule: Integral of x^n = x^(n+1)/(n+1)
    if (expr->type() == Expression::Type::POWER) {
        auto op = std::dynamic_pointer_cast<BinaryOp>(expr);
        auto base = std::dynamic_pointer_cast<Symbol>(op->left());
        
        if (base && base->name() == var) {
            // If n = -1 -> log(x)
            if (op->right()->type() == Expression::Type::NUMBER && 
                std::abs(op->right()->evaluate() + 1.0) < 1e-9) {
                return log(abs(base));
            }
            
            // General power rule
            Expr n_plus_1 = add(op->right(), num(1.0));
            return div(pow(base, n_plus_1), n_plus_1);
        }
    }
    
    // 6. Basic Functions
    if (expr->type() == Expression::Type::FUNCTION) {
        auto func = std::dynamic_pointer_cast<Function>(expr);
        auto arg = std::dynamic_pointer_cast<Symbol>(func->arg());
        
        // Only matching f(x), not f(g(x)) for now
        if (arg && arg->name() == var) {
            if (func->name() == "sin") return mul(num(-1.0), cos(arg)); // -cos(x)
            if (func->name() == "cos") return sin(arg);                 // sin(x)
            if (func->name() == "exp") return exp(arg);                 // e^x
        }
    }
    
    // 7. Inverse: 1/x -> log(abs(x))
    if (expr->type() == Expression::Type::DIVIDE) {
        auto op = std::dynamic_pointer_cast<BinaryOp>(expr);
        auto base = std::dynamic_pointer_cast<Symbol>(op->right());
        
        // c / x
        if (base && base->name() == var) {
            bool left_is_c = (op->left()->derivative(var)->type() == Expression::Type::NUMBER && 
                             op->left()->derivative(var)->evaluate() == 0.0);
            if (left_is_c) {
                return mul(op->left(), log(abs(base)));
            }
        }
    }

    throw std::runtime_error("Indefinite integral pattern not recognized by EquaCore. Fallback to Maxima required.");
}

// ============================================================================
// Series
// ============================================================================

Expr Series::taylor(Expr expr, const std::string& var, Real x0, int n) {
    Expr result = num(0.0);
    Expr f = expr;
    
    std::map<std::string, Real> vars;
    vars[var] = x0;
    
    Real coeff_factorial = 1.0;
    
    for (int k = 0; k <= n; ++k) {
        Real f_k_x0 = f->evaluate(vars);
        Real coeff = f_k_x0 / coeff_factorial;
        
        Expr x_minus_x0 = sub(sym(var), num(x0));
        Expr term = mul(num(coeff), pow(x_minus_x0, num(k)));
        result = add(result, term);
        
        if (k < n) {
            f = f->derivative(var);
            coeff_factorial *= (k + 1.0);
        }
    }
    
    return result;
}

// ============================================================================
// Analysis — Critical Points via Bisection
// ============================================================================

std::vector<Analysis::CriticalPoint> Analysis::critical_points(
    Expr expr, const std::string& var,
    Real a, Real b) {
    
    std::vector<CriticalPoint> points;
    auto f_prime = expr->derivative(var);
    
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
            
            if (std::abs(val) < 1e-10) {
                CriticalPoint cp;
                cp.x = x_i;
                cp.y = expr->evaluate(vars);
                cp.type = classify(expr, var, x_i);
                points.push_back(cp);
                prev_valid = false;
                continue;
            }
            
            if (prev_valid && prev_val * val < 0) {
                // Bisection refinement
                Real lo = x_i - step;
                Real hi = x_i;
                
                for (int iter = 0; iter < 60; ++iter) {
                    Real mid = (lo + hi) / 2.0;
                    vars[var] = mid;
                    Real mid_val = f_prime->evaluate(vars);
                    
                    if (std::abs(mid_val) < 1e-12) { lo = hi = mid; break; }
                    
                    vars[var] = lo;
                    Real lo_val = f_prime->evaluate(vars);
                    
                    if (lo_val * mid_val < 0) { hi = mid; } 
                    else { lo = mid; }
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
    auto f_double_prime = expr->derivative(var)->derivative(var);
    
    std::map<std::string, Real> vars;
    vars[var] = x;
    Real second_deriv = f_double_prime->evaluate(vars);
    
    if (second_deriv > 1e-9) return CriticalPoint::MINIMUM;
    if (second_deriv < -1e-9) return CriticalPoint::MAXIMUM;
    return CriticalPoint::INFLECTION;
}

} // namespace equacore::calculus
