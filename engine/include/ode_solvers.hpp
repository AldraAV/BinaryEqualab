#pragma once

#include <vector>
#include <functional>
#include <Eigen/Dense>

namespace equacore {

    // Define system function type: dy/dt = f(t, y)
    // y is a vector state, t is time
    using SystemFunc = std::function<Eigen::VectorXd(double, const Eigen::VectorXd&)>;

    class ODESolver {
    public:
        enum class Method {
            Euler,
            RungeKutta4,
            RungeKutta45 // Adaptive (Future implementation)
        };

        struct Result {
            Eigen::VectorXd t;          // Time points
            std::vector<Eigen::VectorXd> y; // State vectors at each time point
        };

        // Solve IVP (Initial Value Problem)
        // t_span: [start, end]
        // y0: initial state vector
        // dt: time step (fixed for now)
        static Result solve(SystemFunc f, const Eigen::Vector2d& t_span, const Eigen::VectorXd& y0, double dt, Method method = Method::RungeKutta4);

    private:
        static Eigen::VectorXd stepEuler(SystemFunc f, double t, const Eigen::VectorXd& y, double dt);
        static Eigen::VectorXd stepRK4(SystemFunc f, double t, const Eigen::VectorXd& y, double dt);
    };

} // namespace equacore
