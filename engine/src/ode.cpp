#include "ode.hpp"
#include <cmath>
#include <iostream>

namespace equacore {

    // Helper: Standard RK4 Stepper
    VectorXd BioODESolver::stepRK4(std::function<VectorXd(double, const VectorXd&)> f, double t, const VectorXd& y, double dt) {
        VectorXd k1 = f(t, y);
        VectorXd k2 = f(t + 0.5 * dt, y + 0.5 * dt * k1);
        VectorXd k3 = f(t + 0.5 * dt, y + 0.5 * dt * k2);
        VectorXd k4 = f(t + dt, y + dt * k3);
        return y + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
    }

    // --- 1. Bergman Minimal Model (Glucose-Insulin) ---
    // Equations:
    // dG/dt = -(p1 + X)G + p1*Gb
    // dX/dt = -p2*X + p3(I - Ib)
    // dI/dt = -n(I - Ib) + gamma*(G - h)+ ... (Simplified here: decay towards basal + absorption if meal)
    // note: This is a simplified educational version usually used in these sims.
    // y[0] = G (mg/dL), y[1] = X (1/min), y[2] = I (muU/mL)
    
    BioODESolver::SimulationResult BioODESolver::simulate_glucose_insulin(
        double t_start, double t_end, double dt, 
        const VectorXd& y0, 
        const BergmanParams& p) 
    {
        auto steps = static_cast<size_t>(std::ceil((t_end - t_start) / dt));
        SimulationResult res;
        res.t = VectorXd::LinSpaced(steps + 1, t_start, t_end);
        res.y.reserve(steps + 1);
        res.y.push_back(y0);

        VectorXd y = y0;
        double t = t_start;

        auto system = [&](double t, const VectorXd& curr_y) -> VectorXd {
            double G = curr_y[0];
            double X = curr_y[1];
            double I = curr_y[2];

            VectorXd dydt(3);
            
            // Bergman equations
            dydt[0] = -(p.p1 + X) * G + p.p1 * p.Gb; // Glucose dynamics
            dydt[1] = -p.p2 * X + p.p3 * (I - p.Ib); // Remote insulin action
            
            // Insulin dynamics: simplified first order decay + bolus is usually initial condition
            // Or we could add a meal function D(t). Assuming I(t) is driven by initial meal for IVGTT
            // For oral, dI/dt needs gut absorption.
            // Let's assume standard IVGTT response decay for simplicity in v1.
            dydt[2] = -p.n * (I - p.Ib); 
            
            // Enhance: Add glucose dependent insulin secretion if needed (pancreas model)
            // if (G > p.Gb) dydt[2] += ...
            
            return dydt;
        };

        for (size_t i = 0; i < steps; ++i) {
            y = stepRK4(system, t, y, dt);
            t += dt;
            res.y.push_back(y);
        }
        return res;
    }

    // --- 2. Pharmacokinetics (1-Compartment) ---
    // Oral:
    // dAg/dt = -ka * Ag  (Ag: Amount in gut)
    // dAc/dt = ka * Ag - ke * Ac (Ac: Amount in central)
    // Concentration C = Ac / Vd
    
    BioODESolver::SimulationResult BioODESolver::simulate_pk_1cmt(
        double t_start, double t_end, double dt,
        const VectorXd& y0,
        const PKParams& p)
    {
        auto steps = static_cast<size_t>(std::ceil((t_end - t_start) / dt));
        SimulationResult res;
        res.t = VectorXd::LinSpaced(steps + 1, t_start, t_end);
        res.y.reserve(steps + 1);
        res.y.push_back(y0);

        VectorXd y = y0;
        double t = t_start;

        auto system = [&](double t, const VectorXd& curr_y) -> VectorXd {
            VectorXd dydt = VectorXd::Zero(curr_y.size());
            
            if (p.oral) {
                // y[0] = Ag (Gut), y[1] = Ac (Central)
                double Ag = curr_y[0];
                double Ac = curr_y[1];
                dydt[0] = -p.ka * Ag;
                dydt[1] = p.ka * Ag - p.ke * Ac;
            } else {
                // IV Bolus: y[0] = Ac
                // dAc/dt = -ke * Ac
                double Ac = curr_y[0];
                dydt[0] = -p.ke * Ac;
            }
            return dydt;
        };

        for (size_t i = 0; i < steps; ++i) {
            y = stepRK4(system, t, y, dt);
            t += dt;
            res.y.push_back(y);
        }
        return res;
    }

