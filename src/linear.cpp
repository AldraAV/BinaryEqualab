#include "binary/linear.hpp"
#include <Eigen/SVD>
#include <Eigen/Eigenvalues>
#include <stdexcept>
#include <cmath>

namespace binary::linear {

// ============================================================================
// LinearAlgebra Implementation
// ============================================================================

double LinearAlgebra::determinant(const Matrix& A) {
    if (A.rows() != A.cols()) {
        throw std::runtime_error("Determinant requires square matrix");
    }
    return A.determinant();
}

Matrix LinearAlgebra::inverse(const Matrix& A) {
    if (A.rows() != A.cols()) {
        throw std::runtime_error("Inverse requires square matrix");
    }
    if (std::abs(A.determinant()) < 1e-10) {
        throw std::runtime_error("Matrix is singular (determinant ≈ 0), inverse does not exist");
    }
    return A.inverse();
}

int LinearAlgebra::rank(const Matrix& A) {
    Eigen::JacobiSVD<Matrix> svd(A);
    return svd.rank();
}

// ============================================================================
// Decomposition Implementation
// ============================================================================

Decomposition::LU Decomposition::lu(const Matrix& A) {
    Eigen::FullPivLU<Matrix> lu(A);
    
    // Extract L and U from the computed factorization
    Matrix L = Matrix::Identity(A.rows(), A.cols());
    Matrix U = lu.matrixLU().triangularView<Eigen::Upper>();
    
    return {L, U};
}

Decomposition::QR Decomposition::qr(const Matrix& A) {
    Eigen::HouseholderQR<Matrix> qr(A);
    Matrix Q = qr.householderQ();
    Matrix R = Q.transpose() * A;
    
    return {Q, R};
}

Decomposition::SVD Decomposition::svd(const Matrix& A) {
    Eigen::JacobiSVD<Matrix> svd(A, Eigen::ComputeFullU | Eigen::ComputeFullV);
    
    return {
        svd.matrixU(),
        svd.singularValues(),
        svd.matrixV()
    };
}

Decomposition::EigenDecomposition Decomposition::eigen(const Matrix& A) {
    if (!A.isApprox(A.transpose())) {
        // Non-symmetric matrix - use complex eigenvalues
        Eigen::EigenSolver<Matrix> eigen_solver(A);
        auto eigenvalues = eigen_solver.eigenvalues();
        auto eigenvectors = eigen_solver.eigenvectors();
        
        // Convert real eigenvalues to complex
        ComplexVector evals(eigenvalues.size());
        for (int i = 0; i < eigenvalues.size(); ++i) {
            evals(i) = std::complex<double>(eigenvalues(i), 0);
        }
        
        return {evals, eigenvectors};
    } else {
        // Symmetric matrix - use real eigenvalues
        Eigen::SelfAdjointEigenSolver<Matrix> eigen_solver(A);
        auto eigenvalues = eigen_solver.eigenvalues();
        auto eigenvectors = eigen_solver.eigenvectors();
        
        // Convert to complex
        ComplexVector evals(eigenvalues.size());
        ComplexMatrix evects(eigenvectors.rows(), eigenvectors.cols());
        
        for (int i = 0; i < eigenvalues.size(); ++i) {
            evals(i) = std::complex<double>(eigenvalues(i), 0);
        }
        for (int i = 0; i < eigenvectors.rows(); ++i) {
            for (int j = 0; j < eigenvectors.cols(); ++j) {
                evects(i, j) = std::complex<double>(eigenvectors(i, j), 0);
            }
        }
        
        return {evals, evects};
    }
}

Matrix Decomposition::diagonalize(const Matrix& A) {
    auto decomp = eigen(A);
    Matrix diag = Matrix::Zero(A.rows(), A.cols());
    
    for (int i = 0; i < decomp.eigenvalues.size(); ++i) {
        diag(i, i) = decomp.eigenvalues(i).real();
    }
    
    return diag;
}

// ============================================================================
// VectorOps Implementation
// ============================================================================

double VectorOps::dot(const Vector& a, const Vector& b) {
    if (a.size() != b.size()) {
        throw std::runtime_error("Vectors must have same dimension for dot product");
    }
    return a.dot(b);
}

Vector VectorOps::cross(const Vector& a, const Vector& b) {
    if (a.size() != 3 || b.size() != 3) {
        throw std::runtime_error("Cross product requires 3D vectors");
    }
    
    Vector result(3);
    result(0) = a(1) * b(2) - a(2) * b(1);
    result(1) = a(2) * b(0) - a(0) * b(2);
    result(2) = a(0) * b(1) - a(1) * b(0);
    
    return result;
}

Vector VectorOps::projection(const Vector& a, const Vector& b) {
    double dot_product = dot(a, b);
    double b_norm_sq = dot(b, b);
    
    if (std::abs(b_norm_sq) < 1e-10) {
        throw std::runtime_error("Cannot project onto zero vector");
    }
    
    return (dot_product / b_norm_sq) * b;
}

std::vector<Vector> VectorOps::gram_schmidt(const std::vector<Vector>& vectors) {
    std::vector<Vector> orthonormal;
    
    for (size_t k = 0; k < vectors.size(); ++k) {
        Vector u_k = vectors[k];
        
        // Subtract projections onto all previous orthonormal vectors
        for (const auto& e : orthonormal) {
            u_k -= dot(vectors[k], e) * e;
        }
        
        // Normalize
        double norm = u_k.norm();
        if (norm > 1e-10) {
            orthonormal.push_back(u_k / norm);
        }
    }
    
    return orthonormal;
}

// ============================================================================
// LinearSystem Implementation
// ============================================================================

Vector LinearSystem::solve(const Matrix& A, const Vector& b) {
    if (A.rows() != b.size()) {
        throw std::runtime_error("Matrix rows must equal vector size");
    }
    
    // Use Eigen's solver
    return A.colPivHouseholderQr().solve(b);
}

Matrix LinearSystem::rref(const Matrix& A) {
    Matrix result = A;
    int rows = result.rows();
    int cols = result.cols();
    int lead = 0;
    
    for (int r = 0; r < rows; ++r) {
        if (lead >= cols) return result;
        
        // Find pivot
        int i = r;
        while (std::abs(result(i, lead)) < 1e-10) {
            i++;
            if (i == rows) {
                i = r;
                lead++;
                if (lead == cols) return result;
            }
        }
        
        // Swap rows
        result.row(i).swap(result.row(r));
        
        // Scale pivot row
        result.row(r) /= result(r, lead);
        
        // Eliminate column
        for (int k = 0; k < rows; ++k) {
            if (k != r) {
                result.row(k) -= result(k, lead) * result.row(r);
            }
        }
        lead++;
    }
    
    return result;
}

} // namespace binary::linear
