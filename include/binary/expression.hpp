#pragma once

#include <string>
#include <vector>
#include <memory>
#include <map>
#include <complex>
#include <variant>
#include <Eigen/Dense>

namespace binary {

// Forward declarations
class Expression;
class Symbol;
class Number;

using Expr = std::shared_ptr<Expression>;
using Real = double;
using Complex = std::complex<double>;

/**
 * @brief Base class for all mathematical expressions
 * 
 * Supports: numbers, symbols, operations, functions
 * Tree-based representation for symbolic computation
 */
class Expression {
public:
    enum class Type {
        NUMBER,
        SYMBOL,
        ADD,
        SUBTRACT,
        MULTIPLY,
        DIVIDE,
        POWER,
        FUNCTION,
        DERIVATIVE,
        INTEGRAL
    };

    virtual ~Expression() = default;
    virtual Type type() const = 0;
    virtual std::string toString() const = 0;
    virtual Expr derivative(const std::string& var) const = 0;
    virtual Real evaluate(const std::map<std::string, Real>& vars = {}) const = 0;
};

/**
 * @brief Number literal (constant)
 */
class Number : public Expression {
    Real value_;

public:
    explicit Number(Real value) : value_(value) {}
    
    Type type() const override { return Type::NUMBER; }
    std::string toString() const override;
    Expr derivative(const std::string& var) const override;
    Real evaluate(const std::map<std::string, Real>& vars = {}) const override { return value_; }
    Real value() const { return value_; }
};

/**
 * @brief Variable/Symbol (x, y, t, etc.)
 */
class Symbol : public Expression {
    std::string name_;

public:
    explicit Symbol(const std::string& name) : name_(name) {}
    
    Type type() const override { return Type::SYMBOL; }
    std::string toString() const override { return name_; }
    Expr derivative(const std::string& var) const override;
    Real evaluate(const std::map<std::string, Real>& vars = {}) const override;
    const std::string& name() const { return name_; }
};

/**
 * @brief Binary operations (f + g, f - g, f * g, f / g, f ^ g)
 */
class BinaryOp : public Expression {
    Expr left_;
    Expr right_;
    Type op_;

public:
    BinaryOp(Expr left, Expr right, Type op) 
        : left_(left), right_(right), op_(op) {}
    
    Type type() const override { return op_; }
    std::string toString() const override;
    Expr derivative(const std::string& var) const override;
    Real evaluate(const std::map<std::string, Real>& vars = {}) const override;
    
    Expr left() const { return left_; }
    Expr right() const { return right_; }
};

/**
 * @brief Mathematical functions (sin, cos, exp, log, etc.)
 */
class Function : public Expression {
    std::string name_;
    Expr arg_;

public:
    Function(const std::string& name, Expr arg) 
        : name_(name), arg_(arg) {}
    
    Type type() const override { return Type::FUNCTION; }
    std::string toString() const override;
    Expr derivative(const std::string& var) const override;
    Real evaluate(const std::map<std::string, Real>& vars = {}) const override;
    
    const std::string& name() const { return name_; }
    Expr arg() const { return arg_; }
};

// Helpers to create expressions
Expr num(Real value);
Expr sym(const std::string& name);
Expr add(Expr a, Expr b);
Expr sub(Expr a, Expr b);
Expr mul(Expr a, Expr b);
Expr div(Expr a, Expr b);
Expr pow(Expr base, Expr exp);
Expr neg(Expr a);  // unary minus: -a
Expr sin(Expr x);
Expr cos(Expr x);
Expr tan(Expr x);
Expr exp(Expr x);
Expr log(Expr x);
Expr sqrt(Expr x);
Expr abs(Expr x);

} // namespace binary