    // --- 3. Windkessel (2-Element) ---
    // Parallel RC circuit analogy.
    // I(t) = Flow Q(t) from heart.
    // C * dP/dt + P/R = Q(t)
    // dP/dt = (Q(t) - P/R) / C
    
    BioODESolver::SimulationResult BioODESolver::simulate_windkessel(
        double t_start, double t_end, double dt,
        const VectorXd& y0,
        const WindkesselParams& p,
        double heart_rate)
    {
        auto steps = static_cast<size_t>(std::ceil((t_end - t_start) / dt));
        SimulationResult res;
        res.t = VectorXd::LinSpaced(steps + 1, t_start, t_end);
        res.y.reserve(steps + 1);
        res.y.push_back(y0);

        VectorXd y = y0;
        double t = t_start;
        double cycle_duration = 60.0 / heart_rate;

        // Simple Half-Sine Systole Flow Model
        auto get_flow = [&](double time) -> double {
            double local_t = std::fmod(time, cycle_duration);
            double systole_len = 0.3 * std::sqrt(cycle_duration); // Bazett-like scaling approximation
            if (local_t < systole_len) {
                return std::sin((3.14159 * local_t) / systole_len) * 500.0; // Arbitrary flow scale
            }
            return 0.0; // Diastole
        };

        auto system = [&](double t, const VectorXd& curr_y) -> VectorXd {
            double P = curr_y[0]; // Pressure
            double Q = get_flow(t);
            
            VectorXd dydt(1);
            // dP/dt = (Q - (P - P_venous)/R) / C
            dydt[0] = (Q - (P - p.P_venous) / p.R) / p.C;
            return dydt;
        };

        for (size_t i = 0; i < steps; ++i) {
            y = stepRK4(system, t, y, dt);
            t += dt;
            res.y.push_back(y);
        }
        return res;
    }
    
    // --- 4. Hodgkin-Huxley Neuron ---
    // Standard HH equations
    BioODESolver::SimulationResult BioODESolver::simulate_hodgkin_huxley(
        double t_start, double t_end, double dt,
        const VectorXd& y0,
        const HHParams& p)
    {
        auto steps = static_cast<size_t>(std::ceil((t_end - t_start) / dt));
        SimulationResult res;
        res.t = VectorXd::LinSpaced(steps + 1, t_start, t_end);
        res.y.reserve(steps + 1);
        res.y.push_back(y0);

        VectorXd y = y0;
        double t = t_start;
        
        // Helper functions for alpha/beta rate constants
        auto alpha_n = [](double V) { return 0.01 * (V + 55) / (1 - std::exp(-(V + 55) / 10)); };
        auto beta_n  = [](double V) { return 0.125 * std::exp(-(V + 65) / 80); };
        auto alpha_m = [](double V) { return 0.1 * (V + 40) / (1 - std::exp(-(V + 40) / 10)); };
        auto beta_m  = [](double V) { return 4.0 * std::exp(-(V + 65) / 18); };
        auto alpha_h = [](double V) { return 0.07 * std::exp(-(V + 65) / 20); };
        auto beta_h  = [](double V) { return 1.0 / (1 + std::exp(-(V + 35) / 10)); };

        auto system = [&](double t, const VectorXd& curr_y) -> VectorXd {
            double V = curr_y[0];
            double m = curr_y[1];
            double h = curr_y[2];
            double n = curr_y[3];
            
            VectorXd dydt(4);
            
            // Currents
            double I_Na = p.g_Na * std::pow(m, 3) * h * (V - p.E_Na);
            double I_K  = p.g_K  * std::pow(n, 4)     * (V - p.E_K);
            double I_L  = p.g_L                       * (V - p.E_L);
            
            // Membrane equation
            dydt[0] = (p.I_ext - I_Na - I_K - I_L) / p.C_m;
            
            // Gating variables
            dydt[1] = alpha_m(V) * (1 - m) - beta_m(V) * m;
            dydt[2] = alpha_h(V) * (1 - h) - beta_h(V) * h;
            dydt[3] = alpha_n(V) * (1 - n) - beta_n(V) * n;
            
            return dydt;
        };

        for (size_t i = 0; i < steps; ++i) {
            y = stepRK4(system, t, y, dt);
            t += dt;
            res.y.push_back(y);
        }
        return res;

    }

} // namespace equacore
