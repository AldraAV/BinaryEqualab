#include "ode_solvers.hpp"
#include <cmath>
#include <iostream>

namespace equacore {

    ODESolver::Result ODESolver::solve(SystemFunc f, const Eigen::Vector2d& t_span, const Eigen::VectorXd& y0, double dt, Method method) {
        double t_start = t_span[0];
        double t_end = t_span[1];
        
        // Estimate number of steps
        size_t steps = static_cast<size_t>(std::ceil((t_end - t_start) / dt));
        
        Result result;
        result.t.resize(steps + 1);
        result.y.reserve(steps + 1);

        // Initial condition
        result.t[0] = t_start;
        result.y.push_back(y0);

        Eigen::VectorXd current_y = y0;
        double current_t = t_start;

        for (size_t i = 0; i < steps; ++i) {
            switch (method) {
                case Method::Euler:
                    current_y = stepEuler(f, current_t, current_y, dt);
                    break;
                case Method::RungeKutta4:
                    current_y = stepRK4(f, current_t, current_y, dt);
                    break;
                default: // Default to RK4
                    current_y = stepRK4(f, current_t, current_y, dt);
                    break;
            }
            current_t += dt;
            
            // Store results
            result.t[i + 1] = current_t;
            result.y.push_back(current_y);
        }

        return result;
    }

    Eigen::VectorXd ODESolver::stepEuler(SystemFunc f, double t, const Eigen::VectorXd& y, double dt) {
        return y + dt * f(t, y);
    }

    Eigen::VectorXd ODESolver::stepRK4(SystemFunc f, double t, const Eigen::VectorXd& y, double dt) {
        Eigen::VectorXd k1 = f(t, y);
        Eigen::VectorXd k2 = f(t + 0.5 * dt, y + 0.5 * dt * k1);
        Eigen::VectorXd k3 = f(t + 0.5 * dt, y + 0.5 * dt * k2);
        Eigen::VectorXd k4 = f(t + dt, y + dt * k3);

        return y + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
    }

} // namespace equacore
