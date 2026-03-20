#include "binary/expression.hpp"
#include <cmath>
#include <sstream>
#include <stdexcept>

namespace binary {

// ============================================================================
// Number Implementation
// ============================================================================

std::string Number::toString() const {
    std::ostringstream oss;
    oss << value_;
    return oss.str();
}

Expr Number::derivative(const std::string& var) const {
    // d/dx(c) = 0
    return num(0.0);
}

// ============================================================================
// Symbol Implementation
// ============================================================================

Expr Symbol::derivative(const std::string& var) const {
    // d/dx(x) = 1, d/dx(y) = 0 (if var != y)
    return name_ == var ? num(1.0) : num(0.0);
}

Real Symbol::evaluate(const std::map<std::string, Real>& vars) const {
    auto it = vars.find(name_);
    if (it != vars.end()) {
        return it->second;
    }
    throw std::runtime_error("Variable '" + name_ + "' not found in evaluation context");
}

// ============================================================================
// BinaryOp Implementation
// ============================================================================

std::string BinaryOp::toString() const {
    std::string op_str;
    switch (op_) {
        case Type::ADD:      op_str = "+"; break;
        case Type::SUBTRACT: op_str = "-"; break;
        case Type::MULTIPLY: op_str = "*"; break;
        case Type::DIVIDE:   op_str = "/"; break;
        case Type::POWER:    op_str = "^"; break;
        default: op_str = "?";
    }
    return "(" + left_->toString() + " " + op_str + " " + right_->toString() + ")";
}

Real BinaryOp::evaluate(const std::map<std::string, Real>& vars) const {
    Real l = left_->evaluate(vars);
    Real r = right_->evaluate(vars);
    
    switch (op_) {
        case Type::ADD:
            return l + r;
        case Type::SUBTRACT:
            return l - r;
        case Type::MULTIPLY:
            return l * r;
        case Type::DIVIDE:
            if (std::abs(r) < 1e-15) {
                throw std::runtime_error("Division by zero");
            }
            return l / r;
        case Type::POWER:
            return std::pow(l, r);
        default:
            throw std::runtime_error("Unknown binary operation");
    }
}

Expr BinaryOp::derivative(const std::string& var) const {
    switch (op_) {
        case Type::ADD: {
            // (f + g)' = f' + g'
            auto f_prime = left_->derivative(var);
            auto g_prime = right_->derivative(var);
            return add(f_prime, g_prime);
        }
        
        case Type::SUBTRACT: {
            // (f - g)' = f' - g'
            auto f_prime = left_->derivative(var);
            auto g_prime = right_->derivative(var);
            return sub(f_prime, g_prime);
        }
        
        case Type::MULTIPLY: {
            // (f * g)' = f' * g + f * g'  [Product Rule]
            auto f = left_;
            auto g = right_;
            auto f_prime = f->derivative(var);
            auto g_prime = g->derivative(var);
            return add(mul(f_prime, g), mul(f, g_prime));
        }
        
        case Type::DIVIDE: {
            // (f / g)' = (f' * g - f * g') / g²  [Quotient Rule]
            auto f = left_;
            auto g = right_;
            auto f_prime = f->derivative(var);
            auto g_prime = g->derivative(var);
            return div(sub(mul(f_prime, g), mul(f, g_prime)), pow(g, num(2.0)));
        }
        
        case Type::POWER: {
            // (f ^ n)' = n * f^(n-1) * f'  [Chain Rule + Power Rule]
            auto f = left_;
            auto n = right_;
            auto f_prime = f->derivative(var);
            return mul(mul(n, pow(f, sub(n, num(1.0)))), f_prime);
        }
        
        default:
            throw std::runtime_error("Derivative not implemented for this operation");
    }
}

// ============================================================================
// Function Implementation
// ============================================================================

std::string Function::toString() const {
    return name_ + "(" + arg_->toString() + ")";
}

Real Function::evaluate(const std::map<std::string, Real>& vars) const {
    Real x = arg_->evaluate(vars);
    
    if (name_ == "sin")  return std::sin(x);
    if (name_ == "cos")  return std::cos(x);
    if (name_ == "tan")  return std::tan(x);
    if (name_ == "exp")  return std::exp(x);
    if (name_ == "log")  return std::log(x);
    if (name_ == "sqrt") return std::sqrt(x);
    if (name_ == "abs")  return std::abs(x);
    if (name_ == "asin") return std::asin(x);
    if (name_ == "acos") return std::acos(x);
    if (name_ == "atan") return std::atan(x);
    if (name_ == "sinh") return std::sinh(x);
    if (name_ == "cosh") return std::cosh(x);
    if (name_ == "tanh") return std::tanh(x);
    
    throw std::runtime_error("Unknown function: " + name_);
}

Expr Function::derivative(const std::string& var) const {
    auto u = arg_;
    auto u_prime = u->derivative(var);
    
    // All use chain rule: d/dx(f(u)) = f'(u) * u'
    
    if (name_ == "sin") {
        // d/dx(sin(u)) = cos(u) * u'
        return mul(cos(u), u_prime);
    }
    if (name_ == "cos") {
        // d/dx(cos(u)) = -sin(u) * u'
        return mul(mul(num(-1.0), sin(u)), u_prime);
    }
    if (name_ == "tan") {
        // d/dx(tan(u)) = sec²(u) * u' = 1/cos²(u) * u'
        auto cos_u = cos(u);
        return mul(pow(cos_u, num(-2.0)), u_prime);
    }
    if (name_ == "exp") {
        // d/dx(e^u) = e^u * u'
        return mul(exp(u), u_prime);
    }
    if (name_ == "log") {
        // d/dx(ln(u)) = u'/u
        return mul(pow(u, num(-1.0)), u_prime);
    }
    if (name_ == "sqrt") {
        // d/dx(√u) = 1/(2√u) * u'
        return mul(pow(mul(num(2.0), sqrt(u)), num(-1.0)), u_prime);
    }
    
    throw std::runtime_error("Derivative not implemented for function: " + name_);
}

// ============================================================================
// Helper Factory Functions
// ============================================================================

Expr num(Real value) {
    return std::make_shared<Number>(value);
}

Expr sym(const std::string& name) {
    return std::make_shared<Symbol>(name);
}

Expr add(Expr a, Expr b) {
    return std::make_shared<BinaryOp>(a, b, Expression::Type::ADD);
}

Expr sub(Expr a, Expr b) {
    return std::make_shared<BinaryOp>(a, b, Expression::Type::SUBTRACT);
}

Expr mul(Expr a, Expr b) {
    return std::make_shared<BinaryOp>(a, b, Expression::Type::MULTIPLY);
}

Expr div(Expr a, Expr b) {
    return std::make_shared<BinaryOp>(a, b, Expression::Type::DIVIDE);
}

Expr pow(Expr base, Expr exp) {
    return std::make_shared<BinaryOp>(base, exp, Expression::Type::POWER);
}

Expr neg(Expr a) {
    return mul(num(-1.0), a);
}

Expr sin(Expr x) {
    return std::make_shared<Function>("sin", x);
}

Expr cos(Expr x) {
    return std::make_shared<Function>("cos", x);
}

Expr tan(Expr x) {
    return std::make_shared<Function>("tan", x);
}

Expr exp(Expr x) {
    return std::make_shared<Function>("exp", x);
}

Expr log(Expr x) {
    return std::make_shared<Function>("log", x);
}

Expr sqrt(Expr x) {
    return std::make_shared<Function>("sqrt", x);
}

Expr abs(Expr x) {
    return std::make_shared<Function>("abs", x);
}

} // namespace binary
