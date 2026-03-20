#pragma once

#include <Eigen/Dense>
#include <vector>
#include <complex>

namespace binary::linear {

using Matrix = Eigen::MatrixXd;
using Vector = Eigen::VectorXd;
using ComplexMatrix = Eigen::MatrixXcd;
using ComplexVector = Eigen::VectorXcd;

/**
 * @brief Linear algebra operations
 */
class LinearAlgebra {
public:
    /**
     * Determinant of matrix
     * @param A Square matrix
     * @return Determinant value
     */
    static double determinant(const Matrix& A);
    
    /**
     * Matrix inverse
     * @param A Invertible matrix
     * @return A^(-1)
     */
    static Matrix inverse(const Matrix& A);
    
    /**
     * Transpose of matrix
     */
    static Matrix transpose(const Matrix& A) {
        return A.transpose();
    }
    
    /**
     * Matrix rank (using SVD)
     */
    static int rank(const Matrix& A);
    
    /**
     * Trace (sum of diagonal)
     */
    static double trace(const Matrix& A) {
        return A.trace();
    }
};

/**
 * @brief Matrix decompositions
 */
class Decomposition {
public:
    struct LU {
        Matrix L;
        Matrix U;
    };
    
    struct QR {
        Matrix Q;
        Matrix R;
    };
    
    struct SVD {
        Matrix U;
        Vector singular_values;
        Matrix V;
    };
    
    struct EigenDecomposition {
        Vector eigenvalues;
        ComplexMatrix eigenvectors;
    };
    
    /**
     * LU decomposition (Gaussian elimination)
     * A = LU where L is lower triangular, U is upper triangular
     */
    static LU lu(const Matrix& A);
    
    /**
     * QR decomposition (Gram-Schmidt)
     * A = QR where Q is orthogonal, R is upper triangular
     */
    static QR qr(const Matrix& A);
    
    /**
     * Singular Value Decomposition
     * A = U * Σ * V^T
     */
    static SVD svd(const Matrix& A);
    
    /**
     * Eigenvalue decomposition
     * A = P * Λ * P^(-1)
     */
    static EigenDecomposition eigen(const Matrix& A);
    
    /**
     * Diagonalize matrix (if possible)
     * @return Diagonal matrix of eigenvalues
     */
    static Matrix diagonalize(const Matrix& A);
};

/**
 * @brief Vector operations
 */
class VectorOps {
public:
    /**
     * Dot product (inner product)
     */
    static double dot(const Vector& a, const Vector& b);
    
    /**
     * Cross product (3D vectors)
     */
    static Vector cross(const Vector& a, const Vector& b);
    
    /**
     * Vector magnitude (L2 norm)
     */
    static double norm(const Vector& v) {
        return v.norm();
    }
    
    /**
     * Projection of a onto b: proj_b(a) = (a·b / b·b) * b
     */
    static Vector projection(const Vector& a, const Vector& b);
    
    /**
     * Gram-Schmidt orthonormalization
     */
    static std::vector<Vector> gram_schmidt(const std::vector<Vector>& vectors);
};

/**
 * @brief Solving linear systems
 */
class LinearSystem {
public:
    /**
     * Solve Ax = b using Eigen
     * @param A Coefficient matrix
     * @param b Right-hand side vector
     * @return Solution vector x
     */
    static Vector solve(const Matrix& A, const Vector& b);
    
    /**
     * Reduced Row Echelon Form (RREF)
     * Gaussian elimination with back substitution
     */
    static Matrix rref(const Matrix& A);
};

} // namespace binary::linear
