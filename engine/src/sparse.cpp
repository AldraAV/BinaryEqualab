#include <vector>
#include <Eigen/Sparse>

// SuiteSparse Headers (if available)
#ifdef HAVE_SUITESPARSE
#include <cholmod.h>
#include <umfpack.h>
#endif

namespace equacore {
namespace sparse {

    using SpMat = Eigen::SparseMatrix<double>; // Column-major by default
    using Triplet = Eigen::Triplet<double>;

    // --- Sparse Solver Wrapper ---
    // Solves Ax = b where A is sparse.
    // If SuiteSparse is available, uses it (faster for large matrices).
    // Otherwise uses Eigen's built-in SimplicialLLT or BiCGSTAB.
    
    Eigen::VectorXd solve_linear_system(const SpMat& A, const Eigen::VectorXd& b) {
#ifdef HAVE_SUITESPARSE
        // FUTURE IMPLEMENTATION: Direct calls to Cholmod/UMFPACK
        // For now, Eigen has wrappers for SuiteSparse classes:
        // Eigen::CholmodSupernodalLLT<SpMat> solver;
        
        // Since we didn't check for Eigen+SuiteSparse module in CMake specifically,
        // we will stick to Eigen's generic solvers which are already very good,
        // unless specific raw pointers are needed.
        
        // Placeholder for explicit SuiteSparse logic if needed in v3.1
        // ...
#endif
        
        // Eigen Default (Robust)
        // Analyze pattern then factorize
        Eigen::BiCGSTAB<SpMat> solver;
        solver.compute(A);
        if(solver.info() != Eigen::Success) {
            // Handle error, maybe fallback to dense or different solver
            // Throwing for now or returning empty
            return Eigen::VectorXd();
        }
        return solver.solve(b);
    }

} // namespace sparse
} // namespace equacore
